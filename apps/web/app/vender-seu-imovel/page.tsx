import { Metadata } from 'next';
import { OwnerSubmissionPortal } from '@/components/owner/OwnerSubmissionPortal';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Vender seu imóvel',
  path: '/vender-seu-imovel',
  description: 'Página para o proprietário criar conta, entrar com e-mail e senha, cadastrar imóvel, enviar fotos e acompanhar aprovação antes da publicação no site.'
});

export default function VenderSeuImovelPage() {
  return <OwnerSubmissionPortal />;
}
