export const APP_VERSION = '15.1';
export const APP_LAST_UPDATED_AT = '2026-06-13 06:20:00 UTC';
export const APP_RELEASE_NOTES = [
  'Versão 15.1 corrige o clique no editor rico do cadastro de imóveis: o foco volta a abrir o cursor normalmente e o upload de imagem fica restrito ao botão de inserir imagem.',
  'O cadastro/edição de imóveis voltou a enviar cidade, bairro e UF no payload administrativo, eliminando o erro “Required” ao salvar.',
  'O aviso de saída do admin agora aparece apenas quando há alterações reais no editor de blog, ignorando a diferença artificial entre conteúdo vazio e o HTML base <p></p>.',
  'A página pública de imóvel ganhou fallback de detalhe via cache/listagem para reduzir 404 falsos em falhas transitórias de carregamento.'
] as const;
