import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/blog/', '/imovel/', '/terreno/', '/loteamento/', '/casas', '/terrenos', '/lancamentos'],
        disallow: ['/admin', '/admin/', '/dashboard', '/dashboard/', '/configuracoes', '/configuracoes/', '/login', '/login/', '/area-do-proprietario', '/area-do-proprietario/', '/api', '/api/']
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
