export const APP_VERSION = '15.3';
export const APP_LAST_UPDATED_AT = '2026-06-14 00:00:00 UTC';
export const APP_RELEASE_NOTES = [
  'Versão 15.3 volta a usar pré-visualização local para a galeria do imóvel e só persiste as fotos no backend ao salvar o cadastro, eliminando miniaturas quebradas no admin.',
  'A galeria do imóvel deixou de depender da rota separada do app web: blog, editor e descrição continuam com upload dedicado, mas as fotos do anúncio seguem um fluxo único pelo backend de imóveis.',
  'O backend passou a reaproveitar a primeira imagem persistida como capa quando ela já vem da galeria, evitando gravação duplicada e desencontro entre capa e fotos.',
  'O pacote mantém os fallbacks de leitura da API introduzidos na 15.2 para imóveis, dashboard e blog.'
] as const;
