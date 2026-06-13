export const APP_VERSION = '15.0';
export const APP_LAST_UPDATED_AT = '2026-06-13 04:55:00 UTC';
export const APP_RELEASE_NOTES = [
  'Versão 15.0 atualiza o painel Sobre, o ZIP final e os metadados internos com o mesmo número de release.',
  'O formulário de edição de imóvel agora valida manualmente os campos obrigatórios e deixa de exibir o balão nativo “Required” sem indicar claramente o campo pendente.',
  'As páginas públicas passaram a cair em fallback seguro quando a API atingir limite temporário, reduzindo telas brancas por exceções server-side.',
  'Foi adicionada uma tela global de erro do App Router e o layout raiz passou a tolerar falhas temporárias de sessão sem derrubar o site inteiro.'
] as const;
