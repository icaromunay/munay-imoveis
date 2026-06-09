'use client';

import { useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import { getPropertyThumbnailUrl, optimizeImageUrl } from '@/lib/image';

type GalleryImage = {
  url: string;
  alt?: string | null;
};

export function PropertyGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number>(-1);

  const normalizedImages = images.length ? images : [];
  const activeImage = normalizedImages[selectedIndex] || normalizedImages[0];

  const slides = useMemo(
    () =>
      normalizedImages.map((image, index) => ({
        src: optimizeImageUrl(image.url, 1920, 80),
        alt: image.alt || `${title} - Foto ${index + 1}`
      })),
    [normalizedImages, title]
  );

  if (!activeImage) {
    return null;
  }

  return (
    <>
      <div className="mt-8 space-y-4">
        <button
          type="button"
          onClick={() => setOpenIndex(selectedIndex)}
          className="group relative block h-[460px] w-full overflow-hidden rounded-[2rem] border border-white/10 text-left shadow-[0_16px_60px_rgba(0,0,0,0.18)] transition duration-500 hover:border-brand-gold/35"
          aria-label={`Abrir imagem principal ${selectedIndex + 1} de ${normalizedImages.length}`}
        >
          <img
            src={optimizeImageUrl(activeImage.url, 1600, 80)}
            alt={activeImage.alt || `${title} - Foto ${selectedIndex + 1}`}
            className="absolute inset-0 h-full w-full object-cover transition duration-[900ms] group-hover:scale-[1.03]"
            loading="eager"
            decoding="async"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,9,7,0.02),rgba(5,9,7,0.76))] opacity-90 transition group-hover:opacity-100" />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
            <span className="rounded-full border border-white/15 bg-[#08110d]/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white backdrop-blur">
              Imagem principal
            </span>
            <span className="rounded-full border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-gold backdrop-blur">
              Clique para ampliar
            </span>
          </div>
          <div className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white backdrop-blur">
            {selectedIndex + 1} / {normalizedImages.length}
          </div>
        </button>

        {normalizedImages.length > 1 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
            {normalizedImages.map((image, index) => {
              const isActive = index === selectedIndex;

              return (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`group relative h-24 overflow-hidden rounded-[1.3rem] border text-left transition duration-300 ${isActive ? 'border-brand-gold/60 ring-2 ring-brand-gold/20' : 'border-white/10 hover:border-brand-gold/35'}`}
                  aria-label={`Selecionar foto ${index + 1} de ${normalizedImages.length}`}
                >
                  <img
                    src={getPropertyThumbnailUrl(image.url)}
                    alt={image.alt || `${title} - Miniatura ${index + 1}`}
                    className={`absolute inset-0 h-full w-full object-cover transition duration-500 ${isActive ? 'scale-[1.03]' : 'group-hover:scale-[1.04]'}`}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className={`absolute inset-0 transition ${isActive ? 'bg-brand-gold/10' : 'bg-black/20 group-hover:bg-black/10'}`} />
                  <div className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
                    {index + 1}
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <Lightbox
        open={openIndex >= 0}
        close={() => setOpenIndex(-1)}
        index={openIndex >= 0 ? openIndex : 0}
        slides={slides}
        plugins={[Zoom, Counter]}
        carousel={{ preload: 2, finite: false }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        animation={{ fade: 250, swipe: 280 }}
        counter={{ container: { style: { top: 'auto', bottom: '20px', insetInline: '24px', color: '#f7f3ea', fontWeight: 600 } } }}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
        styles={{
          container: {
            backgroundColor: 'rgba(4, 9, 7, 0.96)',
            backdropFilter: 'blur(14px)'
          },
          slide: {
            padding: '32px 24px 72px'
          }
        }}
        render={{
          iconPrev: () => <span className="text-3xl text-white">‹</span>,
          iconNext: () => <span className="text-3xl text-white">›</span>,
          iconClose: () => <span className="text-2xl text-white">✕</span>
        }}
      />
    </>
  );
}
