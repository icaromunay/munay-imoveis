import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_PATHS = ['/', '/imoveis', '/casas', '/terrenos', '/lancamentos', '/empreendimentos', '/sitemap.xml'];

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret') || '';

  if (!process.env.JWT_SECRET || secret !== process.env.JWT_SECRET) {
    return NextResponse.json({ message: 'Não autorizado para revalidar.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const requestedPaths = Array.isArray(body?.paths) ? body.paths : [];
  const uniquePaths = [...new Set([...DEFAULT_PATHS, ...requestedPaths].map((path) => String(path || '').trim()).filter(Boolean))];

  uniquePaths.forEach((path) => revalidatePath(path));

  return NextResponse.json(
    {
      revalidated: true,
      paths: uniquePaths
    },
    {
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
}
