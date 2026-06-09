import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';
import { encryptSecret } from './lib/smtp-crypto';
import { testSmtpSettings } from './lib/email-service';
import { POST as requestPasswordReset } from './app/api/auth/reset-password/route';
import { POST as confirmPasswordReset } from './app/api/auth/reset-password/confirm/route';
import { PASSWORD_RESET_CHANGED_MESSAGE, PASSWORD_RESET_SUCCESS_MESSAGE } from './lib/password-reset';

const mode = process.argv[2];
const artifactsDir = path.join(process.cwd(), 'tmp-validation-artifacts');
const metaFile = path.join(artifactsDir, 'password-reset-meta.json');
const tokenFile = path.join(artifactsDir, 'password-reset-token.json');

const smtpUser = String(process.env.SMTP_USER || 'imob@munay.com.br').trim().toLowerCase();
const smtpPass = String(process.env.SMTP_PASS || '');
const smtpHost = String(process.env.SMTP_HOST || 'smtp.titan.email').trim();
const senderName = 'Munay Imóveis';
const newPassword = 'NovaSenha@2026!';
const oldPassword = 'SenhaAnterior@2026!';

async function ensureArtifactsDir() {
  await fs.mkdir(artifactsDir, { recursive: true });
}

async function writeJson(filePath: string, data: unknown) {
  await ensureArtifactsDir();
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

async function setupSmtpAndUser() {
  if (!smtpPass) {
    throw new Error('SMTP_PASS não foi definido no ambiente para os testes reais.');
  }

  const passwordHash = await bcrypt.hash(oldPassword, 12);
  const siteSetting = await prisma.siteSetting.findFirst();

  if (!siteSetting) {
    await prisma.siteSetting.create({
      data: {
        smtpSenderName: senderName,
        smtpSenderEmail: smtpUser,
        smtpHost,
        smtpPort: 465,
        smtpEncryption: 'SSL',
        smtpUsername: smtpUser,
        smtpPasswordEncrypted: encryptSecret(smtpPass),
        smtpTimeout: 10000
      }
    });
  } else {
    await prisma.siteSetting.update({
      where: { id: siteSetting.id },
      data: {
        smtpSenderName: senderName,
        smtpSenderEmail: smtpUser,
        smtpHost,
        smtpPort: 465,
        smtpEncryption: 'SSL',
        smtpUsername: smtpUser,
        smtpPasswordEncrypted: encryptSecret(smtpPass),
        smtpTimeout: 10000,
        smtpPasswordUpdatedAt: new Date()
      }
    });
  }

  const user = await prisma.user.upsert({
    where: { email: smtpUser },
    update: {
      name: 'Ícarõ Munay',
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date()
    },
    create: {
      name: 'Ícarõ Munay',
      email: smtpUser,
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date()
    },
    select: {
      id: true,
      email: true,
      name: true
    }
  });

  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      used: false
    },
    data: {
      used: true
    }
  });

  return user;
}

async function runRequestFlow() {
  const user = await setupSmtpAndUser();
  const startedAt = new Date().toISOString();

  await testSmtpSettings(smtpUser);

  const response = await requestPasswordReset(
    new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'http://localhost:3000'
      },
      body: JSON.stringify({ email: smtpUser })
    })
  );

  const body = await response.json();

  if (response.status !== 200) {
    throw new Error(`RESET_REQUEST_STATUS_${response.status}: ${JSON.stringify(body)}`);
  }

  if (body?.message !== PASSWORD_RESET_SUCCESS_MESSAGE) {
    throw new Error(`RESET_REQUEST_MESSAGE_UNEXPECTED: ${JSON.stringify(body)}`);
  }

  await writeJson(metaFile, {
    startedAt,
    userEmail: smtpUser,
    userName: user.name,
    newPassword,
    expectedTestSubject: 'Teste de SMTP - Munay Imóveis',
    expectedResetSubject: 'Recuperação de senha - Munay Imóveis'
  });

  console.log(JSON.stringify({ step: 'request', ok: true, startedAt, userEmail: smtpUser }, null, 2));
}

type TokenPayload = {
  token: string;
  resetLink: string;
};

type MetaPayload = {
  startedAt: string;
  userEmail: string;
  userName: string;
  newPassword: string;
};

async function runConfirmFlow() {
  const meta = await readJson<MetaPayload>(metaFile);
  const tokenPayload = await readJson<TokenPayload>(tokenFile);

  const response = await confirmPasswordReset(
    new Request('http://localhost:3000/api/auth/reset-password/confirm', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        token: tokenPayload.token,
        password: meta.newPassword,
        confirmPassword: meta.newPassword
      })
    })
  );

  const body = await response.json();

  if (response.status !== 200) {
    throw new Error(`RESET_CONFIRM_STATUS_${response.status}: ${JSON.stringify(body)}`);
  }

  if (body?.message !== PASSWORD_RESET_CHANGED_MESSAGE) {
    throw new Error(`RESET_CONFIRM_MESSAGE_UNEXPECTED: ${JSON.stringify(body)}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: meta.userEmail },
    select: {
      passwordHash: true
    }
  });

  if (!user?.passwordHash) {
    throw new Error('PASSWORD_HASH_NOT_FOUND_AFTER_RESET');
  }

  const passwordMatches = await bcrypt.compare(meta.newPassword, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('NEW_PASSWORD_NOT_PERSISTED');
  }

  const reused = await confirmPasswordReset(
    new Request('http://localhost:3000/api/auth/reset-password/confirm', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        token: tokenPayload.token,
        password: meta.newPassword,
        confirmPassword: meta.newPassword
      })
    })
  );

  const reusedBody = await reused.json();

  if (reused.status !== 400) {
    throw new Error(`RESET_REUSE_EXPECTED_400_GOT_${reused.status}: ${JSON.stringify(reusedBody)}`);
  }

  console.log(
    JSON.stringify(
      {
        step: 'confirm',
        ok: true,
        resetLink: tokenPayload.resetLink,
        inboxConfirmed: true,
        passwordUpdated: true,
        tokenReuseBlocked: true
      },
      null,
      2
    )
  );
}

async function main() {
  if (mode === 'request') {
    await runRequestFlow();
    return;
  }

  if (mode === 'confirm') {
    await runConfirmFlow();
    return;
  }

  throw new Error(`Modo inválido: ${mode}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
