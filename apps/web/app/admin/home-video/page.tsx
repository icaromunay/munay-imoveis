'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Save, Video } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin';
import { buildYoutubeEmbedUrl, getYoutubeThumbnailUrl, parseYoutubeVideo } from '@/lib/youtube';

const emptyForm = {
  homeVideoUrl: '',
  homeVideoStatus: 'INACTIVE',
  homeVideoTitle: '',
  homeVideoDescription: '',
  homeVideoThumbnailUrl: '',
  homeVideoOrder: 1,
  homeVideoAutoplay: true,
  homeVideoMaskEnabled: true
};

function inputClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500';
}

export default function AdminHomeVideoPage() {
  const [form, setForm] = useState<any>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch('/settings/home-video')
      .then((data) => setForm({ ...emptyForm, ...(data || {}) }))
      .catch((err) => setError(err instanceof Error ? err.message : 'Não foi possível carregar as configurações do PLAYER HOME.'))
      .finally(() => setLoading(false));
  }, []);

  const parsedVideo = useMemo(() => parseYoutubeVideo(form.homeVideoUrl || ''), [form.homeVideoUrl]);
  const previewThumbnail = form.homeVideoThumbnailUrl?.trim() || (parsedVideo ? getYoutubeThumbnailUrl(parsedVideo.videoId) : '');

  async function submit() {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      if (form.homeVideoStatus === 'ACTIVE' && !parsedVideo) {
        throw new Error('Informe um link válido do YouTube para ativar o Vídeo Home.');
      }

      const data = await adminFetch('/settings/home-video', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          homeVideoOrder: Number(form.homeVideoOrder || 1)
        })
      });

      setForm({ ...emptyForm, ...(data || {}) });
      setMessage('PLAYER HOME salvo com sucesso. A Home já refletirá a alteração automaticamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o PLAYER HOME.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="PLAYER HOME">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,720px)_minmax(360px,1fr)]">
        <section className="card-premium space-y-6 p-6 md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-gold">Nova funcionalidade</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Configuração completa do PLAYER HOME</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Cole um link do YouTube, defina o status e personalize título, texto de apoio, thumbnail e ordem futura. Quando ativo, o vídeo aparecerá apenas na Home, entre o menu principal e a pesquisa inteligente.
            </p>
          </div>

          {loading ? <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-zinc-300">Carregando configurações do PLAYER HOME...</div> : null}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-white">Link do vídeo do YouTube</span>
              <input
                value={form.homeVideoUrl ?? ''}
                onChange={(e) => setForm({ ...form, homeVideoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                className={inputClassName()}
              />
              <span className="block text-xs text-zinc-500">Aceita links padrão do YouTube, links curtos e links embed. O sistema valida antes de salvar.</span>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Status</span>
              <select value={form.homeVideoStatus ?? 'INACTIVE'} onChange={(e) => setForm({ ...form, homeVideoStatus: e.target.value })} className={inputClassName()}>
                <option value="ACTIVE" className="bg-[#08110d] text-white">Ativo</option>
                <option value="INACTIVE" className="bg-[#08110d] text-white">Inativo</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Ordem de exibição futura</span>
              <input
                type="number"
                min="1"
                max="999"
                value={form.homeVideoOrder ?? 1}
                onChange={(e) => setForm({ ...form, homeVideoOrder: e.target.value })}
                className={inputClassName()}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Autoplay ao abrir a home</span>
              <select value={String(form.homeVideoAutoplay ?? true)} onChange={(e) => setForm({ ...form, homeVideoAutoplay: e.target.value === 'true' })} className={inputClassName()}>
                <option value="true" className="bg-[#08110d] text-white">Sim, iniciar em mudo por baixo da máscara</option>
                <option value="false" className="bg-[#08110d] text-white">Não, deixar parado aguardando clique</option>
              </select>
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-white">Máscara sobre o vídeo</span>
              <select value={String(form.homeVideoMaskEnabled ?? true)} onChange={(e) => setForm({ ...form, homeVideoMaskEnabled: e.target.value === 'true' })} className={inputClassName()}>
                <option value="true" className="bg-[#08110d] text-white">Ativar máscara com botão play e texto</option>
                <option value="false" className="bg-[#08110d] text-white">Desativar máscara visível</option>
              </select>
              <span className="block text-xs text-zinc-500">Combinações possíveis: autoplay + máscara = vídeo roda em mudo por baixo da máscara; sem autoplay + sem máscara = quadro parado aguardando clique; ao clicar, o vídeo reinicia instantaneamente do ponto zero com som.</span>
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-white">Título do vídeo</span>
              <input
                value={form.homeVideoTitle ?? ''}
                onChange={(e) => setForm({ ...form, homeVideoTitle: e.target.value })}
                placeholder="Opcional"
                className={inputClassName()}
              />
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-white">Descrição ou texto de apoio</span>
              <textarea
                rows={4}
                value={form.homeVideoDescription ?? ''}
                onChange={(e) => setForm({ ...form, homeVideoDescription: e.target.value })}
                placeholder="Opcional"
                className={inputClassName()}
              />
            </label>

            <label className="block space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-white">Imagem de capa personalizada (Thumbnail)</span>
              <input
                value={form.homeVideoThumbnailUrl ?? ''}
                onChange={(e) => setForm({ ...form, homeVideoThumbnailUrl: e.target.value })}
                placeholder="Opcional • cole a URL da imagem de capa"
                className={inputClassName()}
              />
              <span className="block text-xs text-zinc-500">Se deixar em branco, o portal usa automaticamente a thumbnail do YouTube.</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={submit} disabled={saving || loading} className="btn-primary px-6 py-3 disabled:opacity-60">
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar PLAYER HOME'}
            </button>
            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="card-premium p-6">
            <div className="flex items-center gap-3">
              <Video size={18} className="text-brand-gold" />
              <div>
                <h3 className="text-xl font-semibold text-white">Resumo do PLAYER HOME</h3>
                <p className="mt-1 text-sm leading-6 text-zinc-400">Validação rápida para evitar links inválidos e garantir uma Home elegante.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-zinc-300">
              <div className="surface-muted flex items-center justify-between gap-3 p-4">
                <span>Status atual</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${form.homeVideoStatus === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-zinc-500/10 text-zinc-300'}`}>
                  {form.homeVideoStatus === 'ACTIVE' ? <Eye size={13} /> : <EyeOff size={13} />}
                  {form.homeVideoStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="surface-muted flex items-center justify-between gap-3 p-4">
                <span>Link válido</span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${parsedVideo ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                  <CheckCircle2 size={13} />
                  {parsedVideo ? 'Válido' : 'Pendente'}
                </span>
              </div>
              <div className="surface-muted flex items-center justify-between gap-3 p-4">
                <span>Autoplay</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${form.homeVideoAutoplay ? 'bg-brand-gold/10 text-brand-gold' : 'bg-zinc-500/10 text-zinc-300'}`}>{form.homeVideoAutoplay ? 'Ligado' : 'Desligado'}</span>
              </div>
              <div className="surface-muted flex items-center justify-between gap-3 p-4">
                <span>Máscara</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] ${form.homeVideoMaskEnabled ? 'bg-brand-gold/10 text-brand-gold' : 'bg-zinc-500/10 text-zinc-300'}`}>{form.homeVideoMaskEnabled ? 'Ativa' : 'Oculta'}</span>
              </div>
              <div className="surface-muted p-4 text-xs leading-6 text-zinc-400">
                O vídeo será exibido somente na Home, acima da busca inteligente. Ao primeiro clique, ele reinicia do ponto zero com som. Depois disso, o clique alterna entre pausar e continuar. Quando inativo, nenhum container extra será renderizado.
              </div>
            </div>
          </section>

          <section className="card-premium p-6">
            <h3 className="text-xl font-semibold text-white">Prévia visual do player</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-400">Prévia visual usada antes do clique no play, para preservar performance e aparência premium.</p>

            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#050907]">
              <div className="relative aspect-video bg-black/20">
                {previewThumbnail ? (
                  <img src={previewThumbnail} alt={form.homeVideoTitle || 'Prévia do Vídeo Home'} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">Informe um link válido do YouTube para liberar a prévia da thumbnail.</div>
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.55))]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full border border-white/15 bg-black/45 px-5 py-3 text-sm font-semibold text-white backdrop-blur">Prévia apenas</div>
                </div>
              </div>
            </div>

            {parsedVideo ? (
              <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-xs leading-6 text-zinc-400">
                <p><span className="font-medium text-white">Vídeo detectado:</span> {parsedVideo.videoId}</p>
                <p className="mt-1 break-all"><span className="font-medium text-white">Embed protegido:</span> {buildYoutubeEmbedUrl(parsedVideo.videoId)}</p>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}
