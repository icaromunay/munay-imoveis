export const formatCurrency = (value: number | string | null | undefined) => {
  if (!value) return 'Sob consulta';
  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export const formatArea = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return 'Sob consulta';
  return `${Number(value).toLocaleString('pt-BR')} m²`;
};

export const formatLinearMeasure = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return 'Sob consulta';
  return `${Number(value).toLocaleString('pt-BR')} m`;
};

export const formatInstallments = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return 'Sob consulta';
  return `${Number(value).toLocaleString('pt-BR')} vezes`;
};

export const statusLabel: Record<string, string> = {
  AVAILABLE: 'Disponível',
  SOLD: 'Vendido',
  RESERVED: 'Reservado',
  LAUNCH: 'Lançamento'
};

export const categoryLabel: Record<string, string> = {
  LOTEAMENTO: 'Loteamento',
  TERRENO: 'Terreno',
  CASA: 'Casa',
  APARTAMENTO: 'Apartamento',
  COMERCIAL: 'Comercial',
  RURAL: 'Rural'
};
