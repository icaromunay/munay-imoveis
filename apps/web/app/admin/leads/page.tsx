'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Download, Filter, Mail, MessageCircle, Phone, RefreshCw, Search } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin';
import { Lead, SiteSettings } from '@/lib/types';

type LeadStatusKey = Lead['status'];

const leadStatusOptions: Array<{ value: LeadStatusKey; label: string; tone: string }> = [
  { value: 'NEW', label: 'Novo', tone: 'border-sky-400/30 bg-sky-400/10 text-sky-200' },
  { value: 'CONTACTED', label: 'Contato Realizado', tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' },
  { value: 'WAITING_RETURN', label: 'Aguardando Retorno', tone: 'border-amber-400/30 bg-amber-400/10 text-amber-200' },
  { value: 'VISITED_PROPERTY', label: 'Visitou Imóvel', tone: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200' },
  { value: 'PROPOSAL_SENT', label: 'Proposta Enviada', tone: 'border-violet-400/30 bg-violet-400/10 text-violet-200' },
  { value: 'NEGOTIATION', label: 'Negociação', tone: 'border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200' },
  { value: 'CLOSED', label: 'Fechado', tone: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' },
  { value: 'LOST', label: 'Perdido', tone: 'border-rose-400/30 bg-rose-400/10 text-rose-200' }
];

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function digitsOnly(value?: string | null) {
  return String(value || '').replace(/\D/g, '');
}

function getStatusMeta(status: LeadStatusKey) {
  return leadStatusOptions.find((option) => option.value === status) || leadStatusOptions[0];
}

function buildLeadExcelHtml(rows: Lead[]) {
  const body = rows
    .map(
      (lead) => `
        <tr>
          <td>${lead.name}</td>
          <td>${lead.phone}</td>
          <td>${lead.email || ''}</td>
          <td>${getStatusMeta(lead.status).label}</td>
          <td>${lead.property?.title || lead.propertyTitle || lead.interest || 'Lead geral'}</td>
          <td>${lead.pageOrigin || 'site'}</td>
          <td>${lead.nextContactAt || ''}</td>
          <td>${lead.createdAt}</td>
          <td>${lead.internalNote || ''}</td>
        </tr>`
    )
    .join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /></head>
      <body>
        <table border="1">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Telefone</th>
              <th>E-mail</th>
              <th>Status</th>
              <th>Imóvel</th>
              <th>Origem</th>
              <th>Próximo contato</th>
              <th>Capturado em</th>
              <th>Anotações internas</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </body>
    </html>`;
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function AdminLeadsPage() {
  const [items, setItems] = useState<Lead[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LeadStatusKey>('ALL');
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [leadsResponse, settingsResponse] = await Promise.all([adminFetch('/leads'), adminFetch('/settings')]);
      setItems(Array.isArray(leadsResponse) ? (leadsResponse as Lead[]) : []);
      setSettings((settingsResponse as SiteSettings) || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o mini CRM.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function persistLead(id: string, patch: Partial<Lead>) {
    setSavingIds((current) => ({ ...current, [id]: true }));
    try {
      const updated = (await adminFetch(`/leads/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: patch.status,
          internalNote: patch.internalNote,
          nextContactAt: patch.nextContactAt || null,
          assignedTo: patch.assignedTo || null
        })
      })) as Lead;

      setItems((current) => current.map((lead) => (lead.id === id ? { ...lead, ...updated } : lead)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar o lead.');
      void load();
    } finally {
      setSavingIds((current) => ({ ...current, [id]: false }));
    }
  }

  function updateLocalLead(id: string, patch: Partial<Lead>) {
    setItems((current) => current.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)));
  }

  const filteredItems = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((lead) => {
      if (statusFilter !== 'ALL' && lead.status !== statusFilter) return false;
      if (!normalizedSearch) return true;

      const haystack = [
        lead.name,
        lead.phone,
        lead.email,
        lead.property?.title,
        lead.propertyTitle,
        lead.propertyCode,
        lead.interest,
        lead.pageOrigin
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [items, search, statusFilter]);

  const pendingReturns = useMemo(() => {
    const now = Date.now();
    return items.filter((lead) => {
      if (!lead.nextContactAt) return false;
      if (['CLOSED', 'LOST'].includes(lead.status)) return false;
      const nextDate = new Date(lead.nextContactAt).getTime();
      return Number.isFinite(nextDate) && nextDate <= now;
    });
  }, [items]);

  const brokerName = settings?.brandName?.trim() || 'Munay Imóveis';

  return (
    <AdminShell title="Leads • Mini CRM Imobiliário">
      <div className="space-y-6">
        {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        <section className="card-premium p-5 md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-gold">CRM imobiliário</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Central rápida de conversão e acompanhamento comercial</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
                WhatsApp, ligação, e-mail, anotações internas, próximos retornos e filtros por estágio comercial sem recarregar a página.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
              <div className="relative min-w-[240px]">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nome, telefone, e-mail ou imóvel"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white outline-none"
                />
              </div>
              <div className="relative min-w-[220px]">
                <Filter size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'ALL' | LeadStatusKey)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white outline-none"
                >
                  <option value="ALL" className="bg-[#08110d] text-white">Todos os status</option>
                  {leadStatusOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#08110d] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => downloadFile(buildLeadExcelHtml(filteredItems), 'leads-crm.xls', 'application/vnd.ms-excel;charset=utf-8;')}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-white"
              >
                <Download size={16} /> Exportar Excel
              </button>
              <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-5 py-3 font-semibold text-[#08110d]">
                <RefreshCw size={16} /> Atualizar
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="surface-muted rounded-[1.5rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Total de leads</p>
            <p className="mt-3 text-3xl font-semibold text-white">{items.length}</p>
          </article>
          <article className="surface-muted rounded-[1.5rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Retornos pendentes</p>
            <p className="mt-3 text-3xl font-semibold text-white">{pendingReturns.length}</p>
          </article>
          <article className="surface-muted rounded-[1.5rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Em negociação</p>
            <p className="mt-3 text-3xl font-semibold text-white">{items.filter((lead) => lead.status === 'NEGOTIATION').length}</p>
          </article>
          <article className="surface-muted rounded-[1.5rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Fechados</p>
            <p className="mt-3 text-3xl font-semibold text-white">{items.filter((lead) => lead.status === 'CLOSED').length}</p>
          </article>
        </section>

        {pendingReturns.length ? (
          <section className="rounded-[1.6rem] border border-amber-400/25 bg-amber-400/10 p-5 text-amber-100">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-amber-200">Retornos prioritários</p>
                <p className="mt-2 text-base font-medium">
                  Existem {pendingReturns.length} lead(s) com retorno vencido ou agendado para agora. Priorize o contato para não perder conversão.
                </p>
              </div>
              <button
                onClick={() => setStatusFilter('WAITING_RETURN')}
                className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 px-4 py-2 text-sm font-medium text-amber-100"
              >
                <CalendarClock size={16} /> Ver aguardando retorno
              </button>
            </div>
          </section>
        ) : null}

        {loading ? (
          <div className="card-premium px-6 py-8 text-zinc-300">Carregando mini CRM...</div>
        ) : (
          <div className="space-y-4">
            {filteredItems.length ? (
              filteredItems.map((lead) => {
                const statusMeta = getStatusMeta(lead.status);
                const saving = Boolean(savingIds[lead.id]);
                const propertyLabel = lead.property?.title || lead.propertyTitle || lead.interest || 'Lead geral';
                const whatsappText = encodeURIComponent(
                  `Olá ${lead.name}, aqui é ${brokerName}. Estou entrando em contato sobre ${propertyLabel}. Se preferir, posso te enviar mais detalhes e próximos passos por aqui.`
                );
                const whatsappHref = digitsOnly(lead.phone) ? `https://wa.me/${digitsOnly(lead.phone)}?text=${whatsappText}` : '#';
                const phoneHref = digitsOnly(lead.phone) ? `tel:${digitsOnly(lead.phone)}` : '#';
                const mailHref = lead.email ? `mailto:${lead.email}` : '#';

                return (
                  <article key={lead.id} className="card-premium p-5 md:p-6">
                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-2xl font-semibold text-white">{lead.name}</h3>
                              <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${statusMeta.tone}`}>{statusMeta.label}</span>
                              {saving ? <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">Salvando...</span> : null}
                            </div>
                            <p className="mt-2 text-sm text-zinc-400">{lead.phone}{lead.email ? ` • ${lead.email}` : ''}</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                              <MessageCircle size={15} /> WhatsApp
                            </a>
                            <a href={phoneHref} className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-400/10 px-4 py-2 text-sm text-sky-200">
                              <Phone size={15} /> Ligar
                            </a>
                            <a href={mailHref} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${lead.email ? 'border-violet-400/25 bg-violet-400/10 text-violet-200' : 'border-white/10 text-zinc-500 pointer-events-none opacity-50'}`}>
                              <Mail size={15} /> E-mail
                            </a>
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Imóvel de origem</p>
                            <p className="mt-2 text-sm font-medium text-white">{propertyLabel}</p>
                            <p className="mt-1 text-xs text-zinc-500">{lead.propertyCode || lead.property?.propertyCode || 'Sem código'} {lead.propertyCity ? `• ${lead.propertyCity}` : ''}</p>
                          </div>
                          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Data de captura</p>
                            <p className="mt-2 text-sm font-medium text-white">{formatDateTime(lead.createdAt)}</p>
                            <p className="mt-1 text-xs text-zinc-500">Origem: {lead.pageOrigin || 'site'}</p>
                          </div>
                          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Status comercial</p>
                            <select
                              value={lead.status}
                              onChange={(event) => {
                                const nextStatus = event.target.value as LeadStatusKey;
                                updateLocalLead(lead.id, { status: nextStatus });
                                void persistLead(lead.id, { status: nextStatus });
                              }}
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-sm text-white outline-none"
                            >
                              {leadStatusOptions.map((option) => (
                                <option key={option.value} value={option.value} className="bg-[#08110d] text-white">
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Próximo contato</p>
                            <input
                              type="datetime-local"
                              value={toDatetimeLocal(lead.nextContactAt)}
                              onChange={(event) => {
                                const nextValue = event.target.value;
                                updateLocalLead(lead.id, { nextContactAt: nextValue ? new Date(nextValue).toISOString() : null });
                                void persistLead(lead.id, { nextContactAt: nextValue ? new Date(nextValue).toISOString() : null });
                              }}
                              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-sm text-white outline-none"
                            />
                            <p className="mt-2 text-xs text-zinc-500">Atual: {formatDateTime(lead.nextContactAt)}</p>
                          </div>
                        </div>

                        <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Mensagem / interesse</p>
                          <p className="mt-2 text-sm leading-6 text-zinc-200">{lead.message || lead.interest || 'Lead recebido pelo site sem mensagem complementar.'}</p>
                        </div>
                      </div>

                      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Anotações internas</p>
                        <textarea
                          value={lead.internalNote || ''}
                          onChange={(event) => updateLocalLead(lead.id, { internalNote: event.target.value })}
                          onBlur={(event) => void persistLead(lead.id, { internalNote: event.target.value })}
                          rows={10}
                          placeholder="Registre objeções, interesse real, estágio comercial, próximos passos e acordos feitos com o cliente."
                          className="mt-3 w-full rounded-[1.35rem] border border-white/10 bg-[#08110d] px-4 py-4 text-sm leading-6 text-white outline-none"
                        />
                        <p className="mt-3 text-xs text-zinc-500">As anotações são privadas do painel administrativo.</p>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="card-premium px-6 py-8 text-zinc-300">Nenhum lead encontrado com os filtros atuais.</div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
