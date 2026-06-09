import { ThemeLayout } from '@/lib/types';

export const OFFICIAL_THEME_LAYOUT_SLUG = 'layout-premium-luxo-fixo';

const OFFICIAL_THEME_CSS = `
:root {
  --site-background: #111827;
  --site-background-gradient: linear-gradient(180deg, #111827 0%, #0F172A 100%);
  --site-foreground: #FFFFFF;
  --site-muted-text: #D1D5DB;
  --theme-accent: #D4AF37;
  --theme-card-background: #1F2937;
  --theme-card-border: #374151;
  --theme-card-text-primary: #FFFFFF;
  --theme-card-text-secondary: #D1D5DB;
  --theme-card-shadow: 0 18px 70px rgba(0, 0, 0, 0.24);
  --theme-card-radius: 1.75rem;
  --theme-card-hover-transform: translateY(-4px);
  --theme-button-primary-bg: #D4AF37;
  --theme-button-primary-text: #111827;
  --theme-button-secondary-text: #D4AF37;
  --theme-button-border: #D4AF37;
  --theme-button-shadow: 0 18px 50px rgba(0, 0, 0, 0.22);
  --theme-button-radius: 999px;
  --theme-section-title-color: #FFFFFF;
  --theme-section-subtitle-color: #D1D5DB;
  --theme-section-badge-bg: rgba(212, 175, 55, 0.12);
  --theme-section-badge-border: rgba(212, 175, 55, 0.36);
  --theme-section-badge-text: #D4AF37;
  --theme-header-background: rgba(17, 24, 39, 0.96);
  --theme-header-border: #374151;
  --theme-header-text-primary: #FFFFFF;
  --theme-header-text-secondary: #D1D5DB;
  --theme-header-accent: #D4AF37;
  --theme-header-button: #D4AF37;
  --theme-header-height: 5rem;
  --theme-header-radius: 999px;
  --theme-header-shadow: 0 10px 50px rgba(0, 0, 0, 0.24);
  --theme-hero-background: #111827;
  --theme-hero-surface: linear-gradient(180deg, rgba(31, 41, 55, 0.96) 0%, rgba(15, 23, 42, 1) 100%);
  --theme-hero-text-primary: #FFFFFF;
  --theme-hero-text-secondary: #D1D5DB;
  --theme-hero-accent: #D4AF37;
  --theme-hero-button: #D4AF37;
  --theme-hero-shadow: 0 24px 90px rgba(0, 0, 0, 0.22);
  --theme-search-background: rgba(31, 41, 55, 0.96);
  --theme-search-surface: linear-gradient(180deg, rgba(31, 41, 55, 0.98), rgba(15, 23, 42, 0.98));
  --theme-search-text-primary: #FFFFFF;
  --theme-search-text-secondary: #D1D5DB;
  --theme-search-border: #374151;
  --theme-search-accent: #D4AF37;
  --theme-search-button: #D4AF37;
  --theme-search-shadow: 0 20px 80px rgba(0, 0, 0, 0.28);
  --theme-search-radius: 1.9rem;
  --theme-highlights-background: #111827;
  --theme-highlights-border: #374151;
  --theme-launches-background: #111827;
  --theme-launches-border: #374151;
  --theme-property-background: #111827;
  --theme-property-surface: #1F2937;
  --theme-property-border: #374151;
  --theme-property-text-primary: #FFFFFF;
  --theme-property-text-secondary: #D1D5DB;
  --theme-property-accent: #D4AF37;
  --theme-property-shadow: 0 18px 70px rgba(0, 0, 0, 0.24);
  --theme-property-radius: 2rem;
  --theme-technical-background: #111827;
  --theme-technical-surface: #1F2937;
  --theme-technical-border: #374151;
  --theme-technical-text-primary: #FFFFFF;
  --theme-technical-text-secondary: #D1D5DB;
  --theme-technical-accent: #D4AF37;
  --theme-technical-shadow: 0 18px 70px rgba(0, 0, 0, 0.22);
  --theme-technical-radius: 1.75rem;
  --theme-footer-background: linear-gradient(180deg, #111827 0%, #0F172A 100%);
  --theme-footer-text-primary: #FFFFFF;
  --theme-footer-text-secondary: #D1D5DB;
  --theme-footer-accent: #D4AF37;
  --theme-footer-border: #374151;
  --theme-blog-background: #111827;
  --theme-blog-surface: #1F2937;
  --theme-blog-text-primary: #FFFFFF;
  --theme-blog-text-secondary: #D1D5DB;
  --theme-blog-border: #374151;
  --theme-blog-button: #D4AF37;
  --theme-blog-radius: 2rem;
  --theme-institutional-background: #111827;
  --theme-institutional-surface: #1F2937;
  --theme-institutional-text-primary: #FFFFFF;
  --theme-institutional-text-secondary: #D1D5DB;
  --theme-institutional-border: #374151;
  --theme-institutional-button: #D4AF37;
  --theme-institutional-shadow: 0 18px 70px rgba(0, 0, 0, 0.22);
  --theme-institutional-radius: 2rem;
}
`;

export function ThemeVariablesStyle({ layout }: { layout?: ThemeLayout | null }) {
  const receivedSlug = layout?.slug || 'dynamic-layout-disabled';
  console.info(`[theme:render-style] slug=${OFFICIAL_THEME_LAYOUT_SLUG} mode=static source=${receivedSlug}`);

  return (
    <style
      id={`theme-variables-${OFFICIAL_THEME_LAYOUT_SLUG}`}
      data-theme-layout={OFFICIAL_THEME_LAYOUT_SLUG}
      data-theme-mode="static"
      dangerouslySetInnerHTML={{ __html: OFFICIAL_THEME_CSS }}
    />
  );
}
