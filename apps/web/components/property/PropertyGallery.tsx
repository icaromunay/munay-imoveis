'use client';

import { useCallback, useMemo, useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { getPropertyThumbnailUrl, optimizeImageUrl } from '@/lib/image';

type GalleryImage = {
  url: string;
  alt?: string | null;
};

export function PropertyGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [openIndex, setOpenIndex] = useState<number>(-1);

  const normalizedImages = useMemo(() => images.filter((image) => Boolean(image?.url)), [images]);
  const activeImage = normalizedImages[selectedIndex] || normalizedImages[0];

  const slides = useMemo(
    () =>
      normalizedImages.map((image, index) => ({
        src: optimizeImageUrl(image.url, 1920, 82),
        alt: image.alt || `${title} - Foto ${index + 1}`
      })),
    [normalizedImages, title]
  );

  const openGalleryAt = useCallback((index: number) => {
    setSelectedIndex(index);
    setOpenIndex(index);
  }, []);

  const showPreviousImage = useCallback(() => {
    if (normalizedImages.length <= 1) return;
    setSelectedIndex((current) => (current - 1 + normalizedImages.length) % normalizedImages.length);
  }, [normalizedImages.length]);

  const showNextImage = useCallback(() => {
    if (normalizedImages.length <= 1) return;
    setSelectedIndex((current) => (current + 1) % normalizedImages.length);
  }, [normalizedImages.length]);

  if (!activeImage) {
    return null;
  }

  return (
    <>
      <div className="mt-8 space-y-4">
        <div className="group relative">
          <button
            type="button"
            onClick={() => openGalleryAt(selectedIndex)}
            className="relative block h-[460px] w-full overflow-hidden rounded-[2rem] border border-white/10 text-left shadow-[0_16px_60px_rgba(0,0,0,0.18)] transition duration-500 hover:border-brand-gold/35"
            aria-label={`Abrir galeria na imagem ${selectedIndex + 1} de ${normalizedImages.length}`}
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
                Galeria profissional
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/25 bg-brand-gold/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-gold backdrop-blur">
                <Expand size={14} /> Clique para ampliar
              </span>
            </div>
            <div className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/45 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white backdrop-blur">
              Imagem {selectedIndex + 1} de {normalizedImages.length}
            </div>
          </button>

          {normalizedImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={showPreviousImage}
                className="absolute left-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#08110d]/70 text-white backdrop-blur transition hover:border-brand-gold/40 hover:text-brand-gold"
                aria-label="Imagem anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={showNextImage}
                className="absolute right-4 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-[#08110d]/70 text-white backdrop-blur transition hover:border-brand-gold/40 hover:text-brand-gold"
                aria-label="Próxima imagem"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}
        </div>

        {normalizedImages.length > 1 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
            {normalizedImages.map((image, index) => {
              const isActive = index === selectedIndex;

              return (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => openGalleryAt(index)}
                  className={`group relative h-24 overflow-hidden rounded-[1.3rem] border text-left transition duration-300 ${isActive ? 'border-brand-gold/60 ring-2 ring-brand-gold/20' : 'border-white/10 hover:border-brand-gold/35'}`}
                  aria-label={`Abrir foto ${index + 1} de ${normalizedImages.length}`}
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
        className="munay-property-lightbox"
        open={openIndex >= 0}
        close={() => setOpenIndex(-1)}
        index={openIndex >= 0 ? openIndex : selectedIndex}
        slides={slides}
        plugins={[Zoom, Counter, Thumbnails]}
        carousel={{ preload: 2, finite: false, imageFit: 'contain' }}
        controller={{ closeOnPullDown: true, closeOnBackdropClick: true }}
        animation={{ fade: 250, swipe: 280 }}
        on={{
          view: ({ index }) => {
            setOpenIndex(index);
            setSelectedIndex(index);
          }
        }}
        counter={{
          container: {
            style: {
              top: 'auto',
              bottom: '112px',
              insetInline: '24px',
              color: '#f7f3ea',
              fontWeight: 600,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontSize: '12px'
            }
          }
        }}
        thumbnails={{
          position: 'bottom',
          width: 88,
          height: 64,
          border: 0,
          borderRadius: 16,
          padding: 4,
          gap: 10,
          vignette: false,
          showToggle: false
        }}
        zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
        styles={{
          container: {
            backgroundColor: 'rgba(4, 9, 7, 0.96)',
            backdropFilter: 'blur(14px)'
          },
          slide: {
            padding: '32px 24px 136px'
          },
          thumbnailsContainer: {
            background: 'linear-gradient(180deg, rgba(4, 9, 7, 0), rgba(4, 9, 7, 0.8))',
            paddingBottom: '18px'
          },
          thumbnailsTrack: {
            padding: '0 16px'
          },
          thumbnail: {
            border: '1px solid rgba(255,255,255,0.14)',
            backgroundColor: 'rgba(8, 17, 13, 0.45)',
            ['--yarl__thumbnails_thumbnail_active_border_color']: 'rgba(212, 175, 114, 0.95)',
            ['--yarl__thumbnails_thumbnail_focus_box_shadow']:
              'rgba(0,0,0,0.85) 0 0 0 2px, rgba(212, 175, 114, 0.82) 0 0 0 4px'
          }
        }}
        render={{
          iconPrev: () => <span className="text-3xl text-white">‹</span>,
          iconNext: () => <span className="text-3xl text-white">›</span>,
          iconClose: () => <span className="text-2xl text-white">✕</span>
        }}
      />

      <style jsx global>{`
        .munay-property-lightbox .yarl__thumbnails_thumbnail_active {
          box-shadow: 0 0 0 2px rgba(212, 175, 114, 0.2);
        }

        .munay-property-lightbox .yarl__button {
          filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.35));
        }

        .munay-property-lightbox .yarl__navigation_prev,
        .munay-property-lightbox .yarl__navigation_next,
        .munay-property-lightbox .yarl__button[aria-label='Close'] {
          background: rgba(8, 17, 13, 0.62);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          backdrop-filter: blur(12px);
        }
      `}</style>
    </>
  );
}
