export const APP_VERSION = '15.5';
export const APP_LAST_UPDATED_AT = '2026-06-14 01:20:00 UTC';
export const APP_RELEASE_NOTES = [
  'Versão 15.5 corrige o caminho definitivo das mídias do portal: uploads passam a responder também em /api/uploads, evitando sumiço de fotos quando o proxy público só encaminha /api para o backend.',
  'As imagens de imóveis persistidas pelo backend agora são gravadas em WEBP e retornadas como /api/uploads/properties/..., enquanto respostas antigas com /uploads/... são normalizadas automaticamente no admin e no site público.',
  'O erro Number must be greater than 0 foi corrigido no schema de imóveis: campos numéricos opcionais com valor vazio ou 0 agora viram null em vez de quebrar o cadastro.',
  'O pacote mantém as correções anteriores da galeria e os fallbacks de leitura da API para imóveis, dashboard e blog.'
] as const;
