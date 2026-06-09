import { Metadata } from 'next';
import { OwnerSubmissionPortal } from '@/components/owner/OwnerSubmissionPortal';
import { buildMetadata } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: 'Área do proprietário',
  path: '/area-do-proprietario',
  description: 'Área do proprietário para entrar com e-mail e senha, cadastrar imóveis, editar pendências e acompanhar aprovação.'
});

export default function AreaDoProprietarioPage() {
  return <OwnerSubmissionPortal />;
}
