import type { Metadata } from 'next';
import { categoryLabel, formatCurrency } from './format';
import { buildPropertyUrl, getPropertyDetailPath } from './property-utils';
import type { Post, Property } from './types';

export const siteName = 'Munay Imóveis';
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const defaultDescription =
  'Munay Imóveis: compra, venda e investimento em imóveis, terrenos, apartamentos, casas e oportunidades imobiliárias com atendimento profissional.';
export const defaultImage =
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&fm=webp&w=1200&q=75';

function toAbsoluteUrl(path = '/') {
  return new URL(path, siteUrl).toString();
}

function stripHtml(value?: string | null) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimDescription(value?: string | null, limit = 160) {
  const clean = stripHtml(value);
  if (!clean) return defaultDescription;
  return clean.length > limit ? `${clean.slice(0, limit - 1).trim()}…` : clean;
}

function getPropertySectionPath(property: Pick<Property, 'category'>) {
  if (property.category === 'TERRENO') return '/terrenos';
  if (property.category === 'LOTEAMENTO') return '/lancamentos';
  return '/casas';
}

function getPropertySectionLabel(property: Pick<Property, 'category'>) {
  if (property.category === 'TERRENO') return 'Terrenos';
  if (property.category === 'LOTEAMENTO') return 'Loteamentos';
  return 'Imóveis';
}

function buildAddress(property: Pick<Property, 'city' | 'district' | 'state'>) {
  return {
    '@type': 'PostalAddress',
    addressLocality: property.city,
    addressRegion: property.state,
    addressCountry: 'BR',
    streetAddress: property.district
  };
}

function buildGeo(property: Pick<Property, 'latitude' | 'longitude'>) {
  if (typeof property.latitude !== 'number' || typeof property.longitude !== 'number') {
    return undefined;
  }

  return {
    '@type': 'GeoCoordinates',
    latitude: property.latitude,
    longitude: property.longitude
  };
}

export function buildMetadata({
  title,
  description = defaultDescription,
  image = defaultImage,
  path = '/',
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  keywords
}: {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  keywords?: string[];
}): Metadata {
  const canonicalUrl = toAbsoluteUrl(path);

  return {
    title,
    description,
    keywords,
    authors: authors?.map((name) => ({ name })),
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName,
      locale: 'pt_BR',
      type,
      publishedTime,
      modifiedTime,
      authors,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  };
}

export function realEstateJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: siteName,
    url: siteUrl,
    areaServed: ['Santa Catarina', 'Rio Grande do Sul'],
    makesOffer: {
      '@type': 'OfferCatalog',
      name: 'Imóveis, terrenos, apartamentos, casas e loteamentos'
    }
  };
}

export function buildBlogMetadata(post: Post): Metadata {
  return buildMetadata({
    title: post.title,
    description: trimDescription(post.excerpt),
    image: post.coverImage,
    path: `/blog/${post.slug}`,
    type: 'article',
    publishedTime: post.createdAt,
    modifiedTime: post.updatedAt || post.createdAt,
    authors: [post.author || 'Equipe Munay Imóveis'],
    keywords: ['blog imobiliário', post.category, post.title]
  });
}

export function buildBreadcrumbSchema(items: Array<{ name: string; item: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: toAbsoluteUrl(entry.item)
    }))
  };
}

export function buildBlogSchemas(post: Post) {
  const path = `/blog/${post.slug}`;
  const canonical = toAbsoluteUrl(path);

  return {
    article: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      mainEntityOfPage: canonical,
      headline: post.title,
      description: trimDescription(post.excerpt),
      image: [post.coverImage || defaultImage],
      author: {
        '@type': 'Person',
        name: post.author || 'Equipe Munay Imóveis'
      },
      publisher: {
        '@type': 'Organization',
        name: siteName,
        logo: {
          '@type': 'ImageObject',
          url: defaultImage
        }
      },
      datePublished: post.createdAt,
      dateModified: post.updatedAt || post.createdAt,
      articleSection: post.category,
      inLanguage: 'pt-BR'
    },
    breadcrumb: buildBreadcrumbSchema([
      { name: 'Início', item: '/' },
      { name: 'Blog', item: '/blog' },
      { name: post.title, item: path }
    ])
  };
}

function getOfferAvailability(property: Property) {
  if (property.status === 'SOLD') return 'https://schema.org/SoldOut';
  if (property.status === 'RESERVED') return 'https://schema.org/LimitedAvailability';
  return 'https://schema.org/InStock';
}

