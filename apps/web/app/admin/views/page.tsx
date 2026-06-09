'use client';

import { type ComponentType, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Download, Eye, Film, MessageCircleMore, TrendingUp } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin';
import { ViewsCharts, ViewsDashboardData, ViewsPropertyStat } from '@/lib/types';

type RangeKey = 'today' | '7d' | '30d' | '90d' | 'custom';

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value || 0)}%`;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function formatLabel(value: string) {
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}

function metricRate(value: number, base: number) {
  if (!base) return '0% dos plays';
  return `${formatPercent((value / base) * 100)} dos plays`;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper
}: {
  icon: ComponentType<{ className?: string; size?: string | number }>;
  label: string;
  value: number;
  helper?: string;
}) {
  return (
    <article className="surface-muted rounded-[1.5rem] p-5">
      <div className="flex items-center gap-3 text-brand-gold">
        <Icon size={18} />
        <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-semibold text-white">{formatNumber(value)}</p>
      {helper ? <p className="mt-2 text-sm leading-6 text-zinc-400">{helper}</p> : null}
    </article>
  );
}

function EmptyTableState({ text }: { text: string }) {
  return <div className="px-4 py-6 text-sm text-zinc-400">{text}</div>;
}

function SimpleBars({ title, values, labels, colorClass }: { title: string; values: number[]; labels: string[]; colorClass: string }) {
  const max = Math.max(...values, 1);
  const contentWidth = Math.max(labels.length * 54, 640);

  return (
    <article className="surface-muted rounded-[1.6rem] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="h-64 rounded-[1.25rem] border border-white/10 bg-[#0b1712] px-3 py-4" style={{ minWidth: `${contentWidth}px` }}>
          <div className="flex h-full items-end gap-2">
            {values.map((value, index) => (
              <div key={`${title}-${labels[index]}-${index}`} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                <div className="text-center text-[10px] text-zinc-500">{formatNumber(value)}</div>
                <div className={`w-full rounded-t-xl ${colorClass}`} style={{ height: `${Math.max((value / max) * 100, value > 0 ? 8 : 0)}%` }} />
                <div className="truncate text-center text-[10px] text-zinc-500">{formatLabel(labels[index])}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function buildCsv(rows: ViewsPropertyStat[]) {
  const header = ['Título', 'Código', 'Visualizações', 'Cliques WhatsApp', 'Cliques Agendar Visita', 'Total Conversões', 'Taxa de Conversão', 'Última Visualização'];
  const lines = rows.map((item) => [
    item.title,
    item.propertyCode,
    item.periodViews,
    item.whatsappClicks,
    item.scheduleVisitClicks,
    item.totalConversions,
    item.conversionRate,
    item.lastViewedAt || ''
  ]);

  return [header, ...lines]
    .map((line) => line.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

function buildExcelHtml(rows: ViewsPropertyStat[]) {
  const body = rows
    .map(
      (item) => `
      <tr>
        <td>${item.title}</td>
        <td>${item.propertyCode}</td>
        <td>${item.periodViews}</td>
        <td>${item.whatsappClicks}</td>
        <td>${item.scheduleVisitClicks}</td>
        <td>${item.totalConversions}</td>
        <td>${item.conversionRate}%</td>
        <td>${item.lastViewedAt || ''}</td>
      </tr>`
    )
    .join('');

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>
              <th>Título</th>
              <th>Código</th>
              <th>Visualizações</th>
              <th>Cliques WhatsApp</th>
              <th>Cliques Agendar Visita</th>
              <th>Total Conversões</th>
              <th>Taxa de Conversão</th>
              <th>Última Visualização</th>
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

export default function AdminViewsPage() {
  const [range, setRange] = useState<RangeKey>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<ViewsDashboardData | null>(null);

  async function load(nextRange = range, startDate = customStartDate, endDate = customEndDate) {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      params.set('range', nextRange);
      if (nextRange === 'custom' && startDate && endDate) {
        params.set('startDate', startDate);
        params.set('endDate', endDate);
      }
      const response = await adminFetch(`/analytics/views?${params.toString()}`);
      setData(response as ViewsDashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a central de views.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load('30d');
  }, []);

  const charts: ViewsCharts = data?.charts || {
    labels: [],
    homeVisits: [],
    videoPlays: [],
    whatsappClicks: [],
    scheduleVisitClicks: []
  };

  const periodLabel = useMemo(() => {
    if (!data) return 'últimos 30 dias';
    if (data.selectedRange.range === 'today') return 'hoje';
    if (data.selectedRange.range === '7d') return 'últimos 7 dias';
    if (data.selectedRange.range === '30d') return 'últimos 30 dias';
    if (data.selectedRange.range === '90d') return 'últimos 90 dias';
    return `${data.selectedRange.startDate} até ${data.selectedRange.endDate}`;
  }, [data]);

  const playCount = data?.summary.homeVideoPlays || 0;

  return (
    <AdminShell title="Views">
      <div className="space-y-8">
        {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

        <section className="card-premium p-6 md:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-gold">Analytics interno</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">Central privada de visualizações e conversões</h2>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-zinc-400">
                Todas as métricas abaixo são internas, persistidas no próprio banco do portal e visíveis somente para administradores autenticados.
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
              <select value={range} onChange={(e) => setRange(e.target.value as RangeKey)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none md:w-[220px]">
                <option value="today" className="bg-[#08110d] text-white">Hoje</option>
                <option value="7d" className="bg-[#08110d] text-white">Últimos 7 dias</option>
                <option value="30d" className="bg-[#08110d] text-white">Últimos 30 dias</option>
                <option value="90d" className="bg-[#08110d] text-white">Últimos 90 dias</option>
                <option value="custom" className="bg-[#08110d] text-white">Personalizado</option>
              </select>
              {range === 'custom' ? (
                <>
                  <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
                  <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
                </>
              ) : null}
              <button onClick={() => void load(range, customStartDate, customEndDate)} className="rounded-full bg-brand-gold px-5 py-3 font-semibold text-[#08110d]">
                Atualizar
              </button>
              <button
                onClick={() => data && downloadFile(buildCsv(data.propertyStats), 'views-imoveis.csv', 'text/csv;charset=utf-8;')}
                disabled={!data}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-white disabled:opacity-50"
              >
                <Download size={16} /> Exportar CSV
              </button>
              <button
                onClick={() => data && downloadFile(buildExcelHtml(data.propertyStats), 'views-imoveis.xls', 'application/vnd.ms-excel;charset=utf-8;')}
                disabled={!data}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-white disabled:opacity-50"
              >
                <Download size={16} /> Exportar Excel
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="card-premium px-6 py-8 text-zinc-300">Carregando métricas internas...</div>
        ) : data ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={Eye} label="Visitas Home Hoje" value={data.summary.homeVisitsToday} />
              <MetricCard icon={Eye} label="Visitas Home Últimos 7 Dias" value={data.summary.homeVisitsLast7Days} />
              <MetricCard icon={Eye} label="Visitas Home Últimos 30 Dias" value={data.summary.homeVisitsLast30Days} />
              <MetricCard icon={TrendingUp} label="Total de Visitas Home" value={data.summary.homeVisitsTotal} />
              <MetricCard icon={Film} label="Plays no Vídeo Home" value={data.summary.homeVideoPlays} helper={`No período selecionado: ${periodLabel}`} />
              <MetricCard icon={Film} label="Assistiram 25%" value={data.summary.watched25} helper={metricRate(data.summary.watched25, playCount)} />
              <MetricCard icon={Film} label="Assistiram 50%" value={data.summary.watched50} helper={metricRate(data.summary.watched50, playCount)} />
              <MetricCard icon={Film} label="Assistiram 75%" value={data.summary.watched75} helper={metricRate(data.summary.watched75, playCount)} />
              <MetricCard icon={Film} label="Assistiram até o Final" value={data.summary.watched100} helper={metricRate(data.summary.watched100, playCount)} />
              <MetricCard icon={MessageCircleMore} label="Total de Cliques WhatsApp" value={data.summary.whatsappClicks} helper={`No período selecionado: ${periodLabel}`} />
              <MetricCard icon={CalendarDays} label="Total de Cliques Agendar Visita" value={data.summary.scheduleVisitClicks} helper={`No período selecionado: ${periodLabel}`} />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <SimpleBars title="Gráfico de visitas da Home" values={charts.homeVisits} labels={charts.labels} colorClass="bg-gradient-to-t from-brand-gold to-[#f6d49b]" />
              <SimpleBars title="Gráfico de Plays do Vídeo" values={charts.videoPlays} labels={charts.labels} colorClass="bg-gradient-to-t from-emerald-500 to-emerald-300" />
              <SimpleBars title="Gráfico de Cliques WhatsApp" values={charts.whatsappClicks} labels={charts.labels} colorClass="bg-gradient-to-t from-sky-500 to-sky-300" />
              <SimpleBars title="Gráfico de Agendamentos" values={charts.scheduleVisitClicks} labels={charts.labels} colorClass="bg-gradient-to-t from-violet-500 to-violet-300" />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <article className="card-premium p-6 md:p-7">
                <h3 className="text-2xl font-semibold text-white">Top imóveis mais visualizados</h3>
                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10">
                  <div className="grid grid-cols-[90px_1fr_120px_160px] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    <span>Posição</span>
                    <span>Imóvel</span>
                    <span>Código</span>
                    <span className="text-right">Visualizações</span>
                  </div>
                  <div className="divide-y divide-white/10">
                    {data.topViewed.length ? (
                      data.topViewed.map((item) => (
                        <div key={`${item.slug}-${item.position}`} className="grid grid-cols-[90px_1fr_120px_160px] gap-4 px-4 py-4 text-sm">
                          <div className="font-semibold text-brand-gold">{item.position}º</div>
                          <div className="font-medium text-white">{item.title}</div>
                          <div className="text-zinc-300">{item.propertyCode}</div>
                          <div className="text-right font-semibold text-white">{formatNumber(item.views)}</div>
                        </div>
                      ))
                    ) : (
                      <EmptyTableState text="Ainda não existem visualizações suficientes no período selecionado." />
                    )}
                  </div>
                </div>
              </article>

              <article className="card-premium p-6 md:p-7">
                <h3 className="text-2xl font-semibold text-white">Top imóveis com mais contatos</h3>
                <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10">
                  <div className="grid grid-cols-[1fr_120px_140px_160px] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    <span>Imóvel</span>
                    <span>WhatsApp</span>
                    <span>Agendar visita</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="divide-y divide-white/10">
                    {data.topContacts.length ? (
                      data.topContacts.map((item) => (
                        <div key={`${item.slug}-${item.propertyCode}`} className="grid grid-cols-[1fr_120px_140px_160px] gap-4 px-4 py-4 text-sm">
                          <div>
                            <p className="font-medium text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-zinc-500">{item.propertyCode}</p>
                          </div>
                          <div className="text-zinc-300">{formatNumber(item.whatsappClicks)}</div>
                          <div className="text-zinc-300">{formatNumber(item.scheduleVisitClicks)}</div>
                          <div className="text-right font-semibold text-white">{formatNumber(item.totalConversions)}</div>
                        </div>
                      ))
                    ) : (
                      <EmptyTableState text="Ainda não existem cliques de contato suficientes no período selecionado." />
                    )}
                  </div>
                </div>
              </article>
            </section>

            <section className="card-premium p-6 md:p-7">
              <h3 className="text-2xl font-semibold text-white">Estatísticas por imóvel</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">Tabela completa com visualizações, cliques de contato, taxa de conversão e data da última visualização.</p>

              <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-white/10">
                <div className="min-w-[1120px]">
                  <div className="grid grid-cols-[88px_1.2fr_110px_120px_120px_150px_140px_180px] gap-4 border-b border-white/10 bg-white/5 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                    <span>Foto</span>
                    <span>Título</span>
                    <span>Código</span>
                    <span>Views</span>
                    <span>WhatsApp</span>
                    <span>Agendar visita</span>
                    <span>Conversão</span>
                    <span>Última visualização</span>
                  </div>
                  <div className="max-h-[720px] divide-y divide-white/10 overflow-y-auto">
                    {data.propertyStats.length ? (
                      data.propertyStats.map((item) => (
                        <div key={item.id} className="grid grid-cols-[88px_1.2fr_110px_120px_120px_150px_140px_180px] gap-4 px-4 py-4 text-sm">
                          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                            {item.coverImage ? <img src={item.coverImage} alt={item.title} className="h-16 w-full object-cover" /> : <div className="flex h-16 items-center justify-center text-xs text-zinc-500">Sem foto</div>}
                          </div>
                          <div>
                            <p className="font-medium text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-zinc-500">{item.city} • {item.district}</p>
                          </div>
                          <div className="text-zinc-300">{item.propertyCode}</div>
                          <div className="text-zinc-300">{formatNumber(item.periodViews)}</div>
                          <div className="text-zinc-300">{formatNumber(item.whatsappClicks)}</div>
                          <div className="text-zinc-300">{formatNumber(item.scheduleVisitClicks)}</div>
                          <div>
                            <p className="font-semibold text-white">{formatPercent(item.conversionRate)}</p>
                            <p className="mt-1 text-xs text-zinc-500">{formatNumber(item.totalConversions)} conversões</p>
                          </div>
                          <div className="text-zinc-400">{formatDate(item.lastViewedAt)}</div>
                        </div>
                      ))
                    ) : (
                      <EmptyTableState text="Nenhum imóvel gerou dados no período selecionado." />
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
