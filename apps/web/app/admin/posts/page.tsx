'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Copy, Eye, FilePlus2, PencilLine, Save, Search, Trash2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { RichTextContent } from '@/components/content/RichTextContent';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { adminFetch } from '@/lib/admin';
import { Post } from '@/lib/types';

type PostEditorForm = {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: string;
  author: string;
  published: boolean;
};

type EditorTab = 'visual' | 'html';

const emptyForm: PostEditorForm = {
  title: '',
  excerpt: '',
  content: '',
  coverImage: '',
  category: 'Mercado imobiliário',
  author: 'Equipe Munay Imóveis',
  published: true
};

function toForm(post: Post): PostEditorForm {
  return {
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    coverImage: post.coverImage,
    category: post.category,
    author: post.author,
    published: post.published
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function isSameForm(a: PostEditorForm, b: PostEditorForm) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function buildPostPayload(form: PostEditorForm) {
  return {
    title: form.title.trim(),
    excerpt: form.excerpt.trim(),
    content: form.content.trim(),
    coverImage: form.coverImage.trim(),
    category: form.category.trim(),
    author: form.author.trim(),
    published: form.published
  };
}

function PostPreviewModal({
  open,
  form,
  onClose
}: {
  open: boolean;
  form: PostEditorForm;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#020608]/80 p-4 backdrop-blur-md md:p-8" onClick={onClose}>
      <div className="mx-auto max-h-[calc(100vh-2rem)] max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#08110d] p-6 shadow-2xl md:p-8" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-brand-gold">Pré-visualização do artigo</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{form.title || 'Artigo sem título'}</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white">
            Fechar
          </button>
        </div>

        {form.coverImage ? (
          <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5">
            <img src={form.coverImage} alt={form.title || 'Capa do artigo'} className="h-[260px] w-full object-cover md:h-[420px]" />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-zinc-400">
          <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1.5 text-brand-gold">{form.category || 'Sem categoria'}</span>
          <span>{form.author || 'Sem autor'}</span>
          <span>{form.published ? 'Publicado' : 'Rascunho'}</span>
        </div>

        <p className="mt-6 text-lg leading-8 text-zinc-300">{form.excerpt || 'Resumo do artigo aparecerá aqui.'}</p>
        <RichTextContent html={form.content} className="mt-8 text-lg leading-8" />
      </div>
    </div>
  );
}

export default function AdminPostsPage() {
  const [items, setItems] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Record<string, PostEditorForm>>({ new: emptyForm });
  const [savedForms, setSavedForms] = useState<Record<string, PostEditorForm>>({});
  const [activeKey, setActiveKey] = useState<string>('new');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<EditorTab>('visual');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const activeForm = drafts[activeKey] || (activeKey === 'new' ? emptyForm : savedForms[activeKey] || emptyForm);
  const activeSavedForm = activeKey === 'new' ? emptyForm : savedForms[activeKey] || emptyForm;
  const isDirty = !isSameForm(activeForm, activeSavedForm);
  const activePost = items.find((item) => item.id === activeKey) || null;

  async function load() {
    try {
      setLoading(true);
      setError('');
      const data = await adminFetch('/posts/admin/all');
      const nextItems = Array.isArray(data) ? (data as Post[]) : [];
      const nextSavedForms = nextItems.reduce<Record<string, PostEditorForm>>((accumulator, item) => {
        accumulator[item.id] = toForm(item);
        return accumulator;
      }, {});

      setItems(nextItems);
      setSavedForms(nextSavedForms);
      setDrafts((current) => {
        const nextDrafts = { ...current };
        nextItems.forEach((item) => {
          if (!nextDrafts[item.id]) {
            nextDrafts[item.id] = toForm(item);
          }
        });
        if (!nextDrafts.new) nextDrafts.new = emptyForm;
        return nextDrafts;
      });

      setActiveKey((current) => {
        if (current === 'new') return current;
        return nextItems.some((item) => item.id === current) ? current : 'new';
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os artigos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  function updateActiveForm(patch: Partial<PostEditorForm>) {
    setDrafts((current) => ({
      ...current,
      [activeKey]: {
        ...(current[activeKey] || (activeKey === 'new' ? emptyForm : savedForms[activeKey] || emptyForm)),
        ...patch
      }
    }));
    setMessage('');
  }

  function selectPost(id: string) {
    setActiveKey(id);
    setTab('visual');
    setMessage('');
    setError('');
  }

  function startNewArticle() {
    setDrafts((current) => ({ ...current, new: current.new || emptyForm }));
    setActiveKey('new');
    setTab('visual');
    setMessage('');
    setError('');
  }

  function discardChanges() {
    setDrafts((current) => ({
      ...current,
      [activeKey]: activeKey === 'new' ? emptyForm : savedForms[activeKey] || emptyForm
    }));
    setMessage('Alterações descartadas.');
  }

  async function saveCurrent() {
    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = buildPostPayload(activeForm);

      if (!payload.title || !payload.excerpt || !payload.content || !payload.coverImage || !payload.category || !payload.author) {
        throw new Error('Preencha título, resumo, conteúdo, imagem de capa, categoria e autor antes de salvar.');
      }

      if (activeKey === 'new') {
        const created = (await adminFetch('/posts', { method: 'POST', body: JSON.stringify(payload) })) as Post;
        const createdForm = toForm(created);
        setItems((current) => [created, ...current]);
        setSavedForms((current) => ({ ...current, [created.id]: createdForm }));
        setDrafts((current) => ({ ...current, [created.id]: createdForm, new: emptyForm }));
        setActiveKey(created.id);
        setMessage('Artigo criado com sucesso.');
      } else {
        const updated = (await adminFetch(`/posts/${activeKey}`, { method: 'PUT', body: JSON.stringify(payload) })) as Post;
        const updatedForm = toForm(updated);
        setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setSavedForms((current) => ({ ...current, [updated.id]: updatedForm }));
        setDrafts((current) => ({ ...current, [updated.id]: updatedForm }));
        setMessage('Artigo atualizado com sucesso.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o artigo.');
    } finally {
      setSaving(false);
    }
  }

  async function duplicatePost(id: string) {
    try {
      setError('');
      setMessage('');
      const duplicated = (await adminFetch(`/posts/${id}/duplicate`, { method: 'POST' })) as Post;
      const duplicatedForm = toForm(duplicated);
      setItems((current) => [duplicated, ...current]);
      setSavedForms((current) => ({ ...current, [duplicated.id]: duplicatedForm }));
      setDrafts((current) => ({ ...current, [duplicated.id]: duplicatedForm }));
      setActiveKey(duplicated.id);
      setMessage('Artigo duplicado com sucesso.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível duplicar o artigo.');
    }
  }

  async function remove(id: string) {
    const item = items.find((post) => post.id === id);
    if (!item) return;
    if (!window.confirm(`Excluir o artigo "${item.title}"?`)) return;

    try {
      setError('');
      setMessage('');
      await adminFetch(`/posts/${id}`, { method: 'DELETE' });
      setItems((current) => current.filter((entry) => entry.id !== id));
      setSavedForms((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setActiveKey((current) => (current === id ? 'new' : current));
      setMessage('Artigo excluído.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o artigo.');
    }
  }

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.title} ${item.category} ${item.author}`.toLowerCase().includes(normalized));
  }, [items, search]);

  return (
    <AdminShell title="Gerenciar blog • Editor profissional">
      <PostPreviewModal open={previewOpen} form={activeForm} onClose={() => setPreviewOpen(false)} />

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,30%)_minmax(0,1fr)]">
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <section className="card-premium p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-brand-gold">Conteúdo</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Lista de artigos</h2>
              </div>
              <button onClick={startNewArticle} className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-[#08110d]">
                <FilePlus2 size={15} /> Novo artigo
              </button>
            </div>

            <div className="relative mt-4">
              <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar artigo por título, categoria ou autor"
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white outline-none"
              />
            </div>

            <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-zinc-500">
              <span>{filteredItems.length} artigo(s)</span>
              <span>{items.filter((item) => item.published).length} publicados</span>
            </div>
          </section>

          <section className="space-y-3">
            {loading ? (
              <div className="card-premium px-5 py-6 text-zinc-300">Carregando artigos...</div>
            ) : filteredItems.length ? (
              filteredItems.map((item) => {
                const selected = activeKey === item.id;
                const itemDirty = drafts[item.id] && !isSameForm(drafts[item.id], savedForms[item.id] || toForm(item));
                return (
                  <article
                    key={item.id}
                    onClick={() => selectPost(item.id)}
                    className={`card-premium cursor-pointer p-4 transition ${selected ? 'border-brand-gold/40 ring-1 ring-brand-gold/30' : 'hover:border-white/20'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold text-white">{item.title}</p>
                          {itemDirty ? <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-amber-200">Não salvo</span> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-zinc-500">
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">{item.category}</span>
                          <span className={`rounded-full border px-2.5 py-1 ${item.published ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-zinc-300'}`}>
                            {item.published ? 'Publicado' : 'Rascunho'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          selectPost(item.id);
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-300"
                        title="Editar artigo"
                      >
                        <PencilLine size={15} />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                      <CalendarDays size={14} className="text-brand-gold" />
                      {formatDate(item.updatedAt || item.createdAt)}
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-300">{item.excerpt}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void duplicatePost(item.id);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white"
                      >
                        <Copy size={14} /> Duplicar
                      </button>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void remove(item.id);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-500/25 px-3 py-2 text-xs text-rose-200"
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="card-premium px-5 py-6 text-zinc-300">Nenhum artigo encontrado para a busca atual.</div>
            )}
          </section>
        </aside>

        <section className="space-y-4">
          {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
          {message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}

          <div className="card-premium p-5 md:p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-brand-gold">Workspace editorial</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{activeKey === 'new' ? 'Novo artigo' : activeForm.title || 'Edição de artigo'}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                  Interface reestruturada para escrita longa, colagem de HTML puro, preview real e edição instantânea sem recarregar a página.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={() => setPreviewOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                  <Eye size={15} /> Visualizar artigo
                </button>
                {activeKey !== 'new' ? (
                  <button onClick={() => void duplicatePost(activeKey)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                    <Copy size={15} /> Duplicar
                  </button>
                ) : null}
                <button onClick={discardChanges} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white">
                  Descartar alterações
                </button>
                <button onClick={() => void saveCurrent()} disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-5 py-2.5 text-sm font-semibold text-[#08110d] disabled:opacity-60">
                  <Save size={15} /> {saving ? 'Salvando...' : activeKey === 'new' ? 'Salvar artigo' : 'Atualizar artigo'}
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_320px]">
              <div className="space-y-4">
                <input
                  placeholder="Título do artigo"
                  value={activeForm.title}
                  onChange={(event) => updateActiveForm({ title: event.target.value })}
                  className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-2xl font-semibold text-white outline-none"
                />
                <textarea
                  placeholder="Resumo do artigo"
                  value={activeForm.excerpt}
                  onChange={(event) => updateActiveForm({ excerpt: event.target.value })}
                  rows={4}
                  className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-4 text-white outline-none"
                />
              </div>

              <div className="space-y-4 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Categoria</p>
                  <input value={activeForm.category} onChange={(event) => updateActiveForm({ category: event.target.value })} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-white outline-none" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Autor</p>
                  <input value={activeForm.author} onChange={(event) => updateActiveForm({ author: event.target.value })} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-white outline-none" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Imagem de capa</p>
                  <input value={activeForm.coverImage} onChange={(event) => updateActiveForm({ coverImage: event.target.value })} placeholder="https://..." className="mt-2 w-full rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-white outline-none" />
                </div>
                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-sm text-zinc-200">
                  <input type="checkbox" checked={activeForm.published} onChange={(event) => updateActiveForm({ published: event.target.checked })} />
                  Publicado
                </label>
                <div className="rounded-2xl border border-white/10 bg-[#08110d] px-4 py-3 text-xs uppercase tracking-[0.22em] text-zinc-500">
                  {isDirty ? 'Alterações não salvas' : 'Tudo sincronizado'}
                  {activePost ? <span className="mt-2 block normal-case tracking-normal text-zinc-400">Última atualização: {formatDate(activePost.updatedAt || activePost.createdAt)}</span> : null}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-3">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                <button
                  onClick={() => setTab('visual')}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${tab === 'visual' ? 'bg-brand-gold text-[#08110d]' : 'border border-white/10 text-white'}`}
                >
                  VISUAL
                </button>
                <button
                  onClick={() => setTab('html')}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${tab === 'html' ? 'bg-brand-gold text-[#08110d]' : 'border border-white/10 text-white'}`}
                >
                  HTML
                </button>
                <p className="ml-auto text-xs uppercase tracking-[0.24em] text-zinc-500">
                  {tab === 'visual' ? 'Editor visual estilo portal/WordPress' : 'Cole HTML pronto gerado pelo ChatGPT'}
                </p>
              </div>

              <div className="pt-4">
                {tab === 'visual' ? (
                  <RichTextEditor
                    value={activeForm.content}
                    onChange={(value) => updateActiveForm({ content: value })}
                    placeholder="Escreva o artigo com títulos, subtítulos, citações, botões, imagens, tabelas e destaques."
                  />
                ) : (
                  <textarea
                    value={activeForm.content}
                    onChange={(event) => updateActiveForm({ content: event.target.value })}
                    rows={22}
                    spellCheck={false}
                    className="min-h-[620px] w-full rounded-[1.5rem] border border-white/10 bg-[#08110d] px-5 py-5 font-mono text-sm leading-7 text-white outline-none"
                    placeholder={`<h1>Os 7 sinais de que uma região vai valorizar</h1>\n<p>Texto do artigo...</p>`}
                  />
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