function getPropertyTitle(property: Property) {
  const typeLabel = String(property.type || categoryLabel[property.category] || 'Imóvel').trim();
  return `${typeLabel} em ${property.city} • ${property.district} • ${property.propertyCode}`;
}

function getPropertyDescription(property: Property) {
  const categoryText = categoryLabel[property.category] || 'Imóvel';
  const base = `${categoryText} ${property.title} em ${property.city}/${property.state}, ${property.district}. ${stripHtml(property.shortDescription)}`.trim();
  return trimDescription(base);
}

export function buildPropertyMetadata(property: Property): Metadata {
  const title = getPropertyTitle(property);
  return buildMetadata({
    title,
    description: getPropertyDescription(property),
    image: property.coverImage || defaultImage,
    path: getPropertyDetailPath(property),
    publishedTime: property.createdAt,
    modifiedTime: property.updatedAt || property.createdAt,
    authors: [siteName],
    keywords: [property.title, property.city, property.district, categoryLabel[property.category] || property.category, property.propertyCode]
  });
}

export function buildPropertySchemas(property: Property) {
  const canonical = buildPropertyUrl(property);
  const description = getPropertyDescription(property);
  const address = buildAddress(property);
  const geo = buildGeo(property);
  const offer = {
    '@context': 'https://schema.org',
    '@type': 'Offer',
    priceCurrency: 'BRL',
    price: Number(property.promotionalPrice || property.price || 0),
    availability: getOfferAvailability(property),
    url: canonical,
    itemCondition: 'https://schema.org/UsedCondition',
    seller: {
      '@type': 'RealEstateAgent',
      name: siteName,
      url: siteUrl
    }
  };

  const place = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${property.district}, ${property.city}`,
    address,
    geo
  };

  const listingType = property.category === 'LOTEAMENTO' ? 'Product' : 'RealEstateListing';
  const listing = {
    '@context': 'https://schema.org',
    '@type': listingType,
    name: property.title,
    description,
    url: canonical,
    image: [property.coverImage || defaultImage],
    sku: property.propertyCode,
    category: categoryLabel[property.category] || property.category,
    brand: {
      '@type': 'Brand',
      name: siteName
    },
    offers: offer,
    address,
    geo,
    datePosted: property.createdAt,
    dateModified: property.updatedAt || property.createdAt,
    additionalProperty: [
      property.builtArea
        ? {
            '@type': 'PropertyValue',
            name: 'Área construída',
            value: `${property.builtArea} m²`
          }
        : null,
      property.landArea
        ? {
            '@type': 'PropertyValue',
            name: 'Área do terreno',
            value: `${property.landArea} m²`
          }
        : null,
      property.lotsMinArea
        ? {
            '@type': 'PropertyValue',
            name: 'Área mínima dos lotes',
            value: `${property.lotsMinArea} m²`
          }
        : null,
      property.lotsQuantity
        ? {
            '@type': 'PropertyValue',
            name: 'Quantidade de lotes',
            value: String(property.lotsQuantity)
          }
        : null
    ].filter(Boolean),
    areaServed: {
      '@type': 'City',
      name: property.city
    }
  };

  const residence =
    property.category !== 'LOTEAMENTO' && property.category !== 'TERRENO'
      ? {
          '@context': 'https://schema.org',
          '@type': 'Residence',
          name: property.title,
          description,
          url: canonical,
          image: [property.coverImage || defaultImage],
          numberOfRooms: property.bedrooms || undefined,
          numberOfBathroomsTotal: property.bathrooms || undefined,
          numberOfBedrooms: property.bedrooms || undefined,
          floorSize: property.builtArea
            ? {
                '@type': 'QuantitativeValue',
                value: property.builtArea,
                unitCode: 'MTK'
              }
            : undefined,
          address,
          geo,
          offers: offer
        }
      : null;

  return {
    listing,
    place,
    offer,
    residence,
    breadcrumb: buildBreadcrumbSchema([
      { name: 'Início', item: '/' },
      { name: getPropertySectionLabel(property), item: getPropertySectionPath(property) },
      { name: property.title, item: getPropertyDetailPath(property) }
    ])
  };
}

export function formatPropertySeoPrice(property: Property) {
  if (!property.price && !property.promotionalPrice) {
    return 'Sob consulta';
  }

  return formatCurrency(property.promotionalPrice || property.price);
}
