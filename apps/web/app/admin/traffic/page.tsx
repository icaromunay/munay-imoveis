'use client';

import { useEffect, useState } from 'react';
import { Globe, Plus, Save, Trash2, Waypoints } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin';
import { RedirectItem, TrafficSettings } from '@/lib/types';

const emptyTrafficForm: TrafficSettings = {
  googleTagManagerId: '',
  ga4MeasurementId: '',
  googleSiteVerification: '',
  metaPixelId: '',
  metaDomainVerification: '',
  microsoftClarityId: '',
  bingSiteVerification: '',
  tiktokPixelId: '',
  linkedInPartnerId: '',
  pinterestTagId: '',
  customHeadCode: '',
  customBodyCode: '',
  customFooterCode: '',
  indexNowKey: 'munay-indexnow-key'
};

const emptyRedirectForm = {
  sourcePath: '',
  destination: '',
  type: 301 as 301 | 302,
  active: true
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-white">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  );
}

function baseInputClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500';
}

export default function AdminTrafficPage() {
  const [trafficForm, setTrafficForm] = useState<TrafficSettings>(emptyTrafficForm);
  const [redirects, setRedirects] = useState<RedirectItem[]>([]);
  const [redirectForm, setRedirectForm] = useState(emptyRedirectForm);
  const [editingRedirectId, setEditingRedirectId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [trafficData, redirectsData] = await Promise.all([adminFetch('/settings/traffic'), adminFetch('/redirects')]);
    setTrafficForm({ ...emptyTrafficForm, ...(trafficData || {}) });
    setRedirects(Array.isArray(redirectsData) ? redirectsData : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveTraffic() {
    try {
      setError('');
      setMessage('');
      await adminFetch('/settings/traffic', { method: 'PUT', body: JSON.stringify(trafficForm) });
      setMessage('Configurações de tráfego salvas com sucesso. Os códigos serão carregados automaticamente no portal.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar as configurações de tráfego.');
    }
  }

  async function saveRedirect() {
    try {
      setError('');
      setMessage('');
      if (editingRedirectId) {
        await adminFetch(`/redirects/${editingRedirectId}`, { method: 'PUT', body: JSON.stringify(redirectForm) });
      } else {
        await adminFetch('/redirects', { method: 'POST', body: JSON.stringify(redirectForm) });
      }
      setRedirectForm(emptyRedirectForm);
      setEditingRedirectId(null);
      setMessage('Redirecionamento salvo com sucesso.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o redirecionamento.');
    }
  }

  async function removeRedirect(id: string) {
    await adminFetch(`/redirects/${id}`, { method: 'DELETE' });
    await load();
  }

  return (
    <AdminShell title="Tráfego">
      <div className="space-y-8">
        {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
        {message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}

        <section className="card-premium p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-brand-gold/10 p-3 text-brand-gold">
              <Waypoints size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Integrações de rastreamento e indexação</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                Cadastre GTM, GA4, Search Console, Meta Pixel, Clarity, Bing, TikTok, LinkedIn, Pinterest e scripts personalizados sem editar o código-fonte. Todas as estatísticas internas agora vivem em uma área própria: <strong className="text-white">Views</strong>.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Field label="Google Tag Manager ID" hint="Ex.: GTM-XXXXXXX"><input value={trafficForm.googleTagManagerId || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, googleTagManagerId: e.target.value.toUpperCase() }))} className={baseInputClassName()} /></Field>
            <Field label="GA4 Measurement ID" hint="Ex.: G-XXXXXXXXXX"><input value={trafficForm.ga4MeasurementId || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, ga4MeasurementId: e.target.value.toUpperCase() }))} className={baseInputClassName()} /></Field>
            <Field label="Google Search Console"><input value={trafficForm.googleSiteVerification || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, googleSiteVerification: e.target.value }))} className={baseInputClassName()} /></Field>
            <Field label="Meta Pixel ID"><input value={trafficForm.metaPixelId || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, metaPixelId: e.target.value }))} className={baseInputClassName()} /></Field>
            <Field label="Meta Domain Verification"><input value={trafficForm.metaDomainVerification || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, metaDomainVerification: e.target.value }))} className={baseInputClassName()} /></Field>
            <Field label="Microsoft Clarity Project ID"><input value={trafficForm.microsoftClarityId || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, microsoftClarityId: e.target.value }))} className={baseInputClassName()} /></Field>
            <Field label="Bing Webmaster Verification"><input value={trafficForm.bingSiteVerification || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, bingSiteVerification: e.target.value }))} className={baseInputClassName()} /></Field>
            <Field label="TikTok Pixel ID"><input value={trafficForm.tiktokPixelId || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, tiktokPixelId: e.target.value }))} className={baseInputClassName()} /></Field>
            <Field label="LinkedIn Partner ID"><input value={trafficForm.linkedInPartnerId || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, linkedInPartnerId: e.target.value }))} className={baseInputClassName()} /></Field>
            <Field label="Pinterest Tag ID"><input value={trafficForm.pinterestTagId || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, pinterestTagId: e.target.value }))} className={baseInputClassName()} /></Field>
            <Field label="IndexNow Key" hint="Usada para notificar motores compatíveis quando novos conteúdos forem publicados."><input value={trafficForm.indexNowKey || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, indexNowKey: e.target.value }))} className={baseInputClassName()} /></Field>
          </div>

          <div className="mt-6 grid gap-6">
            <Field label="HEAD personalizado"><textarea rows={5} value={trafficForm.customHeadCode || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, customHeadCode: e.target.value }))} className={baseInputClassName()} /></Field>
            <Field label="BODY personalizado"><textarea rows={5} value={trafficForm.customBodyCode || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, customBodyCode: e.target.value }))} className={baseInputClassName()} /></Field>
            <Field label="FOOTER personalizado"><textarea rows={5} value={trafficForm.customFooterCode || ''} onChange={(e) => setTrafficForm((current) => ({ ...current, customFooterCode: e.target.value }))} className={baseInputClassName()} /></Field>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={saveTraffic} className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-5 py-3 font-semibold text-[#08110d]"><Save size={16} />Salvar integrações</button>
            <div className="rounded-full border border-white/10 px-4 py-3 text-sm text-zinc-400">Preparado para Search Console, Merchant, Discover, News, Bing Webmaster e IndexNow.</div>
          </div>
        </section>

        <section className="card-premium p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-brand-gold/10 p-3 text-brand-gold">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">Redirecionamentos internos</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Gerencie respostas 301 e 302 pelo admin para preservar SEO, corrigir URLs antigas e consolidar páginas amigáveis.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-[1fr_1fr_140px_120px_auto]">
            <input placeholder="Origem /url-antiga" value={redirectForm.sourcePath} onChange={(e) => setRedirectForm((current) => ({ ...current, sourcePath: e.target.value }))} className={baseInputClassName()} />
            <input placeholder="Destino /url-nova ou URL completa" value={redirectForm.destination} onChange={(e) => setRedirectForm((current) => ({ ...current, destination: e.target.value }))} className={baseInputClassName()} />
            <select value={redirectForm.type} onChange={(e) => setRedirectForm((current) => ({ ...current, type: Number(e.target.value) as 301 | 302 }))} className={baseInputClassName()}>
              <option value={301}>301</option>
              <option value={302}>302</option>
            </select>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300"><input type="checkbox" checked={redirectForm.active} onChange={(e) => setRedirectForm((current) => ({ ...current, active: e.target.checked }))} />Ativo</label>
            <button onClick={saveRedirect} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-gold px-5 py-3 font-semibold text-[#08110d]"><Plus size={16} />{editingRedirectId ? 'Atualizar' : 'Adicionar'}</button>
          </div>

          <div className="mt-8 space-y-4">
            {redirects.map((item) => (
              <article key={item.id} className="surface-muted flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-brand-gold/25 bg-brand-gold/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-brand-gold">{item.type}</span>
                    <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${item.active ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-zinc-300'}`}>{item.active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                  <p className="mt-3 font-medium text-white">{item.sourcePath}</p>
                  <p className="mt-1 text-sm text-zinc-400">{item.destination}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setEditingRedirectId(item.id); setRedirectForm({ sourcePath: item.sourcePath, destination: item.destination, type: item.type, active: item.active }); }} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">Editar</button>
                  <button onClick={() => removeRedirect(item.id)} className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 px-4 py-2 text-sm text-rose-300"><Trash2 size={15} />Excluir</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
