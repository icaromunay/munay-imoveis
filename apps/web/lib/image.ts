const UNSPLASH_HOST = 'images.unsplash.com';

export function optimizeImageUrl(url: string, width = 1200, quality = 75) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname === UNSPLASH_HOST) {
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('fm', 'webp');
      parsed.searchParams.set('q', String(quality));
      parsed.searchParams.set('w', String(width));
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

export function getPropertyThumbnailUrl(url: string) {
  if (!url) return url;

  if (url.startsWith('/uploads/properties/') || url.startsWith('/api/uploads/properties/')) {
    // Hotfix de compatibilidade: imóveis antigos podem não ter o arquivo
    // físico "-thumb.webp". Nesses casos, usar a imagem principal evita
    // quebrar a ficha do imóvel e os cards enquanto preservamos compatibilidade.
    return url;
  }

  return optimizeImageUrl(url, 400, 72);
}
