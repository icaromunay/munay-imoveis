'use client';

import Link from 'next/link';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { CheckCircle2, ChevronDown, ChevronUp, Loader2, LogOut, ShieldCheck, UploadCloud } from 'lucide-react';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { categoryLabel, formatCurrency } from '@/lib/format';
import { categoryHasRooms, defaultPropertyType } from '@/lib/property-utils';
import { prepareImageFile, PreparedImage } from '@/lib/image-upload';
import { clearOwnerSession, ownerFetch } from '@/lib/owner-auth';
import { Property } from '@/lib/types';

const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];

const categories = [
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'TERRENO', label: 'Terreno' },
  { value: 'LOTEAMENTO', label: 'Loteamento' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'RURAL', label: 'Rural' }
] as const;

const emptyForm = {
  ownerPhone: '',
  title: '',
  shortDescription: '',
  fullDescription: '',
  price: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  garage: '',
  city: '',
  district: '',
  state: 'SC',
  category: 'CASA',
  type: ''
};

function inputClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500';
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-white">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}

function statusMeta(item: Property) {
  if (item.approved === false) {
    return {
      label: 'Aguardando aprovação',
      className: 'border-amber-400/30 bg-amber-400/10 text-amber-200'
    };
  }

  return {
    label: 'Publicado no site',
    className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
  };
}

