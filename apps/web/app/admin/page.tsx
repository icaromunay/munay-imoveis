'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  LayoutPanelTop,
  Loader2,
  PenSquare,
  Sparkles,
  Users,
  Waypoints
} from 'lucide-react';
import { adminFetch } from '@/lib/admin';
import { AdminShell } from '@/components/admin/AdminShell';
import { AdminStat } from '@/components/admin/AdminStat';
import { DashboardData } from '@/lib/types';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function compactVisitorKey(value: string) {
  return value.length > 12 ? `${value.slice(0, 6)}•••${value.slice(-4)}` : value;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
}

export default function AdminPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError('');
      const data = await adminFetch('/dashboard');
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar o dashboard.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function approveProperty(id: string) {
    try {
      setApprovingId(id);
      await adminFetch(`/properties/${id}/approve`, { method: 'PATCH' });
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aprovar o imóvel.');
    } finally {
      setApprovingId(null);
    }
  }

  const quickSummary = useMemo(() => {
    if (!dashboard) return null;

    return [
      {
        icon: Building2,
        title: 'Portfólio ativo',
        text: `${dashboard.properties} imóveis e ${dashboard.developments} loteamentos sob gestão.`
      },
      {
        icon: Clock3,
        title: 'Pendências de aprovação',
        text: `${dashboard.pendingApproval} cadastro(s) aguardando revisão do admin.`
      },
      {
        icon: Waypoints,
        title: 'Imóvel mais visualizado',
        text: dashboard.mostViewedProperty
          ? `${dashboard.mostViewedProperty.propertyCode} • ${dashboard.mostViewedProperty.title} • ${formatNumber(dashboard.mostViewedProperty.viewCount)} visualizações.`
          : 'Ainda não há visualizações suficientes para ranking.'
      }
    ];
  }, [dashboard]);

  return (
    <AdminShell title="Dashboard administrativo">
      {loading ? (
        <div className="card-premium flex items-center gap-3 p-6 text-zinc-300">
          <Loader2 className="h-5 w-5 animate-spin text-brand-gold" />
          Carregando indicadores administrativos...
        </div>
      ) : dashboard ? (
        <div className="space-y-8">
          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AdminStat label="Total de imóveis" value={dashboard.properties} helper="Todos os cadastros do sistema." href="/admin/properties" />
            <AdminStat label="Loteamentos" value={dashboard.developments} helper="Empreendimentos com gestão própria." href="/admin/properties" />
            <AdminStat label="Proprietários" value={dashboard.owners} helper="Contatos únicos vinculados aos cadastros." href="/admin/properties" />
            <AdminStat label="Artigos" value={dashboard.posts} helper="Conteúdo público disponível no blog." href="/admin/posts" />
            <AdminStat label="Visualizações do portal" value={dashboard.totalViews} helper="Total acumulado de visualizações registradas internamente." href="/admin/traffic" />
            <AdminStat label="Últimos 7 dias" value={dashboard.last7dViews} helper="Visualizações únicas registradas nos últimos 7 dias." href="/admin/traffic" />
            <AdminStat label="Últimos 30 dias" value={dashboard.last30dViews} helper="Visualizações únicas registradas nos últimos 30 dias." href="/admin/traffic" />
            <AdminStat label="Pendentes" value={dashboard.pendingApproval} helper="Cadastros aguardando publicação." href="/admin/properties" />
            <AdminStat label="Leads" value={dashboard.leads} helper="Contatos recebidos pelo site." href="/admin/leads" />
            <AdminStat label="Destaques" value={dashboard.featured} helper="Imóveis com prioridade na vitrine." href="/admin/properties" />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {quickSummary?.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="card-premium flex items-start gap-4 p-6">
                  <div className="rounded-2xl bg-brand-gold/10 p-3 text-brand-gold">
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{item.text}</p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="card-premium p-6 md:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-brand-gold">Pipeline imobiliário</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Últimos cadastros</h2>
                </div>
                <Link href="/admin/properties" className="text-sm font-medium text-brand-gold transition hover:opacity-80">
                  Abrir imóveis
                </Link>
              </div>

              <div className="mt-6 space-y-4">
                {dashboard.recentProperties.map((item) => {
                  const ownerPending = item.submittedByOwner && item.reviewStatus === 'PENDING';
                  return (
                    <article
                      key={item.id}
                      className={`surface-muted flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between ${
                        ownerPending ? 'border-amber-400/30 bg-amber-500/5' : ''
                      }`}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{item.title}</p>
                          <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-zinc-300">
                            {item.propertyCode}
                          </span>
                          {ownerPending ? (
                            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-amber-200">
                              Enviado por proprietário • pendente
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-zinc-400">
                          {item.city} • {item.district}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                          <span>{item.featured ? 'destaque' : 'comum'}</span>
                          <span>{item.launch ? 'lançamento' : 'padrão'}</span>
                          <span>{item.reviewStatus === 'REJECTED' ? 'rejeitado' : item.approved ? 'publicado' : 'pendente'}</span>
                          <span>{formatNumber(item.viewCount || 0)} visualizações</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
                        {ownerPending ? (
                          <button
                            type="button"
                            onClick={() => approveProperty(item.id)}
                            disabled={approvingId === item.id}
                            className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#08110d] transition hover:brightness-105 disabled:opacity-70"
                          >
                            {approvingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                            Aprovar com 1 clique
                          </button>
                        ) : null}
                        <Link
                          href={`/admin/properties?edit=${item.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-brand-gold hover:text-brand-gold"
                        >
                          <PenSquare size={15} />
                          Editar
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="card-premium p-6 md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-brand-gold">Leads recentes</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Últimos contatos</h2>
                  </div>
                  <Link href="/admin/leads" className="text-sm font-medium text-brand-gold transition hover:opacity-80">
                    Abrir leads
                  </Link>
                </div>

                <div className="mt-6 space-y-4">
                  {dashboard.recentLeads.map((item) => (
                    <article key={item.id} className="surface-muted p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {item.phone}
                            {item.email ? ` • ${item.email}` : ''}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-zinc-400">
                          {item.status}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">{item.propertyTitle || 'Contato geral'}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.propertyCode || 'Sem código'}
                        {item.propertyCity ? ` • ${item.propertyCity}` : ''}
                      </p>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
                        <Link href="/admin/leads" className="inline-flex items-center gap-2 text-sm font-medium text-brand-gold transition hover:opacity-80">
                          <LayoutPanelTop size={15} />
                          Atender lead
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="card-premium p-6 md:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.28em] text-brand-gold">Últimos acessos</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Audiência recente</h2>
                  </div>
                  <Waypoints className="text-brand-gold" size={20} />
                </div>

                <div className="mt-6 space-y-4">
                  {dashboard.recentAccesses.map((item) => (
                    <article key={item.id} className="surface-muted p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-white">{item.property.title}</p>
                          <p className="mt-1 text-sm text-zinc-400">
                            {item.property.propertyCode} • {item.property.city} • {item.property.district}
                          </p>
                        </div>
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-zinc-400">
                          {compactVisitorKey(item.visitorKey)}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
                        <Link href={`/imovel/${item.property.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-brand-gold transition hover:opacity-80">
                          <Sparkles size={15} />
                          Abrir página pública
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <article className="card-premium p-6 md:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-gold/10 p-3 text-brand-gold">
                  <Eye size={20} />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-brand-gold">Visualizações por imóvel</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Top 10 imóveis mais visitados</h2>
                  <Link href="/admin/traffic" className="mt-2 inline-flex text-sm font-medium text-brand-gold transition hover:opacity-80">
                    Abrir central de visualizações
                  </Link>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10">
                <div className="grid grid-cols-[110px_1fr_140px] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                  <span>Código</span>
                  <span>Imóvel</span>
                  <span className="text-right">Visualizações</span>
                </div>
                <div className="divide-y divide-white/10">
                  {dashboard.topViewedProperties.map((item) => (
                    <div key={item.id} className="grid grid-cols-[110px_1fr_140px] gap-4 px-4 py-4 text-sm">
                      <div className="font-semibold text-brand-gold">{item.propertyCode}</div>
                      <div>
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">{item.city} • {item.district}</p>
                      </div>
                      <div className="text-right font-semibold text-white">{formatNumber(item.viewCount)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <section className="card-premium p-6 md:p-7">
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-brand-gold/10 p-3 text-brand-gold">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Atalhos recomendados</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Use o cadastro de imóveis para aprovar com um clique, destacar, marcar lançamentos, duplicar imóveis e ordenar a operação por mais visualizados, menos visualizados, mais recentes ou mais antigos. Na seção Tráfego você centraliza pixels, GTM, GA4, Search Console, Bing e redirecionamentos internos 301/302.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/admin/properties" className="btn-primary px-5 py-3">
                      Cadastrar imóvel
                    </Link>
                    <Link href="/admin/posts" className="btn-secondary px-5 py-3">
                      Gerenciar blog
                    </Link>
                    <Link href="/admin/traffic" className="btn-secondary px-5 py-3">
                      Abrir tráfego
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      ) : (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {error || 'Não foi possível carregar o dashboard.'}
        </div>
      )}
    </AdminShell>
  );
}
