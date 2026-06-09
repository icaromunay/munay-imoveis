import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || env.CORS_ORIGINS[0] || 'http://localhost:3000';
}

export async function notifyIndexNowPath(path: string) {
  try {
    const settings = await prisma.siteSetting.findFirst({ select: { indexNowKey: true } });
    const key = settings?.indexNowKey || 'munay-indexnow-key';
    const siteUrl = getSiteUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const targetUrl = new URL(normalizedPath, siteUrl).toString();
    const keyLocation = new URL('/indexnow-key.txt', siteUrl).toString();

    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: new URL(siteUrl).host,
        key,
        keyLocation,
        urlList: [targetUrl]
      })
    });
  } catch (error) {
    console.error('Falha ao notificar IndexNow:', error);
  }
}
