export const APP_VERSION = '15.4';
export const APP_LAST_UPDATED_AT = '2026-06-14 00:45:00 UTC';
export const APP_RELEASE_NOTES = [
  'Versão 15.4 corrige a validação de upload da galeria: prévias locais em data:image voltam a ser aceitas imediatamente no admin, sem o falso erro de imagem inacessível.',
  'A checagem de acessibilidade continua ativa apenas para URLs reais do servidor, preservando a proteção contra arquivos quebrados depois do salvamento.',
  'A galeria do imóvel segue persistindo as fotos no backend apenas ao salvar o cadastro, mantendo o fluxo único de gravação das imagens do anúncio.',
  'O pacote mantém as correções da 15.3 e os fallbacks de leitura da API para imóveis, dashboard e blog.'
] as const;
