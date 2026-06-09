'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Copy, Loader2, Pencil, Plus, Search, Trash2, UserRound } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin';
import { categoryLabel, formatCurrency, statusLabel } from '@/lib/format';
import { Property } from '@/lib/types';

const categories = [
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'TERRENO', label: 'Terreno' },
  { value: 'LOTEAMENTO', label: 'Loteamento' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'RURAL', label: 'Rural' }
];

const statuses = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'RESERVED', label: 'Reservado' },
  { value: 'SOLD', label: 'Vendido' },
  { value: 'LAUNCH', label: 'Lançamento' }
];

const defaultFilters = {
  quickFilter: 'all',
  search: '',
  propertyCode: '',
  city: 'all',
  district: 'all',
  state: 'all',
  category: 'all',
  type: 'all',
  status: 'all',
  owner: '',
  priceMin: '',
  priceMax: '',
  featured: 'all',
  launch: 'all',
  review: 'all',
  sortBy: 'most-viewed'
};

function toNumericValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function inputClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500';
}

function filterBoolean(value: boolean, filterValue: string) {
  if (filterValue === 'all') return true;
  if (filterValue === 'yes') return value;
  return !value;
}

export default function AdminPropertiesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Property[]>([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [loadingList, setLoadingList] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    try {
      setLoadingList(true);
      setError('');
      const data = await adminFetch('/properties/admin/all');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os imóveis.');
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cities = useMemo(
    () => Array.from(new Set(items.map((item) => item.city).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [items]
  );

  const statesAvailable = useMemo(
    () => Array.from(new Set(items.map((item) => item.state).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [items]
  );

  const districts = useMemo(
    () => Array.from(new Set(items.map((item) => item.district).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [items]
  );

  const propertyTypes = useMemo(
    () => Array.from(new Set(items.map((item) => item.type).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [items]
  );

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    const code = filters.propertyCode.trim().toLowerCase();
    const owner = filters.owner.trim().toLowerCase();
    const priceMin = toNumericValue(filters.priceMin);
    const priceMax = toNumericValue(filters.priceMax);

    const filtered = items.filter((item) => {
      const highEndFingerprint = `${item.type} ${item.title} ${item.shortDescription}`.toLowerCase();
      const numericPrice = Number(item.promotionalPrice || item.price || 0);
      const reviewStatus = item.reviewStatus || (item.approved === false ? 'PENDING' : 'APPROVED');
      const searchHaystack = [
        item.title,
        item.propertyCode,
        item.city,
        item.district,
        item.type,
        item.status,
        item.ownerName,
        item.ownerEmail,
        item.ownerPhone,
        numericPrice ? String(numericPrice) : ''
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const ownerHaystack = [item.ownerName, item.ownerEmail, item.ownerPhone].filter(Boolean).join(' ').toLowerCase();

      const quickFilterMatch =
        filters.quickFilter === 'all' ||
        (filters.quickFilter === 'houses' && item.category === 'CASA') ||
        (filters.quickFilter === 'apartments' && item.category === 'APARTAMENTO') ||
        (filters.quickFilter === 'terrains' && item.category === 'TERRENO') ||
        (filters.quickFilter === 'developments' && item.category === 'LOTEAMENTO') ||
        (filters.quickFilter === 'approved' && reviewStatus === 'APPROVED') ||
        (filters.quickFilter === 'pending' && reviewStatus === 'PENDING') ||
        (filters.quickFilter === 'rejected' && reviewStatus === 'REJECTED') ||
        (filters.quickFilter === 'featured' && Boolean(item.featured)) ||
        (filters.quickFilter === 'launches' && Boolean(item.launch)) ||
        (filters.quickFilter === 'high-end' && /alto padrão|alto padrao|premium|luxo/.test(highEndFingerprint));

      return (
        quickFilterMatch &&
        (!search || searchHaystack.includes(search)) &&
        (!code || item.propertyCode.toLowerCase().includes(code)) &&
        (filters.city === 'all' || item.city === filters.city) &&
        (filters.district === 'all' || item.district === filters.district) &&
        (filters.state === 'all' || item.state === filters.state) &&
        (filters.category === 'all' || item.category === filters.category) &&
        (filters.type === 'all' || item.type === filters.type) &&
        (filters.status === 'all' || item.status === filters.status) &&
        (!owner || ownerHaystack.includes(owner)) &&
        (priceMin === null || numericPrice >= priceMin) &&
        (priceMax === null || numericPrice <= priceMax) &&
        filterBoolean(Boolean(item.featured), filters.featured) &&
        filterBoolean(Boolean(item.launch), filters.launch) &&
        (filters.review === 'all' || filters.review === reviewStatus)
      );
    });

    return [...filtered].sort((a, b) => {
      const viewDiff = Number(b.viewCount || 0) - Number(a.viewCount || 0);
      const createdA = new Date(a.createdAt || 0).getTime();
      const createdB = new Date(b.createdAt || 0).getTime();

      if (filters.sortBy === 'least-viewed') return Number(a.viewCount || 0) - Number(b.viewCount || 0) || createdB - createdA;
      if (filters.sortBy === 'newest') return createdB - createdA;
      if (filters.sortBy === 'oldest') return createdA - createdB;
      return viewDiff || createdB - createdA;
    });
  }, [filters, items]);

  async function approveProperty(id: string) {
    try {
      setApprovingId(id);
      setError('');
      setMessage('');
      await adminFetch(`/properties/${id}/approve`, { method: 'PATCH' });
      setMessage('Imóvel aprovado e publicado no site.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aprovar o imóvel.');
    } finally {
      setApprovingId(null);
    }
  }

  async function duplicateProperty(item: Property) {
    try {
      setDuplicatingId(item.id);
      setError('');
      setMessage('');
      const duplicated = await adminFetch(`/properties/${item.id}/duplicate`, { method: 'POST' });
      setMessage(`Imóvel duplicado com sucesso. Novo código: ${duplicated.propertyCode}.`);
      await load();
      router.push(`/admin/properties/incluir?edit=${duplicated.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível duplicar o imóvel.');
    } finally {
      setDuplicatingId(null);
    }
  }

  async function deleteProperty(item: Property) {
    if (!confirm(`Excluir o imóvel \"${item.title}\"?`)) return;

    try {
      setDeletingId(item.id);
      setError('');
      setMessage('');
      await adminFetch(`/properties/${item.id}`, { method: 'DELETE' });
      setMessage('Imóvel excluído com sucesso.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir o imóvel.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AdminShell title="Imóveis">
      <div className="space-y-6">
        <section className="card-premium flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-gold">Gestão simplificada</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Pesquisa e localização rápida de imóveis</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Nesta área ficam apenas a busca e a lista. Para cadastrar, editar ou concluir uma duplicação, use a nova seção <strong className="text-white">INCLUIR IMÓVEIS</strong> logo abaixo do menu de imóveis.
            </p>
          </div>

          <button type="button" onClick={() => router.push('/admin/properties/incluir')} className="btn-primary px-6 py-3">
            <Plus size={16} />
            INCLUIR IMÓVEIS
          </button>
        </section>

        <section className="card-premium p-6 md:p-8">
          <div className="flex flex-wrap gap-2">
            {[
              ['all', 'Todos'],
              ['houses', 'Casas'],
              ['apartments', 'Apartamentos'],
              ['terrains', 'Terrenos'],
              ['developments', 'Loteamentos'],
              ['approved', 'Aprovados'],
              ['pending', 'Pendentes'],
              ['rejected', 'Rejeitados'],
              ['featured', 'Destaque'],
              ['launches', 'Lançamentos'],
              ['high-end', 'Alto padrão']
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, quickFilter: value }))}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${filters.quickFilter === value ? 'bg-brand-gold text-[#08110d]' : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-brand-gold/35 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block space-y-2 md:col-span-2 xl:col-span-2">
              <span className="text-sm font-medium text-white">Busca geral</span>
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input value={filters.search} onChange={(e) => setFilters((current) => ({ ...current, search: e.target.value }))} placeholder="Título, cidade, bairro, tipo, status, proprietário, e-mail, WhatsApp ou valor" className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white outline-none placeholder:text-zinc-500" />
              </div>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-brand-gold">Código do imóvel</span>
              <input value={filters.propertyCode} onChange={(e) => setFilters((current) => ({ ...current, propertyCode: e.target.value.toUpperCase() }))} placeholder="Ex.: CA001" className="w-full rounded-2xl border border-brand-gold/30 bg-brand-gold/10 px-4 py-3 text-white outline-none placeholder:text-brand-gold/55" />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Proprietário / e-mail / WhatsApp</span>
              <input value={filters.owner} onChange={(e) => setFilters((current) => ({ ...current, owner: e.target.value }))} placeholder="Nome, e-mail ou telefone" className={inputClassName()} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Cidade</span>
              <select value={filters.city} onChange={(e) => setFilters((current) => ({ ...current, city: e.target.value }))} className={inputClassName()}>
                <option value="all" className="bg-[#08110d] text-white">Todas</option>
                {cities.map((city) => <option key={city} value={city} className="bg-[#08110d] text-white">{city}</option>)}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Bairro</span>
              <select value={filters.district} onChange={(e) => setFilters((current) => ({ ...current, district: e.target.value }))} className={inputClassName()}>
                <option value="all" className="bg-[#08110d] text-white">Todos</option>
                {districts.map((district) => <option key={district} value={district} className="bg-[#08110d] text-white">{district}</option>)}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Estado</span>
              <select value={filters.state} onChange={(e) => setFilters((current) => ({ ...current, state: e.target.value }))} className={inputClassName()}>
                <option value="all" className="bg-[#08110d] text-white">Todos</option>
                {statesAvailable.map((state) => <option key={state} value={state} className="bg-[#08110d] text-white">{state}</option>)}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Categoria</span>
              <select value={filters.category} onChange={(e) => setFilters((current) => ({ ...current, category: e.target.value }))} className={inputClassName()}>
                <option value="all" className="bg-[#08110d] text-white">Todas</option>
                {categories.map((category) => <option key={category.value} value={category.value} className="bg-[#08110d] text-white">{category.label}</option>)}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Tipo</span>
              <select value={filters.type} onChange={(e) => setFilters((current) => ({ ...current, type: e.target.value }))} className={inputClassName()}>
                <option value="all" className="bg-[#08110d] text-white">Todos</option>
                {propertyTypes.map((type) => <option key={type} value={type} className="bg-[#08110d] text-white">{type}</option>)}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Status comercial</span>
              <select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))} className={inputClassName()}>
                <option value="all" className="bg-[#08110d] text-white">Todos</option>
                {statuses.map((status) => <option key={status.value} value={status.value} className="bg-[#08110d] text-white">{status.label}</option>)}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Valor mínimo</span>
              <input value={filters.priceMin} onChange={(e) => setFilters((current) => ({ ...current, priceMin: e.target.value }))} placeholder="Ex.: 250000" className={inputClassName()} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Valor máximo</span>
              <input value={filters.priceMax} onChange={(e) => setFilters((current) => ({ ...current, priceMax: e.target.value }))} placeholder="Ex.: 950000" className={inputClassName()} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Destaque</span>
              <select value={filters.featured} onChange={(e) => setFilters((current) => ({ ...current, featured: e.target.value }))} className={inputClassName()}>
                <option value="all" className="bg-[#08110d] text-white">Todos</option>
                <option value="yes" className="bg-[#08110d] text-white">Somente destaque</option>
                <option value="no" className="bg-[#08110d] text-white">Sem destaque</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Lançamento</span>
              <select value={filters.launch} onChange={(e) => setFilters((current) => ({ ...current, launch: e.target.value }))} className={inputClassName()}>
                <option value="all" className="bg-[#08110d] text-white">Todos</option>
                <option value="yes" className="bg-[#08110d] text-white">Somente lançamentos</option>
                <option value="no" className="bg-[#08110d] text-white">Sem lançamento</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Revisão / publicação</span>
              <select value={filters.review} onChange={(e) => setFilters((current) => ({ ...current, review: e.target.value }))} className={inputClassName()}>
                <option value="all" className="bg-[#08110d] text-white">Todos</option>
                <option value="APPROVED" className="bg-[#08110d] text-white">Aprovados</option>
                <option value="PENDING" className="bg-[#08110d] text-white">Pendentes</option>
                <option value="REJECTED" className="bg-[#08110d] text-white">Rejeitados</option>
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-white">Ordenar por</span>
              <select value={filters.sortBy} onChange={(e) => setFilters((current) => ({ ...current, sortBy: e.target.value }))} className={inputClassName()}>
                <option value="most-viewed" className="bg-[#08110d] text-white">Mais visualizados</option>
                <option value="least-viewed" className="bg-[#08110d] text-white">Menos visualizados</option>
                <option value="newest" className="bg-[#08110d] text-white">Mais recentes</option>
                <option value="oldest" className="bg-[#08110d] text-white">Mais antigos</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setFilters(defaultFilters)} className="btn-secondary px-5 py-3">Limpar filtros</button>
            <span className="text-sm text-zinc-400">{filteredItems.length} resultado(s) encontrado(s).</span>
            {message ? <span className="text-sm text-emerald-400">{message}</span> : null}
            {error ? <span className="text-sm text-rose-400">{error}</span> : null}
          </div>
        </section>

        <section className="space-y-4">
          {loadingList ? <div className="card-premium p-6 text-sm text-zinc-300">Carregando imóveis...</div> : null}

          {!loadingList && filteredItems.map((item) => {
            const reviewStatus = item.reviewStatus || (item.approved === false ? 'PENDING' : 'APPROVED');
            const ownerPending = item.submittedByOwner && reviewStatus === 'PENDING';

            return (
              <article key={item.id} className={`card-premium p-5 ${ownerPending ? 'border-amber-400/30 bg-amber-500/5' : ''}`}>
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <span className="rounded-full border border-brand-gold/25 bg-brand-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-gold">{item.propertyCode}</span>
                      {ownerPending ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-amber-200">
                          <UserRound size={12} />
                          Proprietário pendente
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm text-zinc-400">{item.city} • {item.state} • {item.district}</p>
                    <p className="mt-3 text-sm text-zinc-300">{formatCurrency(item.promotionalPrice || item.price)} • {categoryLabel[item.category]} • {statusLabel[item.status]}</p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.22em] text-zinc-500">
                      <span>{item.type}</span>
                      <span>{item.featured ? 'destaque' : 'sem destaque'}</span>
                      <span>{item.launch ? 'lançamento' : 'normal'}</span>
                      <span>{reviewStatus === 'REJECTED' ? 'rejeitado' : reviewStatus === 'PENDING' ? 'pendente' : 'aprovado'}</span>
                    </div>

                    {item.ownerName || item.ownerEmail || item.ownerPhone ? (
                      <p className={`mt-3 text-xs ${ownerPending ? 'text-amber-200' : 'text-zinc-400'}`}>
                        Proprietário: {[item.ownerName, item.ownerEmail, item.ownerPhone].filter(Boolean).join(' • ')}
                      </p>
                    ) : null}

                    <p className="mt-2 text-xs text-zinc-500">Visualizações registradas: {Number(item.viewCount || 0).toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="flex flex-wrap gap-3 xl:max-w-[420px] xl:justify-end">
                    {ownerPending ? (
                      <button
                        type="button"
                        onClick={() => approveProperty(item.id)}
                        disabled={approvingId === item.id}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#08110d] transition hover:brightness-105 disabled:opacity-70"
                      >
                        {approvingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Aprovar e publicar
                      </button>
                    ) : null}

                    <button type="button" onClick={() => router.push(`/admin/properties/incluir?edit=${item.id}`)} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:border-brand-gold hover:text-brand-gold">
                      <Pencil size={14} />
                      Editar em INCLUIR IMÓVEIS
                    </button>

                    <button
                      type="button"
                      onClick={() => duplicateProperty(item)}
                      disabled={duplicatingId === item.id}
                      className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 text-sm text-brand-gold transition hover:border-brand-gold hover:bg-brand-gold/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {duplicatingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
                      Duplicar e abrir em INCLUIR IMÓVEIS
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteProperty(item)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-60"
                    >
                      {deletingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          {!loadingList && !filteredItems.length ? <div className="card-premium p-5 text-sm text-zinc-400">Nenhum imóvel encontrado com os filtros atuais.</div> : null}
        </section>
      </div>
    </AdminShell>
  );
}
