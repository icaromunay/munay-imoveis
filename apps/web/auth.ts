import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import type { Role } from '@/lib/generated/prisma';
import authConfig from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { ADMIN_EMAIL, ADMIN_EMAIL_ALIASES, canonicalizeAdminEmail, isAdminEmail, normalizeEmail, resolveRole } from '@/lib/auth-role';

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const SESSION_UPDATE_AGE = 60 * 60 * 12;
const AUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-secret-munay-portal-2026';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Brend@12';

async function ensureAdminUser() {
  const email = normalizeEmail(ADMIN_EMAIL);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  return prisma.user.upsert({
    where: { email },
    update: {
      name: 'Ícarõ Munay',
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date()
    },
    create: {
      name: 'Ícarõ Munay',
      email,
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date()
    }
  });
}

const credentialsProvider = Credentials({
  name: 'Credenciais',
  credentials: {
    email: { label: 'E-mail', type: 'email' },
    password: { label: 'Senha', type: 'password' }
  },
  async authorize(credentials) {
    const email = canonicalizeAdminEmail(String(credentials?.email || ''));
    const password = String(credentials?.password || '');

    if (!email || !password) {
      return null;
    }

    try {
      if (isAdminEmail(email)) {
        await ensureAdminUser();
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) {
        return null;
      }

      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        return null;
      }

      return {
        id: user.id,
        name: user.name || (user.role === 'ADMIN' ? 'Ícarõ Munay' : 'Usuário'),
        email: user.email,
        image: user.image,
        role: user.role
      };
    } catch (error) {
      console.error('Falha ao validar login por credenciais:', error);
      return null;
    }
  }
});

const authAdapter = PrismaAdapter(prisma as Parameters<typeof PrismaAdapter>[0]);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: AUTH_SECRET,
  adapter: authAdapter,
  providers: [...authConfig.providers, credentialsProvider],
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE
  },
  jwt: {
    maxAge: SESSION_MAX_AGE
  },
  callbacks: {
    async signIn({ user }) {
      return Boolean(user.email);
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (user?.name) {
        token.name = user.name;
      }

      if (user?.image) {
        token.picture = user.image;
      }

      const email = canonicalizeAdminEmail(user?.email ?? token.email);
      if (email) {
        token.email = email;
      }

      const incomingRole = typeof user === 'object' && user && 'role' in user ? (user.role as Role | undefined) : undefined;
      token.role = incomingRole ?? resolveRole(email);

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.name = token.name ?? session.user.name;
        session.user.email = token.email ?? session.user.email ?? '';
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
        session.user.role = (token.role as Role | undefined) ?? resolveRole(token.email);
      }

      return session;
    }
  },
  events: {
    async signIn({ user }) {
      if (!user.email) return;

      try {
        await prisma.user.updateMany({
          where: {
            email: isAdminEmail(user.email)
              ? { in: ADMIN_EMAIL_ALIASES }
              : canonicalizeAdminEmail(user.email)
          },
          data: { role: resolveRole(user.email) }
        });
      } catch (error) {
        console.error('Falha ao sincronizar role do usuário:', error);
      }
    }
  }
});
