'use client';

import { FormEvent, useId, useMemo, useState } from 'react';
import { createLead } from '@/lib/api';
import { buildPropertyWhatsappMessage } from '@/lib/property-utils';

export function LeadForm({
  propertyId,
  interest,
  pageOrigin,
  whatsappConfig
}: {
  propertyId?: string;
  interest?: string;
  pageOrigin: string;
  whatsappConfig?: {
    phone: string;
    propertyTitle: string;
    propertyCode: string;
    propertySlug: string;
    propertyCity: string;
    propertyDistrict: string;
  };
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [whatsAppHref, setWhatsAppHref] = useState('');
  const fieldId = useId();

  const inputStyle = useMemo(
    () =>
      ({
        border: '1px solid var(--theme-institutional-border)',
        background: 'color-mix(in srgb, var(--theme-institutional-surface) 82%, transparent)',
        color: 'var(--theme-institutional-text-primary)'
      }) as const,
    []
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    setWhatsAppHref('');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') || ''),
      phone: String(form.get('phone') || ''),
      email: String(form.get('email') || ''),
      message: String(form.get('message') || ''),
      website: String(form.get('website') || ''),
      propertyId,
      interest,
      pageOrigin,
      source: 'site',
      consent: true,
      propertyCode: whatsappConfig?.propertyCode,
      propertyTitle: whatsappConfig?.propertyTitle,
      propertyCity: whatsappConfig ? `${whatsappConfig.propertyCity} - ${whatsappConfig.propertyDistrict}` : undefined
    };

    try {
      await createLead(payload);

      if (whatsappConfig) {
        const whatsappMessage = buildPropertyWhatsappMessage(
          {
            title: whatsappConfig.propertyTitle,
            propertyCode: whatsappConfig.propertyCode,
            slug: whatsappConfig.propertySlug,
            city: whatsappConfig.propertyCity,
            district: whatsappConfig.propertyDistrict
          },
          'informacoes',
          {
            name: payload.name,
            phone: payload.phone,
            email: payload.email,
            message: payload.message
          }
        );

        setWhatsAppHref(`https://wa.me/${whatsappConfig.phone}?text=${encodeURIComponent(whatsappMessage)}`);
        setSuccess('Recebemos seu contato. Se quiser continuar no WhatsApp, use o botão abaixo.');
      } else {
        setSuccess('Recebemos seu contato. Nossa equipe vai retornar rapidamente.');
      }

      (event.currentTarget as HTMLFormElement).reset();
    } catch {
      setError('Não foi possível enviar agora. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      data-theme-block="cta-buttons"
      onSubmit={handleSubmit}
      className="card-premium space-y-4 p-6"
      aria-labelledby={`${fieldId}-title`}
      style={{
        background: 'var(--theme-institutional-surface)',
        borderColor: 'var(--theme-institutional-border)',
        boxShadow: 'var(--theme-institutional-shadow)',
        borderRadius: 'var(--theme-institutional-radius)'
      }}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.35em]" style={{ color: 'var(--theme-accent)' }}>Contato rápido</p>
        <h3 id={`${fieldId}-title`} className="mt-2 text-2xl font-semibold" style={{ color: 'var(--theme-institutional-text-primary)' }}>Formulário de Contato</h3>
        <p className="mt-3 text-sm leading-6" style={{ color: 'var(--theme-institutional-text-secondary)' }}>
          Respondemos em no máximo 15min mensagem via WhatsApp.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${fieldId}-name`} className="text-sm" style={{ color: 'var(--theme-institutional-text-secondary)' }}>Seu nome</label>
        <input id={`${fieldId}-name`} name="name" required autoComplete="name" placeholder="Seu nome" className="w-full rounded-2xl px-4 py-3 outline-none placeholder:text-zinc-500" style={inputStyle} />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${fieldId}-phone`} className="text-sm" style={{ color: 'var(--theme-institutional-text-secondary)' }}>WhatsApp</label>
        <input id={`${fieldId}-phone`} name="phone" required autoComplete="tel" placeholder="WhatsApp" className="w-full rounded-2xl px-4 py-3 outline-none placeholder:text-zinc-500" style={inputStyle} />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${fieldId}-email`} className="text-sm" style={{ color: 'var(--theme-institutional-text-secondary)' }}>E-mail</label>
        <input id={`${fieldId}-email`} name="email" type="email" autoComplete="email" placeholder="E-mail" className="w-full rounded-2xl px-4 py-3 outline-none placeholder:text-zinc-500" style={inputStyle} />
      </div>

      <div className="space-y-2">
        <label htmlFor={`${fieldId}-message`} className="text-sm" style={{ color: 'var(--theme-institutional-text-secondary)' }}>Mensagem</label>
        <textarea id={`${fieldId}-message`} name="message" placeholder="Conte o que você procura" rows={4} className="w-full rounded-2xl px-4 py-3 outline-none placeholder:text-zinc-500" style={inputStyle} />
      </div>

      <input tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" className="hidden" />

      <button disabled={loading} className="btn-primary w-full justify-center disabled:opacity-70">
        {loading ? 'Enviando...' : 'Quero atendimento'}
      </button>

      <div aria-live="polite" className="min-h-6 space-y-3">
        {success ? <p className="text-sm text-emerald-400">{success}</p> : null}
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        {whatsAppHref ? (
          <a
            href={whatsAppHref}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary inline-flex w-full justify-center"
          >
            Abrir WhatsApp manualmente
          </a>
        ) : null}
      </div>

      <p className="text-xs leading-5" style={{ color: 'var(--theme-institutional-text-secondary)' }}>Ao enviar, você concorda com o contato da equipe comercial e com a política de privacidade.</p>
    </form>
  );
}
