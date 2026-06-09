import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/auth.config';
import { resolveRole } from '@/lib/auth-role';
import { getApiBaseUrl } from '@/lib/api-base';

const { auth } = NextAuth(authConfig);
const apiUrl = getApiBaseUrl();

function isProtectedAdminPath(pathname: string) {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/configuracoes' ||
    pathname.startsWith('/configuracoes/')
  );
}

function shouldSkipRedirectLookup(pathname: string) {
  return (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/uploads') ||
    pathname === '/favicon.ico' ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

async function resolveManagedRedirect(pathname: string) {
  try {
    const response = await fetch(`${apiUrl}/redirects/resolve?path=${encodeURIComponent(pathname)}`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as { destination: string; type: 301 | 302 } | null;
  } catch {
    return null;
  }
}

export default auth(async (req) => {
  const { pathname, search } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth?.user);
  const isAdmin = resolveRole(req.auth?.user?.email) === 'ADMIN';

  if (pathname === '/login' && isLoggedIn) {
    return NextResponse.redirect(new URL(isAdmin ? '/admin' : '/area-do-proprietario', req.nextUrl));
  }

  if (isProtectedAdminPath(pathname)) {
    if (!isLoggedIn) {
      const url = new URL('/login', req.nextUrl);
      const next = `${pathname}${search}`;
      if (next && next !== '/') {
        url.searchParams.set('next', next);
      }
      return NextResponse.redirect(url);
    }

    if (!isAdmin) {
      return NextResponse.redirect(new URL('/acesso-negado', req.nextUrl));
    }
  }

  if (!shouldSkipRedirectLookup(pathname)) {
    const managedRedirect = await resolveManagedRedirect(pathname);
    if (managedRedirect?.destination) {
      const destination = new URL(managedRedirect.destination, req.nextUrl.origin);
      return NextResponse.redirect(destination, managedRedirect.type);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