export function OwnerSubmissionPortal() {
  const { data: session, status } = useSession();
  const currentUser = session?.user;
  const isAuthenticated = status === 'authenticated' && Boolean(currentUser?.email);
  const userName = currentUser?.name || 'Proprietário';
  const userEmail = currentUser?.email || '';
  const userImage = currentUser?.image || null;

  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [items, setItems] = useState<Property[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<PreparedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ percent: number; current: number; total: number; currentFile: string; stage: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const previewPrice = useMemo(() => (form.price ? Number(form.price) : 0), [form.price]);
  const showRoomFields = useMemo(() => categoryHasRooms(form.category), [form.category]);

  async function loadMyProperties() {
    if (!userEmail) return;

    try {
      setLoadingItems(true);
      setError('');
      const data = await ownerFetch('/properties/owner/my');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar seus imóveis.');
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void loadMyProperties();
    } else {
      setItems([]);
    }
  }, [isAuthenticated, userEmail]);

  function resetForm() {
    setForm(emptyForm);
    setImagePreviews([]);
    setUploadProgress(null);
    setEditingId(null);
  }

  function fillEdit(item: Property) {
    setEditingId(item.id);
    setForm({
      ownerPhone: item.ownerPhone || '',
      title: item.title,
      shortDescription: item.shortDescription,
      fullDescription: item.fullDescription,
      price: String(item.price || ''),
      area: String(item.area || ''),
      bedrooms: item.bedrooms ? String(item.bedrooms) : '',
      bathrooms: item.bathrooms ? String(item.bathrooms) : '',
      garage: item.garage ? String(item.garage) : '',
      city: item.city,
      district: item.district,
      state: item.state,
      category: item.category,
      type: item.type
    });
    setImagePreviews(
      (item.images || []).slice(0, 20).map((image, index) => ({
        id: image.id || `${item.id}-${index}`,
        url: image.url,
        name: image.alt || `Imagem ${index + 1}`,
        format: 'original',
        sizeKb: 0
      }))
    );
    setMessage(`Editando: ${item.title}`);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const remainingSlots = 20 - imagePreviews.length;
    if (remainingSlots <= 0) {
      setError('Você já atingiu o limite de 20 fotos por imóvel.');
      event.target.value = '';
      return;
    }

    setUploadingImages(true);
    setError('');
    setMessage('');

    try {
      const selectedFiles = files.slice(0, remainingSlots);
      const preparedImages: PreparedImage[] = [];

      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index];
        const prepared = await prepareImageFile(file, (progress) => {
          const percent = Math.max(1, Math.min(100, Math.round(((index + progress.percent / 100) / selectedFiles.length) * 100)));
          setUploadProgress({
            percent,
            current: index + 1,
            total: selectedFiles.length,
            currentFile: progress.fileName,
            stage: progress.stage
          });
        });
        preparedImages.push(prepared);
      }

      setImagePreviews((current) => [...current, ...preparedImages].slice(0, 20));
      setUploadProgress({
        percent: 100,
        current: selectedFiles.length,
        total: selectedFiles.length,
        currentFile: selectedFiles[selectedFiles.length - 1]?.name || '',
        stage: 'Upload preparado com imagens otimizadas'
      });
      setMessage(`${Math.min(files.length, remainingSlots)} foto(s) pronta(s). O sistema converte JPG/PNG para WEBP, mantém WEBP, gera miniatura e salva o upload final otimizado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível preparar as imagens.');
      setUploadProgress(null);
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  }

  function removeImage(id: string) {
    setImagePreviews((current) => current.filter((image) => image.id !== id));
  }

  function moveImage(id: string, direction: 'up' | 'down') {
    setImagePreviews((current) => {
      const index = current.findIndex((image) => image.id === id);
      if (index < 0) return current;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [selected] = next.splice(index, 1);
      next.splice(targetIndex, 0, selected);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isAuthenticated || !userEmail) {
      setError('Entre com sua conta para enviar seu imóvel.');
      return;
    }

    if (!imagePreviews.length) {
      setError('Envie pelo menos uma foto do imóvel.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        ownerPhone: form.ownerPhone,
        title: form.title,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        price: Number(form.price),
        area: Number(form.area),
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        garage: form.garage ? Number(form.garage) : null,
        city: form.city,
        district: form.district,
        state: form.state,
        category: form.category,
        type: defaultPropertyType(form.category),
        images: imagePreviews.map((image) => image.url),
        website: ''
      };

      const endpoint = editingId ? `/properties/owner/${editingId}` : '/properties/submit';
      const method = editingId ? 'PUT' : 'POST';
      const saved = await ownerFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      setMessage(editingId ? 'Alterações enviadas para nova revisão administrativa.' : 'Imóvel enviado com sucesso para análise e aprovação.');
      resetForm();
      await loadMyProperties();

      if (!editingId && saved?.id) {
        setItems((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o imóvel para aprovação.');
    } finally {
      setSubmitting(false);
    }
  }

  function logout() {
    clearOwnerSession();
    setItems([]);
    resetForm();
    setMessage('Sessão encerrada.');
    void signOut({ redirectTo: '/login' });
  }

  if (status === 'loading') {
    return (
      <section className="container-base py-10 md:py-14">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-zinc-300 shadow-soft md:p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-brand-gold" />
            Carregando sua sessão do proprietário...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-base py-10 md:py-14">
      <div className="grid gap-6 lg:grid-cols-[1.12fr,0.88fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-soft md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Área do proprietário</p>
              <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Cadastre e acompanhe seus imóveis</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
                Crie sua conta com dados básicos, faça login com e-mail e senha e acompanhe todos os envios até a aprovação final.
              </p>
            </div>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/5"
              >
                <LogOut size={16} />
                Sair
              </button>
            ) : null}
          </div>

          {!isAuthenticated ? (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-white/10 bg-black/10 p-6">
              <div className="flex items-start gap-3 text-zinc-300">
                <ShieldCheck className="mt-0.5 text-brand-gold" size={18} />
                <div>
                  <p className="font-medium text-white">Entre ou crie sua conta</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    O acesso do proprietário agora é simples: crie sua conta com nome, WhatsApp, CPF, e-mail, senha e endereço. Depois,
                    basta entrar com e-mail e senha para anunciar.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/cadastro-proprietario" className="btn-primary px-5 py-3">
                  Criar conta
                </Link>
                <Link href="/login" className="btn-secondary px-5 py-3">
                  Fazer login
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="flex flex-wrap items-center gap-4 rounded-[1.75rem] border border-white/10 bg-black/10 p-5">
                {userImage ? (
                  <img src={userImage} alt={userName} className="h-14 w-14 rounded-full border border-white/10 object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-semibold text-white">
                    {(userName || userEmail || 'U').slice(0, 1)}
                  </div>
                )}
                <div>
                  <p className="text-sm text-zinc-400">Conectado como</p>
                  <p className="text-lg font-semibold text-white">{userName}</p>
                  <p className="text-sm text-zinc-400">{userEmail}</p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-black/10 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium text-white">{editingId ? 'Editando imóvel pendente' : 'Novo envio para análise'}</p>
                    <p className="mt-1 text-sm text-zinc-400">Toda inclusão ou alteração depende de revisão administrativa antes de publicar no site.</p>
                  </div>
                  {editingId ? (
                    <button type="button" onClick={resetForm} className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/5">
                      Cancelar edição
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nome do proprietário">
                    <input className={inputClassName()} value={userName} readOnly />
                  </Field>
                  <Field label="Conta autenticada">
                    <input className={inputClassName()} value={userEmail} readOnly />
                  </Field>
                  <Field label="WhatsApp">
                    <input className={inputClassName()} value={form.ownerPhone} onChange={(event) => setForm((current) => ({ ...current, ownerPhone: event.target.value }))} placeholder="(48) 99999-9999" required />
                  </Field>
                  <Field label="Categoria">
                    <select
                      className={inputClassName()}
                      value={form.category}
                      onChange={(event) => {
                        const nextCategory = event.target.value;
                        setForm((current) => ({
                          ...current,
                          category: nextCategory,
                          bedrooms: categoryHasRooms(nextCategory) ? current.bedrooms : '',
                          bathrooms: categoryHasRooms(nextCategory) ? current.bathrooms : '',
                          garage: categoryHasRooms(nextCategory) ? current.garage : ''
                        }));
                      }}
                    >
                      {categories.map((item) => (
                        <option key={item.value} value={item.value} className="bg-[#08110d] text-white">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Título do imóvel">
                    <input className={inputClassName()} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} required />
                  </Field>
                  <Field label="Cidade">
                    <input className={inputClassName()} value={form.city} onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))} required />
                  </Field>
                  <Field label="Bairro">
                    <input className={inputClassName()} value={form.district} onChange={(event) => setForm((current) => ({ ...current, district: event.target.value }))} required />
                  </Field>
                  <Field label="Estado">
                    <select className={inputClassName()} value={form.state} onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}>
                      {states.map((item) => (
                        <option key={item} value={item} className="bg-[#08110d] text-white">
                          {item}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Valor de venda">
                    <input className={inputClassName()} type="number" min="1" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} required />
                  </Field>
                  <Field label="Área em m²">
                    <input className={inputClassName()} type="number" min="1" value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))} required />
                  </Field>
                  {showRoomFields ? (
                    <>
                      <Field label="Quartos">
                        <input className={inputClassName()} type="number" min="0" value={form.bedrooms} onChange={(event) => setForm((current) => ({ ...current, bedrooms: event.target.value }))} />
                      </Field>
                      <Field label="Banheiros">
                        <input className={inputClassName()} type="number" min="0" value={form.bathrooms} onChange={(event) => setForm((current) => ({ ...current, bathrooms: event.target.value }))} />
                      </Field>
                      <Field label="Vagas de garagem">
                        <input className={inputClassName()} type="number" min="0" value={form.garage} onChange={(event) => setForm((current) => ({ ...current, garage: event.target.value }))} />
                      </Field>
                    </>
                  ) : null}
                </div>

                <Field label="Descrição curta" hint="Texto que aparece no card do site.">
                  <textarea className={`${inputClassName()} min-h-28`} value={form.shortDescription} onChange={(event) => setForm((current) => ({ ...current, shortDescription: event.target.value }))} required />
                </Field>

                <Field label="Descrição completa" hint="Editor rico com títulos, listas, links, cores, destaque, alinhamento, tabelas simples e emojis.">
                  <RichTextEditor value={form.fullDescription ?? ''} onChange={(value) => setForm((current) => ({ ...current, fullDescription: value }))} placeholder="Descreva os diferenciais do imóvel com subtítulos, listas e localização." />
                </Field>

                <div className="rounded-[1.75rem] border border-white/10 bg-black/10 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">Fotos do imóvel</p>
                      <p className="mt-1 text-sm text-zinc-400">Envie até 20 fotos. O sistema otimiza em WebP quando possível e mantém JPG quando necessário.</p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-gold px-4 py-3 text-sm font-semibold text-[#08110d] transition hover:brightness-105">
                      {uploadingImages ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                      Selecionar fotos
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>

                  {uploadProgress ? (
                    <div className="mt-5 space-y-3 rounded-[1.4rem] border border-brand-gold/20 bg-brand-gold/10 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-200">
                        <div className="inline-flex items-center gap-2">{uploadingImages ? <Loader2 size={16} className="animate-spin" /> : null}<span>{uploadProgress.stage}</span></div>
                        <span className="font-medium text-brand-gold">{uploadProgress.percent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-brand-gold transition-all duration-300" style={{ width: `${uploadProgress.percent}%` }} />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
                        <span>{uploadProgress.currentFile}</span>
                        <span>Foto {uploadProgress.current} de {uploadProgress.total}</span>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {imagePreviews.length ? (
                      imagePreviews.map((image, index) => (
                        <article key={image.id} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
                          <div className="relative aspect-[4/3] overflow-hidden bg-black/20">
                            <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                            <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                              {index === 0 ? 'Capa' : `Foto ${index + 1}`}
                            </span>
                          </div>
                          <div className="space-y-3 p-4 text-sm text-zinc-300">
                            <p className="truncate font-medium text-white">{image.name}</p>
                            <p>{image.originalFormat === 'webp' ? 'WEBP preservado e otimizado' : 'Convertido automaticamente para WEBP'} {image.optimizedSizeKb ? `• ${image.optimizedSizeKb} KB` : image.sizeKb ? `• ${image.sizeKb} KB` : ''}</p>
                            {image.originalSizeKb ? <p className="text-xs text-zinc-400">Original: {image.originalSizeKb} KB • Final: {image.optimizedSizeKb || image.sizeKb} KB</p> : null}
                            {image.thumbnailSizeKb ? <p className="text-xs text-zinc-400">Miniatura: {image.thumbnailSizeKb} KB • 400px WEBP</p> : null}
                            {typeof image.compressionRatio === 'number' ? <p className="text-xs text-zinc-400">Redução estimada: {image.compressionRatio}%</p> : null}
                            <div className="flex flex-wrap gap-2">
                              <button type="button" onClick={() => moveImage(image.id, 'up')} className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/5">
                                <ChevronUp size={14} className="inline" /> Subir
                              </button>
                              <button type="button" onClick={() => moveImage(image.id, 'down')} className="rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-200 transition hover:bg-white/5">
                                <ChevronDown size={14} className="inline" /> Descer
                              </button>
                              <button type="button" onClick={() => removeImage(image.id)} className="rounded-full border border-rose-400/20 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-400/10">
                                Remover
                              </button>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400 md:col-span-2 xl:col-span-3">
                        Nenhuma foto enviada ainda.
                      </div>
                    )}
                  </div>
                </div>

                {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
                {message ? <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}

                <div className="flex flex-wrap gap-3">
                  <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-brand-gold px-5 py-3 text-sm font-semibold text-[#08110d] transition hover:brightness-105 disabled:opacity-70">
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {editingId ? 'Salvar edição para revisão' : 'Enviar para aprovação'}
                  </button>
                  <button type="button" onClick={resetForm} className="rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-200 transition hover:bg-white/5">
                    Limpar formulário
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-soft md:p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Prévia</p>
            <div className="mt-5 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b1712]">
              <div className="aspect-[4/3] overflow-hidden bg-black/20">
                {imagePreviews[0]?.url ? <img src={imagePreviews[0].url} alt={form.title || 'Prévia do imóvel'} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-zinc-500">A capa aparecerá aqui</div>}
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-brand-gold/20 bg-brand-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-brand-gold">
                    {categoryLabel[form.category] || form.category}
                  </span>
                  <span className="text-sm font-medium text-white">{previewPrice ? formatCurrency(previewPrice) : 'Informe o valor'}</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{form.title || 'Título do imóvel'}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{form.shortDescription || 'A descrição curta aparecerá aqui para você revisar antes de enviar.'}</p>
                </div>
                <div className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
                  <div>
                    <p className="text-zinc-500">Localização</p>
                    <p className="mt-1">{form.city || 'Cidade'} • {form.district || 'Bairro'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Área</p>
                    <p className="mt-1">{form.area ? `${form.area} m²` : 'Informe a metragem'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-soft md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Meus envios</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Acompanhe aprovação e edite pendências</h2>
              </div>
              {isAuthenticated ? (
                <button type="button" onClick={() => void loadMyProperties()} className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/5">
                  Atualizar
                </button>
              ) : null}
            </div>

            <div className="mt-6 space-y-4">
              {loadingItems ? (
                <div className="flex items-center gap-3 rounded-[1.5rem] border border-white/10 bg-black/10 px-4 py-4 text-sm text-zinc-300">
                  <Loader2 size={16} className="animate-spin text-brand-gold" />
                  Carregando seus imóveis...
                </div>
              ) : items.length ? (
                items.map((item) => {
                  const meta = statusMeta(item);
                  const canEdit = item.approved === false && item.submittedByOwner;
                  return (
                    <article key={item.id} className="rounded-[1.5rem] border border-white/10 bg-black/10 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                            <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${meta.className}`}>{meta.label}</span>
                          </div>
                          <p className="mt-2 text-sm text-zinc-400">{item.propertyCode} • {categoryLabel[item.category] || item.category} • {item.city} • {item.district}</p>
                          <p className="mt-3 text-sm leading-6 text-zinc-300">{item.shortDescription}</p>
                        </div>
                        {canEdit ? (
                          <button type="button" onClick={() => fillEdit(item)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-100 transition hover:bg-white/5">
                            Editar pendente
                          </button>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/10 p-5 text-sm text-zinc-400">
                  {isAuthenticated ? 'Você ainda não enviou imóveis para análise.' : 'Entre com sua conta para acompanhar seus imóveis.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
