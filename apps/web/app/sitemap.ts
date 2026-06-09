import type { MetadataRoute } from 'next';
import { getPosts, getProperties } from '@/lib/api';
import { getPropertyDetailPath } from '@/lib/property-utils';
import { siteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [properties, posts] = await Promise.all([getProperties('?limit=500'), getPosts()]);
  const baseUrl = siteUrl;
  const now = new Date();

  const staticRoutes = [
    '/',
    '/imoveis',
    '/casas',
    '/terrenos',
    '/lancamentos',
    '/empreendimentos',
    '/blog',
    '/sobre',
    '/simulador',
    '/contato',
    '/vender-seu-imovel',
    '/cadastro-proprietario',
    '/politica-de-privacidade'
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: (route === '/' ? 'daily' : route === '/blog' || route === '/imoveis' ? 'weekly' : 'monthly') as MetadataRoute.Sitemap[number]['changeFrequency'],
      priority: route === '/' ? 1 : route === '/blog' || route === '/imoveis' ? 0.9 : 0.8
    })),
    ...properties.map((property) => ({
      url: `${baseUrl}${getPropertyDetailPath(property)}`,
      lastModified: new Date(property.updatedAt || property.createdAt || now),
      changeFrequency: 'daily' as const,
      priority: property.featured ? 0.9 : 0.8
    })),
    ...posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))
  ];
}
