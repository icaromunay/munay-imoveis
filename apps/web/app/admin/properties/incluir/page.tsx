'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  ImagePlus,
  Info,
  Loader2,
  Save,
  Search,
  Trash2,
  UploadCloud,
  UserRound
} from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { adminFetch } from '@/lib/admin';
import { prepareImageFile, PreparedImage } from '@/lib/image-upload';
import { Property } from '@/lib/types';
import { categoryLabel, formatCurrency, statusLabel } from '@/lib/format';
import {
  PROPERTY_TYPE_OPTIONS,
  SOLAR_POSITION_OPTIONS,
  defaultPropertyType,
  formatAreaValue,
  getPrimaryAreaLabel,
  getPropertyFieldVisibility,
  inferCategoryFromType
} from '@/lib/property-utils';
import { parseYoutubeVideo } from '@/lib/youtube';

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

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

const emptyForm = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  price: '',
  promotionalPrice: '',
  status: 'AVAILABLE',
  propertyCode: '',
  area: '',
  landArea: '',
  builtArea: '',
  bedrooms: '',
  bathrooms: '',
  suites: '',
  garage: '',
  floor: '',
  hasElevator: false,
  solarPosition: '',
  hasEdicule: false,
  ediculeArea: '',
  ediculeBedrooms: '',
  ediculeBathrooms: '',
  ediculeHasLivingRoom: false,
  ediculeHasKitchen: false,
  acceptsBankFinancing: false,
  acceptsFgts: false,
  acceptsCar: false,
  acceptsExchange: false,
  acceptsProposal: false,
  acceptsDirectInstallments: false,
  maxDirectInstallments: '',
  constructionYear: '',
  landFrontage: '',
  landDepthLeft: '',
  landDepthRight: '',
  hasPaving: false,
  hasElectricity: false,
  hasWaterNetwork: false,
  city: '',
  district: '',
  state: 'SC',
  category: 'CASA',
  type: 'Casa',
  lotsMinArea: '',
  lotsMaxArea: '',
  lotsQuantity: '',
  developmentInfrastructure: '',
  developmentHasPaving: false,
  developmentHasElectricity: false,
  developmentHasWaterNetwork: false,
  readyToBuild: false,
  hasDevelopmentInstallments: false,
  developmentMaxInstallments: '',
  featured: false,
  launch: false,
  approved: true,
  googleMapsLink: '',
  latitude: '',
  longitude: '',
  youtubeLink: '',
  pdfTableUrl: '',
  pdfProjectUrl: ''
};

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

const booleanChoices = [
  { label: 'Sim', value: true },
  { label: 'Não', value: false }
];

function toNumericValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isKnownTypeOption(value: string) {
  return PROPERTY_TYPE_OPTIONS.some((option) => option.value === value);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="block text-sm font-medium text-white">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-5 text-zinc-500">{hint}</span> : null}
    </label>
  );
}

function baseInputClassName() {
  return 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-zinc-500';
}

function filterBoolean(value: boolean, filterValue: string) {
  if (filterValue === 'all') return true;
  if (filterValue === 'yes') return value;
  return !value;
}

function PropertyCardPreview({ property }: { property: Property }) {
  const badges = [
    property.status === 'LAUNCH' || property.launch ? 'LANÇAMENTO' : null,
    property.featured ? 'DESTAQUE' : null,
    property.submittedByOwner && property.approved === false ? 'PENDENTE' : null
  ].filter(Boolean) as string[];

  return (
    <article className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] shadow-soft">
      <div className="relative h-80 overflow-hidden bg-[linear-gradient(180deg,#13241b,#08110d)]">
        {property.coverImage ? (
          <img src={property.coverImage} alt={property.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-white/5 text-sm text-zinc-400">Envie uma foto para visualizar</div>
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,114,0.16),transparent_26%),linear-gradient(180deg,rgba(8,17,13,0.05),rgba(8,17,13,0.9))]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#08110d] to-transparent" />

        <div className="absolute left-5 top-5 flex max-w-[80%] flex-wrap gap-2">
          {badges.map((badge) => (
            <span key={badge} className="rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-semibold tracking-[0.28em] text-white backdrop-blur-xl">
              {badge}
            </span>
          ))}
        </div>

        <div className="absolute bottom-5 left-5 right-5">
          <p className="text-xs uppercase tracking-[0.22em] text-brand-gold">
            {categoryLabel[property.category]} • {statusLabel[property.status]}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{property.title || 'Título do imóvel'}</h3>
          <p className="mt-2 text-sm text-zinc-200">
            {property.city || 'Cidade'} • {property.district || 'Bairro'}
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <p className="text-sm leading-6 text-zinc-300">{property.shortDescription || 'A descrição curta aparecerá aqui no card do site.'}</p>

        <div className="grid grid-cols-3 gap-3 text-sm text-zinc-300">
          <div className="surface-muted p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Área</p>
            <p className="mt-2 font-medium text-white">{getPrimaryAreaLabel(property)}</p>
          </div>
          <div className="surface-muted p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Tipo</p>
            <p className="mt-2 font-medium text-white">{property.type || 'Imóvel'}</p>
          </div>
          <div className="surface-muted p-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Código</p>
            <p className="mt-2 font-medium text-white">{property.propertyCode || 'AUTO'}</p>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Valor do imóvel</p>
            <p className="mt-1 text-2xl font-semibold text-white">{formatCurrency(property.promotionalPrice || property.price)}</p>
          </div>
          <div className="rounded-full bg-brand-gold px-4 py-3 text-sm font-semibold text-[#08110d]">Ver imóvel</div>
        </div>
      </div>
    </article>
  );
}

