export const APP_VERSION = '15.7';
export const APP_LAST_UPDATED_AT = '2026-06-14 03:10:00 UTC';
export const APP_RELEASE_NOTES = [
  'Versão 15.7 torna o fluxo da galeria do imóvel definitivo: as fotos do cadastro/admin agora são enviadas e persistidas no servidor no momento da seleção, antes mesmo do salvamento do imóvel.',
  'A galeria do imóvel no admin passa a trabalhar com URLs reais já gravadas em /api/uploads/properties/..., eliminando a dependência de previews temporários em base64 para editar, reordenar, substituir e salvar fotos.',
  'O upload administrativo volta a aceitar property-gallery e mapeia esse tipo diretamente para a pasta pública canonical properties, mantendo a URL pública consistente com a galeria e com o anúncio.',
  'As correções anteriores de caminho canônico /api/uploads e de campos numéricos opcionais permanecem ativas.'
] as const;
