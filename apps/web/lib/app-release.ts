export const APP_VERSION = '14.7';
export const APP_LAST_UPDATED_AT = '2026-06-12 04:45:00 UTC';
export const APP_RELEASE_NOTES = [
  'Correção definitiva da cadeia autenticada compartilhada com resolução estável da API em same-origin /api no navegador.',
  'Remoção do fallback silencioso por timeout no safeAuth, com falha explícita e logs de diagnóstico na ponte /api/admin-token e /api/owner-token.',
  'Ajuste simétrico dos clientes administrativo e do proprietário para renovação de token, limpeza de cache inválido e rastreio preciso de falhas de rede/HTTP.'
] as const;
