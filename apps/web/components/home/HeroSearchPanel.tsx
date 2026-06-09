'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, ChevronDown, Compass, Hash, MapPin, Search, Tag } from 'lucide-react';
import { getPropertyLocationOptions } from '@/lib/api';
import type { PropertyLocationGroup } from '@/lib/types';

type HeroSearchPanelProps = {
  compact?: boolean;
};

const priceRanges = [
  { label: 'Qualquer valor', value: '' },
  { label: 'Até R$ 300 mil', value: '0-300000' },
  { label: 'R$ 300 mil a R$ 700 mil', value: '300000-700000' },
  { label: 'R$ 700 mil a R$ 1,5 milhão', value: '700000-1500000' },
  { label: 'Acima de R$ 1,5 milhão', value: '1500000-' }
];

const propertyTypes = [
  { label: 'Todos os tipos', value: '' },
  { label: 'Apartamento', value: 'APARTAMENTO' },
  { label: 'Casa', value: 'CASA' },
  { label: 'Terreno', value: 'TERRENO' },
  { label: 'Loteamento', value: 'LOTEAMENTO' },
  { label: 'Comercial', value: 'COMERCIAL' }
];

const fallbackQuickAreas = ['Araranguá', 'Balneário Arroio do Silva', 'Torres', 'Criciúma'];

