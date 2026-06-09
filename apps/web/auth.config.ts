import type { NextAuthConfig } from 'next-auth';
import Apple from 'next-auth/providers/apple';
import Facebook from 'next-auth/providers/facebook';
import Google from 'next-auth/providers/google';

const providers: NextAuthConfig['providers'] = [];
const AUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-secret-munay-portal-2026';

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false
    })
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: false
    })
  );
}

if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_ID,
      clientSecret: process.env.APPLE_SECRET
    })
  );
}

const authConfig = {
  trustHost: true,
  secret: AUTH_SECRET,
  providers,
  pages: {
    signIn: '/login',
    error: '/login'
  }
} satisfies NextAuthConfig;

export default authConfig;
