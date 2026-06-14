export const APP_VERSION = '15.6';
export const APP_LAST_UPDATED_AT = '2026-06-14 02:10:00 UTC';
export const APP_RELEASE_NOTES = [
  'Versão 15.6 unifica definitivamente o caminho público das mídias em /api/uploads, eliminando a divergência entre URL salva, URL retornada pela API e URL usada pelo frontend.',
  'As imagens de imóveis persistidas pelo backend continuam sendo convertidas para WEBP e agora toda normalização de respostas antigas /uploads/... também aponta para /api/uploads/... no admin, no site público e na galeria.',
  'O backend mantém a exposição estática tanto em /api/uploads quanto em /uploads para compatibilidade, e o exemplo de Nginx agora explicita a rota canônica /api/uploads e preserva a rota legada.',
  'O ajuste de schema para campos numéricos opcionais permanece ativo, evitando o erro Number must be greater than 0 no cadastro.'
] as const;
