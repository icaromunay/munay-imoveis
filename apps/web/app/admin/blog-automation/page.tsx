'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bot, CalendarClock, CheckCircle2, Clock3, KeyRound, Loader2, Save, Settings2, Sparkles } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin';
import { BlogArticleQueue, BlogAutomationSettings } from '@/lib/types';

const emptyForm: BlogAutomationSettings = {
  id: 'new-blog-automation-settings',
  enabled: false,
  provider: 'OPENAI',
  apiKey: '',
  publishTime: '09:00',
  articlesPerDay: 1,
  defaultAuthor: 'Equipe Munay Imóveis',
  defaultCategory: 'Mercado imobiliário',
  autoPublish: false,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString()
};

const providerOptions: Array<{ value: BlogAutomationSettings['provider']; label: string; helper: string }> = [
  { value: 'OPENAI', label: 'OpenAI', helper: 'Estrutura preparada para geração futura com modelos GPT.' },
  { value: 'GEMINI', label: 'Google Gemini', helper: 'Pronto para futura integração com Gemini.' },
  { value: 'CLAUDE', label: 'Anthropic Claude', helper: 'Preparado para uso editorial na próxima etapa.' },
  { value: 'DEEPSEEK', label: 'DeepSeek', helper: 'Opção reservada para futura expansão.' },
  { value: 'CUSTOM', label: 'Outra / Custom', helper: 'Permite adaptar para outro provedor depois.' }
];

