import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const settings = await prisma.siteSetting.findFirst({ select: { indexNowKey: true } });
  const key = settings?.indexNowKey || 'munay-indexnow-key';

  return new NextResponse(key, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
