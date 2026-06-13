export const APP_VERSION = '15.2';
export const APP_LAST_UPDATED_AT = '2026-06-13 08:10:00 UTC';
export const APP_RELEASE_NOTES = [
  'Versão 15.2 passa a persistir as fotos do imóvel na biblioteca interna no momento do upload, evitando edição com imagens temporárias que depois somem na home.',
  'As leituras administrativas de imóveis, dashboard e blog agora usam fallback em memória com o último payload válido, reduzindo panes quando a API ou o banco oscilam temporariamente.',
  'A leitura pública do blog também passou a priorizar cache local antes dos posts de exemplo, impedindo que artigos reais desapareçam visualmente durante falhas transitórias.',
  'O pacote mantém as correções da 15.1 no editor rico, no payload do imóvel e na redução de 404 falsos da página pública.'
] as const;
