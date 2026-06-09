-- CreateEnum
CREATE TYPE "SmtpEncryption" AS ENUM ('SSL', 'TLS', 'NONE');

-- AlterTable
ALTER TABLE "SiteSetting"
ADD COLUMN     "smtpEncryption" "SmtpEncryption" NOT NULL DEFAULT 'SSL',
ADD COLUMN     "smtpHost" TEXT,
ADD COLUMN     "smtpPasswordEncrypted" TEXT,
ADD COLUMN     "smtpPasswordUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "smtpPort" INTEGER NOT NULL DEFAULT 465,
ADD COLUMN     "smtpSenderEmail" TEXT,
ADD COLUMN     "smtpSenderName" TEXT NOT NULL DEFAULT 'Munay Imóveis',
ADD COLUMN     "smtpTimeout" INTEGER NOT NULL DEFAULT 10000,
ADD COLUMN     "smtpUsername" TEXT;

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailTemplate_slug_key" ON "EmailTemplate"("slug");

INSERT INTO "EmailTemplate" ("id", "slug", "name", "subject", "htmlBody", "createdAt", "updatedAt")
VALUES (
  'email-template-password-reset',
  'PASSWORD_RESET',
  'Recuperação de Senha',
  'Recuperação de senha - Munay Imóveis',
  '<div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;"><p style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#b48846;margin:0 0 16px;">Munay Imóveis</p><h2 style="margin:0 0 16px;">Recuperação de senha</h2><p>Olá, {{NOME}}.</p><p>Recebemos uma solicitação para redefinir a senha da conta <strong>{{EMAIL}}</strong>.</p><p>Use o link abaixo para criar uma nova senha. Este link expira em <strong>30 minutos</strong> e só pode ser utilizado uma única vez.</p><p style="margin:24px 0;"><a href="{{LINK_RESET}}" style="display:inline-block;padding:14px 22px;background:#c9a55c;color:#08110d;text-decoration:none;border-radius:999px;font-weight:700;">Redefinir minha senha</a></p><p>Se preferir, copie e cole este endereço no navegador:</p><p style="word-break:break-all;">{{LINK_RESET}}</p><p>Se você não solicitou esta alteração, ignore este e-mail.</p></div>',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("slug") DO NOTHING;