type PropertyFormState = typeof emptyForm;

export default function AdminPropertiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Property[]>([]);
  const [form, setForm] = useState<PropertyFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ percent: number; current: number; total: number; currentFile: string; stage: string } | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<PreparedImage[]>([]);
  const [filters, setFilters] = useState(defaultFilters);

  const imageCountLabel = useMemo(() => `${imagePreviews.length}/20 fotos`, [imagePreviews.length]);

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

      if (filters.sortBy === 'least-viewed') {
        return Number(a.viewCount || 0) - Number(b.viewCount || 0) || createdB - createdA;
      }

      if (filters.sortBy === 'newest') {
        return createdB - createdA;
      }

      if (filters.sortBy === 'oldest') {
        return createdA - createdB;
      }

      return viewDiff || createdB - createdA;
    });
  }, [filters, items]);

  const propertyVisibility = useMemo(
    () => getPropertyFieldVisibility(form.type || defaultPropertyType(form.category), form.category),
    [form.category, form.type]
  );

  const typeOptions = useMemo(() => {
    const baseOptions: Array<{
      value: string;
      category: typeof PROPERTY_TYPE_OPTIONS[number]['category'];
    }> = [...PROPERTY_TYPE_OPTIONS];

    if (form.type && !isKnownTypeOption(form.type)) {
      baseOptions.unshift({
        value: form.type,
        category: form.category as typeof PROPERTY_TYPE_OPTIONS[number]['category']
      });
    }

    return baseOptions;
  }, [form.category, form.type]);

  const parsedPropertyVideo = useMemo(() => parseYoutubeVideo(form.youtubeLink || ''), [form.youtubeLink]);
  const hasInvalidPropertyVideo = Boolean(String(form.youtubeLink || '').trim()) && !parsedPropertyVideo;

  const previewProperty = useMemo<Property>(() => {
    const firstImage = imagePreviews[0]?.url || '';
    const resolvedType = form.type || defaultPropertyType(form.category);
    const resolvedCategory = inferCategoryFromType(resolvedType, form.category) as Property['category'];
    const builtArea = toNumericValue(form.builtArea);
    const landArea = toNumericValue(form.landArea);
    const lotsMinArea = toNumericValue(form.lotsMinArea);
    const resolvedArea = builtArea ?? landArea ?? lotsMinArea ?? toNumericValue(form.area) ?? 0;

    return {
      id: editingId || 'preview',
      slug: 'preview',
      title: form.title || 'Título do imóvel',
      shortDescription: form.shortDescription || 'A descrição curta aparecerá aqui no card do site.',
      fullDescription: form.fullDescription || '',
      price: toNumericValue(form.price) ?? 0,
      promotionalPrice: toNumericValue(form.promotionalPrice),
      status: form.status as Property['status'],
      propertyCode: form.propertyCode || 'AUTO',
      area: resolvedArea,
      landArea,
      builtArea,
      bedrooms: toNumericValue(form.bedrooms),
      bathrooms: toNumericValue(form.bathrooms),
      suites: toNumericValue(form.suites),
      garage: toNumericValue(form.garage),
      floor: toNumericValue(form.floor),
      hasElevator: Boolean(form.hasElevator),
      solarPosition: form.solarPosition || null,
      hasEdicule: Boolean(form.hasEdicule),
      ediculeArea: toNumericValue(form.ediculeArea),
      ediculeBedrooms: toNumericValue(form.ediculeBedrooms),
      ediculeBathrooms: toNumericValue(form.ediculeBathrooms),
      ediculeHasLivingRoom: Boolean(form.ediculeHasLivingRoom),
      ediculeHasKitchen: Boolean(form.ediculeHasKitchen),
      acceptsBankFinancing: Boolean(form.acceptsBankFinancing),
      acceptsFgts: Boolean(form.acceptsFgts),
      acceptsCar: Boolean(form.acceptsCar),
      acceptsExchange: Boolean(form.acceptsExchange),
      acceptsProposal: Boolean(form.acceptsProposal),
      acceptsDirectInstallments: Boolean(form.acceptsDirectInstallments),
      maxDirectInstallments: toNumericValue(form.maxDirectInstallments),
      constructionYear: toNumericValue(form.constructionYear),
      landFrontage: toNumericValue(form.landFrontage),
      landDepthLeft: toNumericValue(form.landDepthLeft),
      landDepthRight: toNumericValue(form.landDepthRight),
      hasPaving: Boolean(form.hasPaving),
      hasElectricity: Boolean(form.hasElectricity),
      hasWaterNetwork: Boolean(form.hasWaterNetwork),
      lotsMinArea,
      lotsMaxArea: toNumericValue(form.lotsMaxArea),
      lotsQuantity: toNumericValue(form.lotsQuantity),
      developmentInfrastructure: form.developmentInfrastructure || null,
      developmentHasPaving: Boolean(form.developmentHasPaving),
      developmentHasElectricity: Boolean(form.developmentHasElectricity),
      developmentHasWaterNetwork: Boolean(form.developmentHasWaterNetwork),
      readyToBuild: Boolean(form.readyToBuild),
      hasDevelopmentInstallments: Boolean(form.hasDevelopmentInstallments),
      developmentMaxInstallments: toNumericValue(form.developmentMaxInstallments),
      city: form.city || 'Cidade',
      district: form.district || 'Bairro',
      state: form.state || 'SC',
      category: resolvedCategory,
      type: resolvedType,
      featured: Boolean(form.featured),
      launch: Boolean(form.launch),
      approved: Boolean(form.approved),
      submittedByOwner: false,
      googleMapsLink: form.googleMapsLink || null,
      latitude: toNumericValue(form.latitude),
      longitude: toNumericValue(form.longitude),
      youtubeLink: form.youtubeLink || null,
      coverImage: firstImage,
      pdfTableUrl: form.pdfTableUrl || null,
      pdfProjectUrl: form.pdfProjectUrl || null,
      images: imagePreviews.map((image, index) => ({ url: image.url, alt: `${form.title || 'Imóvel'} - Foto ${index + 1}` }))
    };
  }, [editingId, form, imagePreviews]);

  async function load() {
    try {
      setError('');
      const data = await adminFetch('/properties/admin/all');
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os imóveis.');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setImagePreviews([]);
    setUploadProgress(null);
    setEditingId(null);
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
      setMessage(`${Math.min(files.length, remainingSlots)} foto(s) preparada(s). JPG/PNG foram convertidos para WEBP, miniaturas serão geradas automaticamente e o upload final ficará otimizado.`);
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

  function fillEdit(item: Property, shouldScroll = true) {
    setEditingId(item.id);
    setMessage('');
    setError('');
    setForm({
      ...emptyForm,
      ...item,
      title: item.title ?? '',
      shortDescription: item.shortDescription ?? '',
      fullDescription: item.fullDescription ?? '',
      status: item.status ?? 'AVAILABLE',
      propertyCode: item.propertyCode ?? '',
      area: item.area != null ? String(item.area) : '',
      landArea: item.landArea != null ? String(item.landArea) : '',
      builtArea: item.builtArea != null ? String(item.builtArea) : '',
      bedrooms: item.bedrooms != null ? String(item.bedrooms) : '',
      bathrooms: item.bathrooms != null ? String(item.bathrooms) : '',
      suites: item.suites != null ? String(item.suites) : '',
      garage: item.garage != null ? String(item.garage) : '',
      floor: item.floor != null ? String(item.floor) : '',
      hasElevator: Boolean(item.hasElevator),
      solarPosition: item.solarPosition ?? '',
      hasEdicule: Boolean(item.hasEdicule),
      ediculeArea: item.ediculeArea != null ? String(item.ediculeArea) : '',
      ediculeBedrooms: item.ediculeBedrooms != null ? String(item.ediculeBedrooms) : '',
      ediculeBathrooms: item.ediculeBathrooms != null ? String(item.ediculeBathrooms) : '',
      ediculeHasLivingRoom: Boolean(item.ediculeHasLivingRoom),
      ediculeHasKitchen: Boolean(item.ediculeHasKitchen),
      acceptsBankFinancing: Boolean(item.acceptsBankFinancing),
      acceptsFgts: Boolean(item.acceptsFgts),
      acceptsCar: Boolean(item.acceptsCar),
      acceptsExchange: Boolean(item.acceptsExchange),
      acceptsProposal: Boolean(item.acceptsProposal),
      acceptsDirectInstallments: Boolean(item.acceptsDirectInstallments),
      maxDirectInstallments: item.maxDirectInstallments != null ? String(item.maxDirectInstallments) : '',
      constructionYear: item.constructionYear != null ? String(item.constructionYear) : '',
      landFrontage: item.landFrontage != null ? String(item.landFrontage) : '',
      landDepthLeft: item.landDepthLeft != null ? String(item.landDepthLeft) : '',
      landDepthRight: item.landDepthRight != null ? String(item.landDepthRight) : '',
      hasPaving: Boolean(item.hasPaving),
      hasElectricity: Boolean(item.hasElectricity),
      hasWaterNetwork: Boolean(item.hasWaterNetwork),
      city: item.city ?? '',
      district: item.district ?? '',
      state: item.state ?? 'SC',
      category: item.category ?? 'CASA',
      type: item.type ?? defaultPropertyType(item.category),
      lotsMinArea: item.lotsMinArea != null ? String(item.lotsMinArea) : '',
      lotsMaxArea: item.lotsMaxArea != null ? String(item.lotsMaxArea) : '',
      lotsQuantity: item.lotsQuantity != null ? String(item.lotsQuantity) : '',
      developmentInfrastructure: item.developmentInfrastructure ?? '',
      developmentHasPaving: Boolean(item.developmentHasPaving),
      developmentHasElectricity: Boolean(item.developmentHasElectricity),
      developmentHasWaterNetwork: Boolean(item.developmentHasWaterNetwork),
      readyToBuild: Boolean(item.readyToBuild),
      hasDevelopmentInstallments: Boolean(item.hasDevelopmentInstallments),
      developmentMaxInstallments: item.developmentMaxInstallments != null ? String(item.developmentMaxInstallments) : '',
      googleMapsLink: item.googleMapsLink ?? '',
      youtubeLink: item.youtubeLink ?? '',
      pdfTableUrl: item.pdfTableUrl ?? '',
      pdfProjectUrl: item.pdfProjectUrl ?? '',
      price: String(item.price ?? ''),
      promotionalPrice: item.promotionalPrice != null ? String(item.promotionalPrice) : '',
      latitude: item.latitude != null ? String(item.latitude) : '',
      longitude: item.longitude != null ? String(item.longitude) : '',
      featured: Boolean(item.featured),
      launch: Boolean(item.launch),
      approved: item.approved !== false
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
    if (shouldScroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId || !items.length) return;
    const item = items.find((entry) => entry.id === editId);
    if (!item) return;
    if (editingId !== editId) fillEdit(item, true);
    router.replace('/admin/properties/incluir', { scroll: false });
  }, [editingId, items, router, searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (!imagePreviews.length) throw new Error('Envie pelo menos uma foto para publicar o imóvel.');
      if (hasInvalidPropertyVideo) throw new Error('Informe um link válido do YouTube para o vídeo do imóvel.');

      const resolvedType = String(form.type || defaultPropertyType(form.category)).trim();
      const resolvedCategory = inferCategoryFromType(resolvedType, form.category);
      const builtArea = toNumericValue(form.builtArea);
      const landArea = toNumericValue(form.landArea);
      const lotsMinArea = toNumericValue(form.lotsMinArea);
      const payload = {
        ...form,
        category: resolvedCategory,
        type: resolvedType,
        price: Number(form.price),
        promotionalPrice: toNumericValue(form.promotionalPrice),
        area: builtArea ?? landArea ?? lotsMinArea ?? toNumericValue(form.area) ?? 1,
        landArea,
        builtArea,
        bedrooms: toNumericValue(form.bedrooms),
        bathrooms: toNumericValue(form.bathrooms),
        suites: toNumericValue(form.suites),
        garage: toNumericValue(form.garage),
        floor: toNumericValue(form.floor),
        hasElevator: Boolean(form.hasElevator),
        solarPosition: String(form.solarPosition || '').trim(),
        hasEdicule: Boolean(form.hasEdicule),
        ediculeArea: toNumericValue(form.ediculeArea),
        ediculeBedrooms: toNumericValue(form.ediculeBedrooms),
        ediculeBathrooms: toNumericValue(form.ediculeBathrooms),
        ediculeHasLivingRoom: Boolean(form.ediculeHasLivingRoom),
        ediculeHasKitchen: Boolean(form.ediculeHasKitchen),
        acceptsBankFinancing: Boolean(form.acceptsBankFinancing),
        acceptsFgts: Boolean(form.acceptsFgts),
        acceptsCar: Boolean(form.acceptsCar),
        acceptsExchange: Boolean(form.acceptsExchange),
        acceptsProposal: Boolean(form.acceptsProposal),
        acceptsDirectInstallments: Boolean(form.acceptsDirectInstallments),
        maxDirectInstallments: toNumericValue(form.maxDirectInstallments),
        constructionYear: toNumericValue(form.constructionYear),
        landFrontage: toNumericValue(form.landFrontage),
        landDepthLeft: toNumericValue(form.landDepthLeft),
        landDepthRight: toNumericValue(form.landDepthRight),
        hasPaving: Boolean(form.hasPaving),
        hasElectricity: Boolean(form.hasElectricity),
        hasWaterNetwork: Boolean(form.hasWaterNetwork),
        lotsMinArea,
        lotsMaxArea: toNumericValue(form.lotsMaxArea),
        lotsQuantity: toNumericValue(form.lotsQuantity),
        developmentInfrastructure: String(form.developmentInfrastructure || '').trim(),
        developmentHasPaving: Boolean(form.developmentHasPaving),
        developmentHasElectricity: Boolean(form.developmentHasElectricity),
        developmentHasWaterNetwork: Boolean(form.developmentHasWaterNetwork),
        readyToBuild: Boolean(form.readyToBuild),
        hasDevelopmentInstallments: Boolean(form.hasDevelopmentInstallments),
        developmentMaxInstallments: toNumericValue(form.developmentMaxInstallments),
        latitude: toNumericValue(form.latitude),
        longitude: toNumericValue(form.longitude),
        propertyCode: String(form.propertyCode || '').trim(),
        images: imagePreviews.map((image, index) => ({
          url: image.url,
          alt: `${form.title || 'Imóvel'} - Foto ${index + 1}`
        })),
        coverImage: imagePreviews[0].url
      };

      if (editingId) {
        await adminFetch(`/properties/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMessage('Imóvel atualizado com sucesso.');
      } else {
        await adminFetch('/properties', { method: 'POST', body: JSON.stringify(payload) });
        setMessage('Imóvel cadastrado com sucesso.');
      }

      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o imóvel.');
    } finally {
      setLoading(false);
    }
  }

  async function duplicateProperty(item: Property) {
    try {
      setDuplicatingId(item.id);
      setError('');
      setMessage('');
      const duplicated = await adminFetch(`/properties/${item.id}/duplicate`, { method: 'POST' });
      await load();
      fillEdit(duplicated, true);
      setMessage(`Imóvel duplicado com sucesso. Novo código: ${duplicated.propertyCode}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível duplicar o imóvel.');
    } finally {
      setDuplicatingId(null);
    }
  }

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

  const previewSidebar = (
    <section className="card-premium p-5">
      <div className="flex items-center gap-3">
        <Eye size={18} className="text-brand-gold" />
        <div>
          <h3 className="text-lg font-semibold text-white">Prévia do card no site</h3>
          <p className="mt-1 text-sm leading-6 text-zinc-400">A prévia acompanha o preenchimento do formulário em tempo real.</p>
        </div>
      </div>
      <div className="mt-5">
        <PropertyCardPreview property={previewProperty} />
      </div>
    </section>
  );

  return (
    <AdminShell title="INCLUIR IMÓVEIS" sidebarContent={previewSidebar}>
      <div className="min-w-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="card-premium p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-brand-gold">{editingId ? 'Editar imóvel' : 'Novo imóvel'}</p>
                <h2 className="mt-3 text-2xl font-semibold text-white">Cadastro simples e orientado</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                  Preencha os dados principais, envie até 20 fotos, organize a ordem manualmente e acompanhe a prévia do card antes da publicação.
                </p>
              </div>
              <div className="surface-muted flex items-start gap-3 p-4 text-sm text-zinc-300">
                <Info size={18} className="mt-0.5 text-brand-gold" />
                <div>
                  <p className="font-medium text-white">Código automático</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">Se o campo código ficar vazio, o sistema gera automaticamente no padrão do tipo do imóvel.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="card-premium grid gap-5 p-6 md:grid-cols-2 md:p-8">
            <Field label="Título do imóvel" hint="Ex.: Casa com 3 suítes em bairro nobre.">
              <input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} className={baseInputClassName()} required />
            </Field>
            <Field label="Código interno" hint="Opcional. Deixe em branco para gerar automaticamente.">
              <input value={form.propertyCode ?? ''} onChange={(e) => setForm({ ...form, propertyCode: e.target.value })} placeholder="Ex.: CA001" className={baseInputClassName()} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Descrição curta" hint="Texto curto que aparece nos cards do site para o cliente ler rapidamente.">
                <textarea value={form.shortDescription ?? ''} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} rows={3} className={baseInputClassName()} required />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Descrição completa" hint="Editor rico com títulos, listas, links, cores, destaque, alinhamento, tabelas simples e emojis.">
                <RichTextEditor value={form.fullDescription ?? ''} onChange={(value) => setForm((current) => ({ ...current, fullDescription: value }))} placeholder="Monte uma descrição profissional com subtítulos, listas, destaques, localização e condições especiais." />
              </Field>
            </div>
          </section>

          <section className="card-premium grid gap-5 p-6 md:grid-cols-2 md:p-8 xl:grid-cols-4">
            <Field label="Tipo do imóvel" hint="A exibição dinâmica do formulário muda automaticamente conforme o tipo selecionado.">
              <select
                value={form.type ?? defaultPropertyType(form.category)}
                onChange={(e) => {
                  const nextType = e.target.value;
                  const nextCategory = inferCategoryFromType(nextType, form.category);
                  setForm((current: typeof emptyForm) => ({
                    ...current,
                    type: nextType,
                    category: nextCategory,
                    hasEdicule: getPropertyFieldVisibility(nextType, nextCategory).showEdicule ? current.hasEdicule : false
                  }));
                }}
                className={baseInputClassName()}
              >
                {typeOptions.map((item) => (
                  <option key={`${item.category}-${item.value}`} value={item.value} className="bg-[#08110d] text-white">{item.value}</option>
                ))}
              </select>
            </Field>
            <Field label="Categoria interna">
              <input value={categoryLabel[form.category] || form.category} className={`${baseInputClassName()} opacity-80`} readOnly />
            </Field>
            <Field label="Status">
              <select value={form.status ?? 'AVAILABLE'} onChange={(e) => setForm({ ...form, status: e.target.value })} className={baseInputClassName()}>
                {statuses.map((item) => (
                  <option key={item.value} value={item.value} className="bg-[#08110d] text-white">{item.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Preço">
              <input type="number" min="1" value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value })} className={baseInputClassName()} required />
            </Field>
            <Field label="Preço promocional" hint="Opcional.">
              <input type="number" min="0" value={form.promotionalPrice ?? ''} onChange={(e) => setForm({ ...form, promotionalPrice: e.target.value })} className={baseInputClassName()} />
            </Field>
            <div className="surface-muted rounded-[1.5rem] p-4 md:col-span-2 xl:col-span-3">
              <p className="text-sm font-medium text-white">Padronização automática de unidades</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">Digite somente números. O portal exibe automaticamente <strong className="text-white">m²</strong> para áreas e <strong className="text-white">m</strong> para medidas lineares, sem alterar seus dados originais no banco.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 xl:col-span-1 xl:grid-cols-1">
              <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />Destaque</label>
              <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.launch} onChange={(e) => setForm({ ...form, launch: e.target.checked })} />Lançamento</label>
              <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.approved} onChange={(e) => setForm({ ...form, approved: e.target.checked })} />Publicado</label>
            </div>
          </section>

          <section className="card-premium grid gap-5 p-6 md:grid-cols-2 md:p-8 xl:grid-cols-4">
            <Field label="Estado (UF)">
              <select value={form.state ?? 'SC'} onChange={(e) => setForm({ ...form, state: e.target.value })} className={baseInputClassName()}>
                {states.map((state) => (
                  <option key={state} value={state} className="bg-[#08110d] text-white">{state}</option>
                ))}
              </select>
            </Field>
            <Field label="Cidade">
              <input value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} className={baseInputClassName()} required />
            </Field>
            <Field label="Bairro">
              <input value={form.district ?? ''} onChange={(e) => setForm({ ...form, district: e.target.value })} className={baseInputClassName()} required />
            </Field>
            <Field label="Área principal exibida">
              <input value={getPrimaryAreaLabel(previewProperty)} className={`${baseInputClassName()} opacity-80`} readOnly />
            </Field>

            {propertyVisibility.showLandArea ? (
              <Field label="Área do terreno" hint="Digite apenas o número; o sistema adiciona m² automaticamente.">
                <input type="number" min="0" value={form.landArea ?? ''} onChange={(e) => setForm({ ...form, landArea: e.target.value })} className={baseInputClassName()} />
              </Field>
            ) : null}

            {propertyVisibility.showBuiltArea ? (
              <Field label="Área construída" hint="Digite apenas o número; o sistema adiciona m² automaticamente.">
                <input type="number" min="0" value={form.builtArea ?? ''} onChange={(e) => setForm({ ...form, builtArea: e.target.value })} className={baseInputClassName()} />
              </Field>
            ) : null}

            <Field label="Área base interna" hint="Mantida para compatibilidade com registros existentes.">
              <input type="number" min="0" value={form.area ?? ''} onChange={(e) => setForm({ ...form, area: e.target.value })} className={baseInputClassName()} />
            </Field>

            {propertyVisibility.showConstructionYear ? (
              <Field label="Ano de construção">
                <input type="number" min="1800" max="2100" value={form.constructionYear ?? ''} onChange={(e) => setForm({ ...form, constructionYear: e.target.value })} className={baseInputClassName()} />
              </Field>
            ) : null}
          </section>

          {propertyVisibility.showRooms ? (
            <section className="card-premium grid gap-5 p-6 md:grid-cols-2 md:p-8 xl:grid-cols-4">
              <Field label="Quartos">
                <input type="number" min="0" value={form.bedrooms ?? ''} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className={baseInputClassName()} />
              </Field>
              <Field label="Banheiros">
                <input type="number" min="0" value={form.bathrooms ?? ''} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className={baseInputClassName()} />
              </Field>
              <Field label="Suítes">
                <input type="number" min="0" value={form.suites ?? ''} onChange={(e) => setForm({ ...form, suites: e.target.value })} className={baseInputClassName()} />
              </Field>
              <Field label="Vagas de garagem">
                <input type="number" min="0" value={form.garage ?? ''} onChange={(e) => setForm({ ...form, garage: e.target.value })} className={baseInputClassName()} />
              </Field>

              {propertyVisibility.showFloor ? (
                <Field label="Andar">
                  <input type="number" min="0" value={form.floor ?? ''} onChange={(e) => setForm({ ...form, floor: e.target.value })} className={baseInputClassName()} />
                </Field>
              ) : null}

              {propertyVisibility.showElevator ? (
                <Field label="Elevador">
                  <select value={String(Boolean(form.hasElevator))} onChange={(e) => setForm({ ...form, hasElevator: e.target.value === 'true' })} className={baseInputClassName()}>
                    {booleanChoices.map((choice) => <option key={choice.label} value={String(choice.value)} className="bg-[#08110d] text-white">{choice.label}</option>)}
                  </select>
                </Field>
              ) : null}

              {propertyVisibility.showSolarPosition ? (
                <Field label="Posição solar">
                  <select value={form.solarPosition ?? ''} onChange={(e) => setForm({ ...form, solarPosition: e.target.value })} className={baseInputClassName()}>
                    <option value="" className="bg-[#08110d] text-white">Selecione</option>
                    {SOLAR_POSITION_OPTIONS.map((option) => <option key={option} value={option} className="bg-[#08110d] text-white">{option}</option>)}
                  </select>
                </Field>
              ) : null}
            </section>
          ) : null}

          {propertyVisibility.showEdicule ? (
            <section className="card-premium space-y-5 p-6 md:p-8">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">Edícula</h3>
                  <p className="mt-1 text-sm text-zinc-400">Preencha somente se o imóvel possuir edícula.</p>
                </div>
                <div className="w-full md:w-56">
                  <select value={String(Boolean(form.hasEdicule))} onChange={(e) => setForm({ ...form, hasEdicule: e.target.value === 'true' })} className={baseInputClassName()}>
                    {booleanChoices.map((choice) => <option key={choice.label} value={String(choice.value)} className="bg-[#08110d] text-white">Possui edícula: {choice.label}</option>)}
                  </select>
                </div>
              </div>

              {form.hasEdicule ? (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
                  <Field label="Área da edícula"><input type="number" min="0" value={form.ediculeArea ?? ''} onChange={(e) => setForm({ ...form, ediculeArea: e.target.value })} className={baseInputClassName()} /></Field>
                  <Field label="Quartos da edícula"><input type="number" min="0" value={form.ediculeBedrooms ?? ''} onChange={(e) => setForm({ ...form, ediculeBedrooms: e.target.value })} className={baseInputClassName()} /></Field>
                  <Field label="Banheiros da edícula"><input type="number" min="0" value={form.ediculeBathrooms ?? ''} onChange={(e) => setForm({ ...form, ediculeBathrooms: e.target.value })} className={baseInputClassName()} /></Field>
                  <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.ediculeHasLivingRoom} onChange={(e) => setForm({ ...form, ediculeHasLivingRoom: e.target.checked })} />Sala</label>
                  <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.ediculeHasKitchen} onChange={(e) => setForm({ ...form, ediculeHasKitchen: e.target.checked })} />Cozinha</label>
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="card-premium space-y-5 p-6 md:p-8">
            <div>
              <h3 className="text-xl font-semibold text-white">Condições comerciais</h3>
              <p className="mt-1 text-sm text-zinc-400">Marque as modalidades aceitas para negociação.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.acceptsBankFinancing} onChange={(e) => setForm({ ...form, acceptsBankFinancing: e.target.checked })} />Financiamento bancário</label>
              <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.acceptsFgts} onChange={(e) => setForm({ ...form, acceptsFgts: e.target.checked })} />FGTS</label>
              <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.acceptsCar} onChange={(e) => setForm({ ...form, acceptsCar: e.target.checked })} />Carro</label>
              <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.acceptsExchange} onChange={(e) => setForm({ ...form, acceptsExchange: e.target.checked })} />Permuta</label>
              <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.acceptsProposal} onChange={(e) => setForm({ ...form, acceptsProposal: e.target.checked })} />Estudo de proposta</label>
              <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.acceptsDirectInstallments} onChange={(e) => setForm({ ...form, acceptsDirectInstallments: e.target.checked })} />Parcelamento direto</label>
            </div>
            {form.acceptsDirectInstallments ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Quantidade máxima de parcelas" hint="Ex.: 120 vezes.">
                  <input type="number" min="1" value={form.maxDirectInstallments ?? ''} onChange={(e) => setForm({ ...form, maxDirectInstallments: e.target.value })} className={baseInputClassName()} />
                </Field>
              </div>
            ) : null}
          </section>

          {propertyVisibility.showTerrainDimensions || propertyVisibility.showTerrainInfrastructure ? (
            <section className="card-premium space-y-5 p-6 md:p-8">
              <div>
                <h3 className="text-xl font-semibold text-white">Informações do terreno</h3>
                <p className="mt-1 text-sm text-zinc-400">Medidas lineares recebem o sufixo <strong className="text-white">m</strong> automaticamente na exibição.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {propertyVisibility.showTerrainDimensions ? <Field label="Frente"><input type="number" min="0" value={form.landFrontage ?? ''} onChange={(e) => setForm({ ...form, landFrontage: e.target.value })} className={baseInputClassName()} /></Field> : null}
                {propertyVisibility.showTerrainDimensions ? <Field label="Profundidade lado esquerdo"><input type="number" min="0" value={form.landDepthLeft ?? ''} onChange={(e) => setForm({ ...form, landDepthLeft: e.target.value })} className={baseInputClassName()} /></Field> : null}
                {propertyVisibility.showTerrainDimensions ? <Field label="Profundidade lado direito"><input type="number" min="0" value={form.landDepthRight ?? ''} onChange={(e) => setForm({ ...form, landDepthRight: e.target.value })} className={baseInputClassName()} /></Field> : null}
                {propertyVisibility.showTerrainInfrastructure ? <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.hasPaving} onChange={(e) => setForm({ ...form, hasPaving: e.target.checked })} />Pavimentação</label> : null}
                {propertyVisibility.showTerrainInfrastructure ? <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.hasElectricity} onChange={(e) => setForm({ ...form, hasElectricity: e.target.checked })} />Energia elétrica</label> : null}
                {propertyVisibility.showTerrainInfrastructure ? <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.hasWaterNetwork} onChange={(e) => setForm({ ...form, hasWaterNetwork: e.target.checked })} />Rede de água</label> : null}
              </div>
            </section>
          ) : null}

          {propertyVisibility.showDevelopmentFields ? (
            <section className="card-premium space-y-5 p-6 md:p-8">
              <div>
                <h3 className="text-xl font-semibold text-white">Informações do loteamento</h3>
                <p className="mt-1 text-sm text-zinc-400">Campos específicos exibidos apenas para loteamentos.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Área mínima"><input type="number" min="0" value={form.lotsMinArea ?? ''} onChange={(e) => setForm({ ...form, lotsMinArea: e.target.value })} className={baseInputClassName()} /></Field>
                <Field label="Área máxima"><input type="number" min="0" value={form.lotsMaxArea ?? ''} onChange={(e) => setForm({ ...form, lotsMaxArea: e.target.value })} className={baseInputClassName()} /></Field>
                <Field label="Quantidade de lotes"><input type="number" min="0" value={form.lotsQuantity ?? ''} onChange={(e) => setForm({ ...form, lotsQuantity: e.target.value })} className={baseInputClassName()} /></Field>
                <Field label="Infraestrutura disponível"><input value={form.developmentInfrastructure ?? ''} onChange={(e) => setForm({ ...form, developmentInfrastructure: e.target.value })} className={baseInputClassName()} placeholder="Ex.: clube, portaria, drenagem" /></Field>
                <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.developmentHasPaving} onChange={(e) => setForm({ ...form, developmentHasPaving: e.target.checked })} />Pavimentação</label>
                <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.developmentHasElectricity} onChange={(e) => setForm({ ...form, developmentHasElectricity: e.target.checked })} />Rede elétrica</label>
                <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.developmentHasWaterNetwork} onChange={(e) => setForm({ ...form, developmentHasWaterNetwork: e.target.checked })} />Rede de água</label>
                <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200"><input type="checkbox" checked={form.readyToBuild} onChange={(e) => setForm({ ...form, readyToBuild: e.target.checked })} />Liberado para construir</label>
                <label className="surface-muted flex items-center gap-3 px-4 py-3 text-sm text-zinc-200 xl:col-span-2"><input type="checkbox" checked={form.hasDevelopmentInstallments} onChange={(e) => setForm({ ...form, hasDevelopmentInstallments: e.target.checked })} />Parcelamento direto com loteadora</label>
                {form.hasDevelopmentInstallments ? (
                  <Field label="Quantidade máxima de parcelas da loteadora" hint="Ex.: 180 vezes.">
                    <input type="number" min="1" value={form.developmentMaxInstallments ?? ''} onChange={(e) => setForm({ ...form, developmentMaxInstallments: e.target.value })} className={baseInputClassName()} />
                  </Field>
                ) : null}
              </div>
            </section>
          ) : null}

          <section className="card-premium space-y-5 p-6 md:p-8">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Fotos do imóvel</h3>
                <p className="mt-1 text-sm text-zinc-400">Envie até 20 fotos. Aceita JPG, JPEG, PNG, WEBP e outros formatos de imagem do computador.</p>
              </div>
              <div className="text-sm font-medium text-brand-gold">{imageCountLabel}</div>
            </div>

            <label className="surface-panel flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.6rem] border border-dashed border-white/15 px-6 py-10 text-center transition hover:border-brand-gold/40">
              <UploadCloud className="text-brand-gold" size={26} />
              <div>
                <p className="font-medium text-white">Selecionar fotos do computador</p>
                <p className="mt-1 text-sm text-zinc-500">Depois do upload você pode reorganizar a ordem manualmente.</p>
              </div>
              <input type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.avif" multiple onChange={handleImageChange} className="hidden" />
            </label>

            {uploadProgress ? (
              <div className="space-y-3 rounded-[1.4rem] border border-brand-gold/20 bg-brand-gold/10 p-4">
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

            {imagePreviews.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {imagePreviews.map((image, index) => (
                  <div key={image.id} className="surface-muted overflow-hidden p-3">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-[1.1rem] bg-black/20">
                      <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                      {index === 0 ? <span className="absolute left-3 top-3 rounded-full bg-brand-gold px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#08110d]">Capa</span> : null}
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-zinc-400">
                      <p className="truncate text-sm text-white">{image.name}</p>
                      <p>{image.originalFormat === 'webp' ? 'WEBP preservado e otimizado' : 'Convertido automaticamente para WEBP'}{image.optimizedSizeKb ? ` • ${image.optimizedSizeKb} KB` : image.sizeKb ? ` • ${image.sizeKb} KB` : ''}</p>
                      {image.originalSizeKb ? <p>Original: {image.originalSizeKb} KB • Final: {image.optimizedSizeKb || image.sizeKb} KB</p> : null}
                      {image.thumbnailSizeKb ? <p>Miniatura automática: {image.thumbnailSizeKb} KB • 400px WEBP</p> : null}
                      {typeof image.compressionRatio === 'number' ? <p>Redução estimada: {image.compressionRatio}%</p> : null}
                      {image.width && image.height ? <p>Imagem principal: {image.width} × {image.height}px • máx. 1920px</p> : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => moveImage(image.id, 'up')} disabled={index === 0} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs text-white transition hover:border-brand-gold hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-40"><ChevronUp size={14} />Subir</button>
                      <button type="button" onClick={() => moveImage(image.id, 'down')} disabled={index === imagePreviews.length - 1} className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs text-white transition hover:border-brand-gold hover:text-brand-gold disabled:cursor-not-allowed disabled:opacity-40"><ChevronDown size={14} />Descer</button>
                      <button type="button" onClick={() => removeImage(image.id)} className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 px-3 py-2 text-xs text-rose-300 transition hover:bg-rose-500/10"><Trash2 size={14} />Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="surface-muted flex items-center gap-3 p-4 text-sm text-zinc-400"><ImagePlus size={18} className="text-brand-gold" />Nenhuma foto enviada ainda.</div>
            )}
          </section>

          <section className="card-premium grid gap-5 p-6 md:grid-cols-2 md:p-8 xl:grid-cols-3">
            <Field label="Link do Google Maps" hint="Opcional."><input value={form.googleMapsLink ?? ''} onChange={(e) => setForm({ ...form, googleMapsLink: e.target.value })} className={baseInputClassName()} /></Field>
            <Field label="Latitude" hint="Opcional."><input value={form.latitude ?? ''} onChange={(e) => setForm({ ...form, latitude: e.target.value })} className={baseInputClassName()} /></Field>
            <Field label="Longitude" hint="Opcional."><input value={form.longitude ?? ''} onChange={(e) => setForm({ ...form, longitude: e.target.value })} className={baseInputClassName()} /></Field>
            <Field label="Vídeo do YouTube" hint="Aceita links padrão do YouTube, youtube.com e youtu.be. O portal converte automaticamente para embed.">
              <div className="space-y-2">
                <input value={form.youtubeLink ?? ''} onChange={(e) => setForm({ ...form, youtubeLink: e.target.value })} placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..." className={baseInputClassName()} />
                {hasInvalidPropertyVideo ? <p className="text-xs text-rose-400">Informe um link válido do YouTube para salvar o imóvel.</p> : null}
              </div>
            </Field>
            <Field label="PDF da tabela" hint="Opcional."><input value={form.pdfTableUrl ?? ''} onChange={(e) => setForm({ ...form, pdfTableUrl: e.target.value })} className={baseInputClassName()} /></Field>
            <Field label="PDF do projeto" hint="Opcional."><input value={form.pdfProjectUrl ?? ''} onChange={(e) => setForm({ ...form, pdfProjectUrl: e.target.value })} className={baseInputClassName()} /></Field>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <button disabled={loading || uploadingImages} type="submit" className="btn-primary px-6 py-3 disabled:opacity-60">{loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{editingId ? 'Atualizar imóvel' : 'Salvar imóvel'}</button>
            <button type="button" onClick={resetForm} className="btn-secondary px-6 py-3">Limpar formulário</button>
            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
            {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