function FieldBlock({ label, children, icon }: { label: string; children: ReactNode; icon: ReactNode }) {
  return (
    <label
      className="flex min-h-[84px] flex-col justify-center px-4 py-3 transition duration-300"
      style={{
        borderRadius: 'var(--theme-search-radius)',
        border: '1px solid var(--theme-search-border)',
        background: 'color-mix(in srgb, var(--theme-search-surface) 75%, transparent)',
        color: 'var(--theme-search-text-primary)'
      }}
    >
      <span className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em]" style={{ color: 'var(--theme-search-text-secondary)' }}>
        <span style={{ color: 'var(--theme-search-accent)' }}>{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function buildSearchHref(filters: {
  objective: string;
  category: string;
  priceRange: string;
  propertyCode: string;
  city: string;
  district: string;
}) {
  const params = new URLSearchParams();

  if (filters.objective) params.set('objective', filters.objective);
  if (filters.category) params.set('category', filters.category);
  if (filters.priceRange) params.set('priceRange', filters.priceRange);
  if (filters.propertyCode.trim()) params.set('propertyCode', filters.propertyCode.trim().toUpperCase());
  if (filters.city) params.set('city', filters.city);
  if (filters.district) params.set('district', filters.district);

  const query = params.toString();
  return query ? `/imoveis?${query}` : '/imoveis';
}

export function HeroSearchPanel({ compact = false }: HeroSearchPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [objective, setObjective] = useState(searchParams.get('objective') || 'buy');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [priceRange, setPriceRange] = useState(searchParams.get('priceRange') || '');
  const [propertyCode, setPropertyCode] = useState(searchParams.get('propertyCode') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedDistrict, setSelectedDistrict] = useState(searchParams.get('district') || '');
  const [locationOptions, setLocationOptions] = useState<PropertyLocationGroup[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);

  useEffect(() => {
    setObjective(searchParams.get('objective') || 'buy');
    setCategory(searchParams.get('category') || '');
    setPriceRange(searchParams.get('priceRange') || '');
    setPropertyCode(searchParams.get('propertyCode') || '');
    setSelectedCity(searchParams.get('city') || '');
    setSelectedDistrict(searchParams.get('district') || '');
  }, [searchParams]);

  useEffect(() => {
    if (!locationMenuOpen) return undefined;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setLocationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [locationMenuOpen]);

  const quickAreas = useMemo(
    () => (locationOptions.length ? locationOptions.slice(0, 4).map((item) => `${item.city} (${item.total})`) : fallbackQuickAreas),
    [locationOptions]
  );

  const selectedLocationLabel = useMemo(() => {
    if (selectedCity && selectedDistrict) return `${selectedCity} • ${selectedDistrict}`;
    if (selectedCity) return `${selectedCity}`;
    return 'Selecione cidade ou bairro';
  }, [selectedCity, selectedDistrict]);

  async function loadLocationOptions() {
    if (locationOptions.length || loadingLocations) return;

    setLoadingLocations(true);

    try {
      const items = await getPropertyLocationOptions();
      setLocationOptions(items);
    } finally {
      setLoadingLocations(false);
    }
  }

  function navigateWithFilters(nextCity = selectedCity, nextDistrict = selectedDistrict) {
    router.push(
      buildSearchHref({
        objective,
        category,
        priceRange,
        propertyCode,
        city: nextCity,
        district: nextDistrict
      })
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigateWithFilters();
  }

  function handleLocationFieldClick() {
    setLocationMenuOpen((current) => !current);
    void loadLocationOptions();
  }

  function handleSelectCity(city: string) {
    setSelectedCity(city);
    setSelectedDistrict('');
    setLocationMenuOpen(false);
    router.push(
      buildSearchHref({
        objective,
        category,
        priceRange,
        propertyCode,
        city,
        district: ''
      })
    );
  }

  function handleSelectDistrict(city: string, district: string) {
    setSelectedCity(city);
    setSelectedDistrict(district);
    setLocationMenuOpen(false);
    router.push(
      buildSearchHref({
        objective,
        category,
        priceRange,
        propertyCode,
        city,
        district
      })
    );
  }

  function clearLocationFilter() {
    setSelectedCity('');
    setSelectedDistrict('');
    setLocationMenuOpen(false);
    router.push(
      buildSearchHref({
        objective,
        category,
        priceRange,
        propertyCode,
        city: '',
        district: ''
      })
    );
  }

  return (
    <form
      data-theme-block="search-bar"
      onSubmit={handleSubmit}
      aria-label="Busca principal de imóveis"
      className={`mx-auto w-full overflow-visible p-3 ${compact ? 'max-w-6xl' : 'max-w-7xl'}`}
      style={{
        borderRadius: 'calc(var(--theme-search-radius) + 0.25rem)',
        border: '1px solid var(--theme-search-border)',
        background: 'var(--theme-search-background)',
        boxShadow: 'var(--theme-search-shadow)',
        backdropFilter: 'blur(28px)'
      }}
    >
      <div
        className="p-3 sm:p-4"
        style={{
          borderRadius: 'var(--theme-search-radius)',
          border: '1px solid color-mix(in srgb, var(--theme-search-border) 80%, transparent)',
          background: 'var(--theme-search-surface)'
        }}
      >
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]" style={{ color: 'var(--theme-search-accent)' }}>
              <Compass size={14} />
              Busca estratégica
            </p>
            <p className="mt-2 text-sm" style={{ color: 'var(--theme-search-text-secondary)' }}>
              Filtre por tipo, cidade, bairro, faixa de preço e código do imóvel. As cidades são carregadas automaticamente a partir dos imóveis ativos cadastrados.
            </p>
          </div>

          <div
            className="inline-flex self-start rounded-full p-1"
            style={{ border: '1px solid var(--theme-search-border)', background: 'color-mix(in srgb, var(--theme-search-background) 86%, transparent)' }}
          >
            <label className="cursor-pointer">
              <input type="radio" name="objective" value="buy" checked={objective === 'buy'} onChange={(event) => setObjective(event.target.value)} className="peer sr-only" />
              <span className="inline-flex min-w-28 items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition peer-checked:text-[#08110d]" style={{ color: 'var(--theme-search-text-secondary)' }}>
                Comprar
              </span>
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="objective" value="rent" checked={objective === 'rent'} onChange={(event) => setObjective(event.target.value)} className="peer sr-only" />
              <span className="inline-flex min-w-28 items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition peer-checked:text-[#08110d]" style={{ color: 'var(--theme-search-text-secondary)' }}>
                Alugar
              </span>
            </label>
          </div>
        </div>

        <div className="grid gap-3 xl:grid-cols-[1fr_1.25fr_1fr_1fr_auto]">
          <FieldBlock label="Tipo do imóvel" icon={<Building2 size={14} />}>
            <div className="relative">
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full appearance-none bg-transparent pr-8 text-[15px] font-medium outline-none" style={{ color: 'var(--theme-search-text-primary)' }}>
                {propertyTypes.map((item) => (
                  <option key={item.label} value={item.value} className="bg-[#08110d] text-white">
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-search-text-secondary)' }} />
            </div>
          </FieldBlock>

          <div ref={dropdownRef} className="relative">
            <FieldBlock label="Cidade / Bairro" icon={<MapPin size={14} />}>
              <button type="button" onClick={handleLocationFieldClick} className="relative flex h-10 w-full items-center justify-between gap-3 bg-transparent text-left text-[15px] font-medium outline-none" style={{ color: 'var(--theme-search-text-primary)' }}>
                <span className="truncate">{selectedLocationLabel}</span>
                <ChevronDown size={16} className={`shrink-0 transition ${locationMenuOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--theme-search-text-secondary)' }} />
              </button>
            </FieldBlock>

            {locationMenuOpen ? (
              <div
                className="absolute left-0 right-0 top-[calc(100%+0.75rem)] z-40 max-h-[420px] overflow-y-auto rounded-[1.6rem] border p-3 shadow-2xl"
                style={{
                  borderColor: 'var(--theme-search-border)',
                  background: 'color-mix(in srgb, var(--theme-search-background) 94%, #08110d)',
                  boxShadow: '0 28px 80px rgba(0,0,0,0.35)'
                }}
              >
                <button
                  type="button"
                  onClick={clearLocationFilter}
                  className="mb-2 flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm transition hover:bg-white/5"
                  style={{ color: 'var(--theme-search-text-primary)' }}
                >
                  <span>Todos os locais</span>
                  <span style={{ color: 'var(--theme-search-text-secondary)' }}>Limpar</span>
                </button>

                {loadingLocations ? (
                  <div className="rounded-2xl px-4 py-5 text-sm" style={{ color: 'var(--theme-search-text-secondary)' }}>
                    Carregando cidades e bairros com imóveis ativos...
                  </div>
                ) : locationOptions.length ? (
                  <div className="space-y-2">
                    {locationOptions.map((cityGroup) => (
                      <div key={cityGroup.city} className="rounded-[1.3rem] border p-2" style={{ borderColor: 'color-mix(in srgb, var(--theme-search-border) 80%, transparent)', background: 'color-mix(in srgb, var(--theme-search-surface) 74%, transparent)' }}>
                        <button
                          type="button"
                          onClick={() => handleSelectCity(cityGroup.city)}
                          className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-white/5"
                          style={{ color: 'var(--theme-search-text-primary)' }}
                        >
                          <span className="font-medium">{cityGroup.city}</span>
                          <span className="text-sm" style={{ color: 'var(--theme-search-accent)' }}>
                            ({cityGroup.total})
                          </span>
                        </button>

                        {cityGroup.districts.length ? (
                          <div className="mt-1 space-y-1 border-t pt-2" style={{ borderColor: 'color-mix(in srgb, var(--theme-search-border) 70%, transparent)' }}>
                            {cityGroup.districts.map((districtGroup) => (
                              <button
                                key={`${cityGroup.city}-${districtGroup.district}`}
                                type="button"
                                onClick={() => handleSelectDistrict(cityGroup.city, districtGroup.district)}
                                className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-left text-sm transition hover:bg-white/5"
                                style={{ color: 'var(--theme-search-text-secondary)' }}
                              >
                                <span className="truncate pl-4">└ {districtGroup.district}</span>
                                <span style={{ color: 'var(--theme-search-accent)' }}>({districtGroup.total})</span>
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl px-4 py-5 text-sm" style={{ color: 'var(--theme-search-text-secondary)' }}>
                    Nenhuma cidade com imóveis ativos foi encontrada no momento.
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <FieldBlock label="Faixa de preço" icon={<Tag size={14} />}>
            <div className="relative">
              <select value={priceRange} onChange={(event) => setPriceRange(event.target.value)} className="h-10 w-full appearance-none bg-transparent pr-8 text-[15px] font-medium outline-none" style={{ color: 'var(--theme-search-text-primary)' }}>
                {priceRanges.map((item) => (
                  <option key={item.label} value={item.value} className="bg-[#08110d] text-white">
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2" style={{ color: 'var(--theme-search-text-secondary)' }} />
            </div>
          </FieldBlock>

          <FieldBlock label="Código do imóvel" icon={<Hash size={14} />}>
            <input
              value={propertyCode}
              onChange={(event) => setPropertyCode(event.target.value.toUpperCase())}
              placeholder="Ex.: CA001"
              className="h-10 w-full bg-transparent text-[15px] font-medium uppercase outline-none placeholder:text-zinc-500"
              style={{ color: 'var(--theme-search-text-primary)' }}
            />
          </FieldBlock>

          <button className="btn-primary min-h-[84px] px-7">
            <Search size={18} />
            Buscar imóveis
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs" style={{ color: 'var(--theme-search-text-secondary)' }}>
          <span className="uppercase tracking-[0.2em]">Cidades em alta</span>
          {quickAreas.map((area) => (
            <span key={area} className="rounded-full px-3 py-2" style={{ border: '1px solid var(--theme-search-border)', background: 'color-mix(in srgb, var(--theme-search-surface) 70%, transparent)', color: 'var(--theme-search-text-primary)' }}>
              {area}
            </span>
          ))}
        </div>
      </div>
    </form>
  );
}