const statusMeta: Record<BlogArticleQueue['status'], { label: string; tone: string }> = {
  PENDING: { label: 'Pendente', tone: 'border-amber-400/30 bg-amber-400/10 text-amber-200' },
  GENERATED: { label: 'Gerado', tone: 'border-sky-400/30 bg-sky-400/10 text-sky-200' },
  PUBLISHED: { label: 'Publicado', tone: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' },
  FAILED: { label: 'Falhou', tone: 'border-rose-400/30 bg-rose-400/10 text-rose-200' }
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

export default function AdminBlogAutomationPage() {
  const [form, setForm] = useState<BlogAutomationSettings>(emptyForm);
  const [queue, setQueue] = useState<BlogArticleQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');
      const [settingsResponse, queueResponse] = await Promise.all([
        adminFetch('/blog-automation/settings'),
        adminFetch('/blog-automation/queue?limit=20')
      ]);

      setForm((settingsResponse as BlogAutomationSettings) || emptyForm);
      setQueue(Array.isArray(queueResponse) ? (queueResponse as BlogArticleQueue[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a estrutura da automação do blog.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveSettings() {
    try {
      setSaving(true);
      setError('');
      setMessage('');
      const updated = (await adminFetch('/blog-automation/settings', {
        method: 'PUT',
        body: JSON.stringify({
          enabled: form.enabled,
          provider: form.provider,
          apiKey: form.apiKey || '',
          publishTime: form.publishTime,
          articlesPerDay: form.articlesPerDay,
          defaultAuthor: form.defaultAuthor,
          defaultCategory: form.defaultCategory,
          autoPublish: form.autoPublish
        })
      })) as BlogAutomationSettings;

      setForm(updated);
      setMessage('Estrutura da automação salva com sucesso. A integração com IA poderá ser conectada na próxima etapa.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a automação do blog.');
    } finally {
      setSaving(false);
    }
  }

  const queueSummary = useMemo(() => {
    return {
      total: queue.length,
      pending: queue.filter((item) => item.status === 'PENDING').length,
      published: queue.filter((item) => item.status === 'PUBLISHED').length,
      failed: queue.filter((item) => item.status === 'FAILED').length
    };
  }, [queue]);

  const selectedProvider = providerOptions.find((item) => item.value === form.provider);

  return (
    <AdminShell title="Automação do Blog">
      <div className="space-y-6">
        {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
        {message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}

        <section className="card-premium p-6 md:p-7">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-gold">Publicação automatizada</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Estrutura pronta para artigos gerados por IA</h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-zinc-400">
                Este módulo cria a base administrativa, de banco de dados e de fila editorial para uma futura integração com IA. Nenhum provedor está conectado ainda.
              </p>
            </div>

            <button
              onClick={() => void saveSettings()}
              disabled={saving || loading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gold px-5 py-3 font-semibold text-[#08110d] disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Salvando...' : 'Salvar estrutura'}
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="surface-muted rounded-[1.5rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Automação</p>
            <p className="mt-3 text-2xl font-semibold text-white">{form.enabled ? 'Ativada' : 'Desativada'}</p>
          </article>
          <article className="surface-muted rounded-[1.5rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Artigos por dia</p>
            <p className="mt-3 text-2xl font-semibold text-white">{form.articlesPerDay}</p>
          </article>
          <article className="surface-muted rounded-[1.5rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Fila atual</p>
            <p className="mt-3 text-2xl font-semibold text-white">{queueSummary.total}</p>
          </article>
          <article className="surface-muted rounded-[1.5rem] p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Publicação automática</p>
            <p className="mt-3 text-2xl font-semibold text-white">{form.autoPublish ? 'Sim' : 'Não'}</p>
          </article>
        </section>

        {loading ? (
          <div className="card-premium flex items-center gap-3 p-6 text-zinc-300">
            <Loader2 className="h-5 w-5 animate-spin text-brand-gold" />
            Carregando estrutura de automação do blog...
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <section className="card-premium p-6 md:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-gold/10 p-3 text-brand-gold">
                  <Settings2 size={20} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-zinc-500">Configurações</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">Painel administrativo da automação</h3>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Ativar automação</span>
                  <div className="mt-3 flex items-center gap-3">
                    <input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />
                    <span className="text-sm text-zinc-200">Habilita a rotina de automação para a próxima etapa.</span>
                  </div>
                </label>

                <label className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Publicar automaticamente</span>
                  <div className="mt-3 flex items-center gap-3">
                    <input type="checkbox" checked={form.autoPublish} onChange={(event) => setForm((current) => ({ ...current, autoPublish: event.target.checked }))} />
                    <span className="text-sm text-zinc-200">Mantém preparado o modo de publicação automática futura.</span>
                  </div>
                </label>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                  <label className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Escolher IA</label>
                  <select
                    value={form.provider}
                    onChange={(event) => setForm((current) => ({ ...current, provider: event.target.value as BlogAutomationSettings['provider'] }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-white outline-none"
                  >
                    {providerOptions.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[#08110d] text-white">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-3 text-sm text-zinc-400">{selectedProvider?.helper}</p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                  <label className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Inserir API Key</label>
                  <div className="relative mt-3">
                    <KeyRound size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="password"
                      value={form.apiKey || ''}
                      onChange={(event) => setForm((current) => ({ ...current, apiKey: event.target.value }))}
                      placeholder="sk-..."
                      className="w-full rounded-2xl border border-white/10 bg-[#08110d] py-3 pl-11 pr-4 text-white outline-none"
                    />
                  </div>
                  <p className="mt-3 text-sm text-zinc-500">A chave é apenas armazenada como estrutura administrativa. Nenhuma chamada externa será feita agora.</p>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <label className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Horário da publicação</label>
                  <div className="relative mt-3">
                    <Clock3 size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="time"
                      value={form.publishTime}
                      onChange={(event) => setForm((current) => ({ ...current, publishTime: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-[#08110d] py-3 pl-11 pr-4 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <label className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Quantidade de artigos por dia</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={form.articlesPerDay}
                    onChange={(event) => setForm((current) => ({ ...current, articlesPerDay: Math.max(1, Number(event.target.value) || 1) }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-white outline-none"
                  />
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <label className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Autor padrão</label>
                  <input
                    value={form.defaultAuthor}
                    onChange={(event) => setForm((current) => ({ ...current, defaultAuthor: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-white outline-none"
                  />
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
                  <label className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Categoria padrão</label>
                  <input
                    value={form.defaultCategory}
                    onChange={(event) => setForm((current) => ({ ...current, defaultCategory: event.target.value }))}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-white outline-none"
                  />
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <section className="card-premium p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-gold/10 p-3 text-brand-gold">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Próxima etapa</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">Integração preparada</h3>
                  </div>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-zinc-300">
                  <li>• Configuração persistida em tabela dedicada.</li>
                  <li>• Fila de artigos com status e agendamento.</li>
                  <li>• Estrutura pronta para cron, workers ou webhooks depois.</li>
                  <li>• Nenhuma IA conectada nesta etapa, conforme solicitado.</li>
                </ul>
              </section>

              <section className="card-premium p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-brand-gold/10 p-3 text-brand-gold">
                    <Bot size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Fila editorial</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">BlogArticleQueue</h3>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Pendentes</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{queueSummary.pending}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Publicados</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{queueSummary.published}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Falhas</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{queueSummary.failed}</p>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        )}

        <section className="card-premium p-6 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-brand-gold">Visualização administrativa</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Fila de artigos preparados para automação</h2>
            </div>
            <p className="text-sm text-zinc-500">Tabela pronta para receber artigos gerados, agendados e publicados futuramente.</p>
          </div>

          {queue.length ? (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500">
                    <th className="px-4 py-3 font-medium">Título</th>
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Agendado</th>
                    <th className="px-4 py-3 font-medium">Publicado</th>
                    <th className="px-4 py-3 font-medium">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.id} className="border-b border-white/5 text-zinc-300">
                      <td className="px-4 py-4 align-top">
                        <p className="font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">/{item.slug}</p>
                      </td>
                      <td className="px-4 py-4 align-top">{item.category}</td>
                      <td className="px-4 py-4 align-top">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.22em] ${statusMeta[item.status].tone}`}>
                          {statusMeta[item.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">{formatDateTime(item.scheduledAt)}</td>
                      <td className="px-4 py-4 align-top">{formatDateTime(item.publishedAt)}</td>
                      <td className="px-4 py-4 align-top">{formatDateTime(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 rounded-[1.6rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-zinc-300">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-1 text-brand-gold" size={20} />
                <div>
                  <p className="font-semibold text-white">Fila vazia, estrutura pronta</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Nenhum artigo foi colocado na fila ainda. A tabela BlogArticleQueue já está preparada para armazenar títulos, conteúdo, SEO, tags, status, agendamento e publicação.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="card-premium p-6 md:p-7">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-300" size={20} />
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Escopo entregue</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Base pronta para próxima etapa de IA</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">Tabela <strong className="text-white">BlogAutomationSettings</strong> criada.</div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">Tabela <strong className="text-white">BlogArticleQueue</strong> criada.</div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">Endpoints administrativos preparados para configuração e fila.</div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">Tela administrativa <strong className="text-white">Admin &gt; Automação do Blog</strong> adicionada.</div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
