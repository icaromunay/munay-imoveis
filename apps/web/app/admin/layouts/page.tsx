'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  History,
  LayoutTemplate,
  Layers3,
  Loader2,
  Palette,
  Plus,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2
} from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin';
import {
  THEME_BLOCK_DEFINITIONS,
  ThemePresetDefinition,
  QuickCustomizationInput,
  QuickStyle,
  buildBlocksFromPalette,
  buildBlocksFromQuickCustomization,
  buildThemePresetCatalog,
  deriveQuickCustomizationFromLayout,
  getBlockSettings,
  getLayoutContrastWarnings,
  radiusToCss,
  shadowToCss
} from '@/lib/theme-layout';
import { ThemeLayout, ThemeLayoutActivationHistory, ThemeLayoutBlock } from '@/lib/types';

type EditableThemeLayout = ThemeLayout & { isNew?: boolean };
type ActiveTab = 'layouts' | 'quick' | 'history';
type SelectValue =
  | 'none'
  | 'soft'
  | 'medium'
  | 'strong'
  | 'glow'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | 'pill'
  | 'lift'
  | 'underline'
  | 'scale'
  | 'compact'
  | 'comfortable'
  | 'tall'
  | 'luxo'
  | 'moderno'
  | 'minimalista'
  | 'praia'
  | 'corporativo';

const QUICK_STYLE_OPTIONS: { value: QuickStyle; label: string }[] = [
  { value: 'luxo', label: 'Luxo' },
  { value: 'moderno', label: 'Moderno' },
  { value: 'minimalista', label: 'Minimalista' },
  { value: 'praia', label: 'Praia' },
  { value: 'corporativo', label: 'Corporativo' }
];

const DEFAULT_QUICK_CONFIG: QuickCustomizationInput = {
  primaryColor: '#102a1f',
  secondaryColor: '#d4af72',
  accentColor: '#f6f2e8',
  style: 'luxo',
  radius: 'xl',
  shadow: 'soft'
};

function makeEditableBlocks(base: EditableThemeLayout | null | undefined, generatedBlocks: Array<{ blockKey: string; blockName: string; sortOrder: number; settingsJson: ThemeLayoutBlock['settingsJson'] }>) {
  const existingByKey = new Map((base?.blocks || []).map((block) => [block.blockKey, block]));
  const stamp = Date.now();

  return generatedBlocks.map((block, index) => ({
    id: existingByKey.get(block.blockKey)?.id || `draft-${block.blockKey}-${stamp}-${index}`,
    themeLayoutId: base?.isNew ? undefined : base?.id,
    blockKey: block.blockKey,
    blockName: block.blockName,
    sortOrder: block.sortOrder,
    settingsJson: block.settingsJson
  }));
}

function cloneLayout(layout: ThemeLayout | null | undefined): EditableThemeLayout {
  const baseBlocks = THEME_BLOCK_DEFINITIONS.map((definition, index) => {
    const existing = layout?.blocks?.find((block) => block.blockKey === definition.key);
    return {
      id: existing?.id || `draft-${definition.key}`,
      themeLayoutId: layout?.id,
      blockKey: definition.key,
      blockName: definition.name,
      sortOrder: existing?.sortOrder ?? index,
      settingsJson: { ...getBlockSettings(layout, definition.key) }
    } as ThemeLayoutBlock;
  });

  return {
    id: layout?.id || `draft-${Date.now()}`,
    name: layout?.name || 'Novo layout visual',
    slug: layout?.slug || '',
    description: layout?.description || '',
    isActive: layout?.isActive || false,
    isDefault: layout?.isDefault || false,
    blocks: baseBlocks,
    warnings: layout?.warnings || [],
    contrastOk: layout?.contrastOk ?? true,
    isNew: !layout
  };
}

function buildDraftFromPreset(preset: ThemePresetDefinition, base?: EditableThemeLayout | null) {
  const reference = base || cloneLayout(null);
  const blocks = makeEditableBlocks(reference, buildBlocksFromPalette(preset.palette, { style: preset.styleHint }));

  return {
    ...reference,
    id: reference.isNew ? reference.id : `draft-${Date.now()}`,
    name: preset.name,
    slug: '',
    description: preset.description,
    isActive: false,
    isDefault: false,
    isNew: true,
    blocks
  } as EditableThemeLayout;
}

function applyQuickConfigToDraft(base: EditableThemeLayout, quickConfig: QuickCustomizationInput) {
  return {
    ...base,
    blocks: makeEditableBlocks(base, buildBlocksFromQuickCustomization(quickConfig))
  } satisfies EditableThemeLayout;
}

function isProtectedLayout(layout: ThemeLayout | EditableThemeLayout | null | undefined) {
  if (!layout) return false;
  return layout.isDefault || layout.slug === 'layout-escuro';
}

function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'active' | 'warning' | 'accent' }) {
  const className =
    tone === 'active'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
      : tone === 'warning'
        ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
        : tone === 'accent'
          ? 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold'
          : 'border-white/10 bg-white/5 text-zinc-300';

  return <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${className}`}>{children}</span>;
}

function SelectField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: SelectValue;
  options: { label: string; value: SelectValue }[];
  onChange: (value: SelectValue) => void;
}) {
  return (
    <label className="space-y-2 text-sm text-zinc-300">
      <span className="block text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as SelectValue)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none">
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#08110d] text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextTokenField({ label, value, onChange, colorMode = false }: { label: string; value: string; onChange: (value: string) => void; colorMode?: boolean }) {
  const isHex = /^#[0-9a-f]{6}$/i.test(value || '');
  return (
    <div className="space-y-2">
      <span className="block text-xs uppercase tracking-[0.24em] text-zinc-500">{label}</span>
      <div className="flex items-center gap-3">
        {colorMode ? (
          <input
            type="color"
            value={isHex ? value : '#102a1f'}
            onChange={(event) => onChange(event.target.value)}
            className="h-12 w-14 rounded-2xl border border-white/10 bg-white/5 p-2"
          />
        ) : null}
        <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
      </div>
    </div>
  );
}

function QuickField({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-400">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MiniSwatch({ color }: { color: string }) {
  return <span className="inline-flex h-4 w-4 rounded-full border border-white/15" style={{ backgroundColor: color }} />;
}

function PreviewWorkspace({ layout, title, highlight = false }: { layout: ThemeLayout | EditableThemeLayout | null; title: string; highlight?: boolean }) {
  if (!layout) {
    return (
      <div className="rounded-[2rem] border border-dashed border-white/10 bg-black/10 p-8 text-sm text-zinc-400">
        Nenhum layout disponível para preview.
      </div>
    );
  }

  const header = getBlockSettings(layout, 'header');
  const hero = getBlockSettings(layout, 'hero-home');
  const search = getBlockSettings(layout, 'search-bar');
  const cards = getBlockSettings(layout, 'property-cards');
  const highlights = getBlockSettings(layout, 'highlights');
  const launches = getBlockSettings(layout, 'launches');
  const property = getBlockSettings(layout, 'property-page');
  const technical = getBlockSettings(layout, 'technical-sheet');
  const cta = getBlockSettings(layout, 'cta-buttons');
  const blog = getBlockSettings(layout, 'blog');
  const footer = getBlockSettings(layout, 'footer');

  return (
    <article className={`rounded-[2rem] border p-4 ${highlight ? 'border-brand-gold/40 bg-white/5' : 'border-white/10 bg-black/20'}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Comparação visual</p>
          <h4 className="mt-2 text-lg font-semibold text-white">{title}</h4>
        </div>
        {highlight ? <Badge tone="accent">Rascunho</Badge> : <Badge>Layout ativo</Badge>}
      </div>

      <div className="space-y-4 rounded-[1.6rem] p-4" style={{ background: property.background }}>
        <section className="overflow-hidden rounded-[1.5rem] border" style={{ borderColor: header.borderColor }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ background: header.surface }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: header.textPrimary }}>
                Munay Imóveis
              </p>
              <p className="text-xs" style={{ color: header.textSecondary }}>
                Navegação premium • busca • institucional
              </p>
            </div>
            <div className="inline-flex rounded-full px-4 py-2 text-xs font-semibold" style={{ background: header.buttonPrimary, color: header.textPrimary }}>
              Agendar visita
            </div>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-[1.25fr_0.95fr]" style={{ background: hero.surface }}>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em]" style={{ color: hero.accent }}>
                Home completa
              </p>
              <h5 className="mt-3 text-xl font-semibold" style={{ color: hero.textPrimary }}>
                Seu portal com identidade pronta para vender mais
              </h5>
              <p className="mt-2 text-sm leading-6" style={{ color: hero.textSecondary }}>
                Hero, busca, destaques, lançamentos e CTAs já recalculados automaticamente para uso diário.
              </p>
              <div className="mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold" style={{ background: hero.buttonPrimary, color: hero.textPrimary }}>
                Ver imóveis
              </div>
            </div>
            <div className="rounded-[1.5rem] border p-4" style={{ background: search.surface, borderColor: search.borderColor }}>
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: search.accent }}>
                Busca rápida
              </p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {['Comprar', 'Casa', 'Praia Grande', 'Até R$ 1,5 mi'].map((item) => (
                  <div key={item} className="rounded-2xl border px-3 py-2 text-xs" style={{ borderColor: search.borderColor, color: search.textPrimary }}>
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-3 inline-flex rounded-full px-4 py-2 text-xs font-semibold" style={{ background: search.buttonPrimary, color: search.textPrimary }}>
                Buscar agora
              </div>
            </div>
          </div>
          <div className="grid gap-3 border-t p-4 md:grid-cols-3" style={{ borderColor: highlights.borderColor, background: highlights.background }}>
            {[
              ['Destaques', highlights.accent],
              ['Lançamentos', launches.accent],
              ['Pronto para captar leads', cta.buttonPrimary]
            ].map(([label, tone]) => (
              <div key={label} className="rounded-[1.25rem] border px-4 py-3" style={{ borderColor: highlights.borderColor, background: highlights.surface }}>
                <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: String(tone) }}>
                  {label}
                </p>
                <p className="mt-2 text-sm" style={{ color: highlights.textSecondary }}>
                  Visual consistente em todas as seções públicas.
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border p-4" style={{ borderColor: cards.borderColor, background: cards.background, boxShadow: shadowToCss(cards.shadow) }}>
            <div className="rounded-[1.25rem] p-4" style={{ background: cards.surface }}>
              <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: cards.accent }}>
                Card de imóvel
              </p>
              <div className="mt-3 h-24 rounded-[1.1rem]" style={{ background: cards.accent, opacity: 0.22 }} />
              <h5 className="mt-3 text-lg font-semibold" style={{ color: cards.textPrimary }}>
                Casa alto padrão frente mar
              </h5>
              <p className="mt-2 text-sm leading-6" style={{ color: cards.textSecondary }}>
                4 suítes • 320 m² • localização premium • CTA destacado.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: cards.accent }}>
                  R$ 2.150.000
                </span>
                <span className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: cards.buttonPrimary, color: cards.textPrimary }}>
                  Ver imóvel
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border p-4" style={{ borderColor: property.borderColor, background: property.background }}>
            <div className="rounded-[1.35rem] border p-4" style={{ borderColor: property.borderColor, background: property.surface }}>
              <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: property.accent }}>
                Página interna do imóvel
              </p>
              <h5 className="mt-3 text-lg font-semibold" style={{ color: property.textPrimary }}>
                Hero do imóvel + ficha técnica
              </h5>
              <p className="mt-2 text-sm leading-6" style={{ color: property.textSecondary }}>
                Galeria, informações principais, contatos e prova visual do layout antes da ativação.
              </p>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {['3 vagas', 'Vista mar', 'Alto padrão', 'Aceita financiamento'].map((item) => (
                  <div key={item} className="rounded-2xl border px-3 py-2 text-xs" style={{ borderColor: technical.borderColor, color: technical.textPrimary, background: technical.surface }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.5rem] border p-4" style={{ borderColor: blog.borderColor, background: blog.background }}>
            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: blog.buttonPrimary }}>
              Blog
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {[1, 2].map((item) => (
                <div key={item} className="rounded-[1.25rem] border p-4" style={{ borderColor: blog.borderColor, background: blog.surface }}>
                  <div className="h-16 rounded-2xl" style={{ background: blog.buttonPrimary, opacity: 0.18 }} />
                  <p className="mt-3 text-sm font-semibold" style={{ color: blog.textPrimary }}>
                    Conteúdo com identidade visual consistente
                  </p>
                  <p className="mt-2 text-xs leading-5" style={{ color: blog.textSecondary }}>
                    Data, resumo e CTA harmonizados com o restante do portal.
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border p-4" style={{ borderColor: footer.borderColor, background: footer.surface }}>
            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: footer.accent }}>
              Botões e rodapé
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full px-4 py-2 text-xs font-semibold" style={{ background: cta.buttonPrimary, color: cta.textPrimary }}>
                WhatsApp
              </span>
              <span className="rounded-full border px-4 py-2 text-xs font-semibold" style={{ borderColor: cta.borderColor, color: cta.buttonSecondary }}>
                Agendar visita
              </span>
            </div>
            <div className="mt-4 rounded-[1.2rem] border p-4" style={{ borderColor: footer.borderColor, background: footer.background }}>
              <p className="text-sm font-semibold" style={{ color: footer.textPrimary }}>
                Rodapé institucional
              </p>
              <p className="mt-2 text-xs leading-5" style={{ color: footer.textSecondary }}>
                Contatos, credibilidade, políticas e links permanentes do portal.
              </p>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

function formatHistoryDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value));
}

function actionLabel(action: string) {
  switch (action) {
    case 'INITIAL_SEED':
      return 'Seed inicial';
    case 'RESTORE_PREVIOUS':
      return 'Restaurado para o anterior';
    case 'RESTORE_HISTORY':
      return 'Restaurado pelo histórico';
    case 'RECOVERY':
      return 'Recuperação automática';
    default:
      return 'Ativação';
  }
}

export default function AdminLayoutsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('layouts');
  const [layouts, setLayouts] = useState<ThemeLayout[]>([]);
  const [history, setHistory] = useState<ThemeLayoutActivationHistory[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [draft, setDraft] = useState<EditableThemeLayout | null>(null);
  const [quickConfig, setQuickConfig] = useState<QuickCustomizationInput>(DEFAULT_QUICK_CONFIG);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const presetCatalog = useMemo(
    () => buildThemePresetCatalog(quickConfig.primaryColor, quickConfig.secondaryColor, quickConfig.accentColor),
    [quickConfig.primaryColor, quickConfig.secondaryColor, quickConfig.accentColor]
  );

  const layoutPresets = presetCatalog.filter((preset) => preset.category === 'layout');
  const identityPresets = presetCatalog.filter((preset) => preset.category === 'identity');
  const warnings = useMemo(() => getLayoutContrastWarnings(draft), [draft]);
  const activeLayout = layouts.find((item) => item.isActive) || null;

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const data = (await adminFetch('/themes/history')) as ThemeLayoutActivationHistory[];
      setHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadLayouts(preferredId?: string) {
    setLoading(true);
    setError('');

    try {
      const [layoutData, historyData] = await Promise.all([
        adminFetch('/themes') as Promise<ThemeLayout[]>,
        adminFetch('/themes/history') as Promise<ThemeLayoutActivationHistory[]>
      ]);

      setLayouts(layoutData);
      setHistory(historyData);
      setHistoryLoading(false);

      const nextId = preferredId || selectedId || layoutData.find((item) => item.isActive)?.id || layoutData[0]?.id || '';
      setSelectedId(nextId);
      const selected = layoutData.find((item) => item.id === nextId) || layoutData[0] || null;
      const nextDraft = selected ? cloneLayout(selected) : cloneLayout(null);
      setDraft(nextDraft);
      setQuickConfig(deriveQuickCustomizationFromLayout(nextDraft));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar os layouts salvos.');
      setHistoryLoading(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLayouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab !== 'quick') return;
    setDraft((current) => (current ? applyQuickConfigToDraft(current, quickConfig) : current));
  }, [activeTab, quickConfig]);

  function resetMessages() {
    setMessage('');
    setError('');
  }

  function selectLayout(layout: ThemeLayout) {
    setSelectedId(layout.id);
    const nextDraft = cloneLayout(layout);
    setDraft(nextDraft);
    setQuickConfig(deriveQuickCustomizationFromLayout(nextDraft));
    resetMessages();
  }

  function updateBlock(blockKey: string, fieldKey: string, value: string) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        blocks: current.blocks.map((block) =>
          block.blockKey === blockKey
            ? {
                ...block,
                settingsJson: {
                  ...block.settingsJson,
                  [fieldKey]: value
                }
              }
            : block
        )
      };
    });
  }

  function beginNewLayout() {
    const base = cloneLayout(activeLayout || layouts[0] || null);
    const created = {
      ...base,
      id: `draft-${Date.now()}`,
      name: `${base.name} Novo`,
      slug: '',
      description: 'Novo layout criado a partir do modelo selecionado.',
      isActive: false,
      isDefault: false,
      isNew: true
    } satisfies EditableThemeLayout;

    setDraft(created);
    setQuickConfig(deriveQuickCustomizationFromLayout(created));
    setSelectedId('');
    setActiveTab('quick');
    setMessage('Novo layout preparado. Use a Personalização Rápida para gerar um visual completo em menos de 1 minuto.');
    setError('');
  }

  function applyPreset(preset: ThemePresetDefinition) {
    const nextDraft = buildDraftFromPreset(preset, draft || cloneLayout(activeLayout || layouts[0] || null));
    setDraft(nextDraft);
    setQuickConfig({
      ...deriveQuickCustomizationFromLayout(nextDraft),
      style: preset.styleHint || 'luxo'
    });
    setSelectedId('');
    setActiveTab('quick');
    setMessage(`Preset aplicado: ${preset.name}. Ajuste as 6 opções rápidas e salve quando quiser.`);
    setError('');
  }

  async function saveLayout() {
    if (!draft) return;
    setSaving(true);
    resetMessages();

    try {
      const payload = {
        name: draft.name,
        description: draft.description,
        blocks: draft.blocks.map((block) => ({
          blockKey: block.blockKey,
          blockName: block.blockName,
          sortOrder: block.sortOrder,
          settingsJson: block.settingsJson
        }))
      };

      const saved = draft.isNew
        ? await adminFetch('/themes', { method: 'POST', body: JSON.stringify(payload) })
        : await adminFetch(`/themes/${draft.id}`, { method: 'PUT', body: JSON.stringify(payload) });

      const savedLayout = saved as ThemeLayout;
      setMessage(draft.isNew ? 'Novo layout salvo com sucesso.' : 'Layout atualizado com sucesso.');
      await loadLayouts(savedLayout.id);
      setActiveTab('layouts');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar o layout.');
    } finally {
      setSaving(false);
    }
  }

  async function duplicateLayout() {
    if (!draft || draft.isNew) return;
    setSaving(true);
    resetMessages();

    try {
      const duplicated = (await adminFetch(`/themes/${draft.id}/duplicate`, { method: 'POST' })) as ThemeLayout;
      setMessage('Layout duplicado com sucesso e aberto automaticamente para edição.');
      await loadLayouts(duplicated.id);
      setActiveTab('layouts');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível duplicar o layout.');
    } finally {
      setSaving(false);
    }
  }

  async function activateLayout() {
    if (!draft || draft.isNew) return;
    setSaving(true);
    resetMessages();

    try {
      const activated = (await adminFetch(`/themes/${draft.id}/activate`, { method: 'POST' })) as ThemeLayout;
      setMessage(`Layout ${activated.name} ativado no site.`);
      await loadLayouts(activated.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível ativar o layout.');
    } finally {
      setSaving(false);
    }
  }

  async function restorePrevious() {
    setSaving(true);
    resetMessages();

    try {
      const restored = (await adminFetch('/themes/restore-previous', { method: 'POST' })) as ThemeLayout;
      setMessage(`Layout anterior restaurado: ${restored.name}.`);
      await loadLayouts(restored.id);
      setActiveTab('history');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível restaurar o layout anterior.');
    } finally {
      setSaving(false);
    }
  }

  async function restoreHistoryItem(entry: ThemeLayoutActivationHistory) {
    setSaving(true);
    resetMessages();

    try {
      const restored = (await adminFetch(`/themes/history/${entry.id}/restore`, { method: 'POST' })) as ThemeLayout;
      setMessage(`Layout restaurado a partir do histórico: ${restored.name}.`);
      await loadLayouts(restored.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível restaurar esse layout do histórico.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteLayout() {
    if (!draft || draft.isNew || draft.isActive || isProtectedLayout(draft)) return;
    const confirmed = window.confirm(`Excluir o layout “${draft.name}”? Esta ação não remove imóveis nem conteúdo do portal.`);
    if (!confirmed) return;

    setSaving(true);
    resetMessages();

    try {
      await adminFetch(`/themes/${draft.id}`, { method: 'DELETE' });
      setMessage('Layout excluído com sucesso.');
      await loadLayouts();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível excluir o layout.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell title="Layouts visuais por blocos">
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="card-premium p-5">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Modelos salvos</p>
              <h2 className="mt-2 text-xl font-semibold text-white">Layouts + presets rápidos</h2>
            </div>
            <button onClick={beginNewLayout} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/5">
              <Plus size={16} />
              Novo
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-zinc-300">
                <Loader2 size={16} className="animate-spin" />
                Carregando layouts salvos...
              </div>
            ) : (
              layouts.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => selectLayout(layout)}
                  className={`w-full rounded-[1.5rem] border p-4 text-left transition ${selectedId === layout.id && !draft?.isNew ? 'border-brand-gold/40 bg-white/10' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-white">{layout.name}</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-400">{layout.description || 'Sem descrição adicional.'}</p>
                    </div>
                    <LayoutTemplate size={18} className="text-brand-gold" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {layout.isActive ? <Badge tone="active">Ativo</Badge> : null}
                    {isProtectedLayout(layout) ? <Badge>Layout Escuro</Badge> : null}
                    {layout.warnings?.length ? <Badge tone="warning">Atenção contraste</Badge> : null}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-brand-gold" />
              <p className="text-sm font-medium text-white">Presets rápidos de identidade</p>
            </div>
            <div className="mt-4 grid gap-2">
              {identityPresets.map((preset) => (
                <button key={preset.slug} onClick={() => applyPreset(preset)} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/8">
                  <div>
                    <p className="text-sm font-medium text-white">{preset.name}</p>
                    <p className="text-xs leading-5 text-zinc-400">{preset.description}</p>
                  </div>
                  <Badge tone="accent">Preset</Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm text-zinc-300">
            <p className="font-medium text-white">Ações rápidas</p>
            <button onClick={restorePrevious} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 transition hover:bg-white/5 disabled:opacity-60">
              <RefreshCcw size={16} />
              Restaurar layout anterior
            </button>
            <button onClick={loadHistory} disabled={saving || historyLoading} className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-3 transition hover:bg-white/5 disabled:opacity-60">
              <History size={16} />
              Atualizar histórico
            </button>
            <p className="text-xs leading-5 text-zinc-500">O Layout Escuro permanece protegido como fallback permanente do portal.</p>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="card-premium p-6">
            <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Gestão prática do visual</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{draft?.name || 'Layout visual'}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
                  Escolha entre editor por blocos, Personalização Rápida em 6 campos e histórico completo de ativações. Tudo sem alterar URLs, slugs ou conteúdo do portal.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={saveLayout} disabled={saving || !draft} className="btn-primary min-h-12 px-5 py-3 text-xs">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Salvar layout
                </button>
                <button onClick={duplicateLayout} disabled={saving || !draft || draft.isNew} className="btn-secondary min-h-12 px-5 py-3 text-xs">
                  <Copy size={16} />
                  Duplicar
                </button>
                <button onClick={activateLayout} disabled={saving || !draft || draft.isNew} className="btn-secondary min-h-12 px-5 py-3 text-xs">
                  <Check size={16} />
                  Ativar no site
                </button>
                <button onClick={deleteLayout} disabled={saving || !draft || draft.isNew || draft.isActive || isProtectedLayout(draft)} className="btn-secondary min-h-12 px-5 py-3 text-xs">
                  <Trash2 size={16} />
                  Excluir
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {[
                { id: 'layouts', label: 'Layouts', icon: Layers3 },
                { id: 'quick', label: 'Personalização Rápida', icon: Palette },
                { id: 'history', label: 'Histórico de layouts', icon: History }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActiveTab = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm transition ${isActiveTab ? 'border-brand-gold/40 bg-brand-gold/10 text-brand-gold' : 'border-white/10 bg-white/5 text-zinc-300 hover:bg-white/8'}`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <label className="space-y-2 text-sm text-zinc-300">
                  <span className="block text-xs uppercase tracking-[0.24em] text-zinc-500">Nome do layout</span>
                  <input value={draft?.name || ''} onChange={(event) => setDraft((current) => (current ? { ...current, name: event.target.value } : current))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
                </label>
                <label className="space-y-2 text-sm text-zinc-300">
                  <span className="block text-xs uppercase tracking-[0.24em] text-zinc-500">Descrição</span>
                  <textarea value={draft?.description || ''} onChange={(event) => setDraft((current) => (current ? { ...current, description: event.target.value } : current))} rows={3} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none" />
                </label>
                <div className="flex flex-wrap gap-2">
                  {draft?.isActive ? <Badge tone="active">Layout ativo no site</Badge> : null}
                  {isProtectedLayout(draft) ? <Badge>Layout Escuro preservado</Badge> : null}
                  {draft?.isNew ? <Badge tone="accent">Novo modelo</Badge> : null}
                  {!draft?.isNew ? <Badge>{draft?.slug || 'sem-slug'}</Badge> : null}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Eye size={16} className="text-brand-gold" />
                  Regras de contraste e acessibilidade
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  O editor valida contraste essencial antes de salvar ou ativar. A Personalização Rápida recalcula os blocos automaticamente e preserva o fallback seguro.
                </p>
                <div className="mt-4 space-y-2">
                  {warnings.length ? (
                    warnings.map((warning) => (
                      <div key={warning} className="flex items-start gap-2 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-3 text-sm text-amber-100">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-3 text-sm text-emerald-100">
                      <Check size={16} className="mt-0.5 shrink-0" />
                      <span>Os blocos principais estão com contraste adequado para leitura base.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {message ? <p className="mt-4 text-sm text-emerald-400">{message}</p> : null}
            {error ? <p className="mt-4 text-sm text-rose-400">{error}</p> : null}
          </section>

          {activeTab === 'layouts' ? (
            <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-4">
                {draft ? (
                  THEME_BLOCK_DEFINITIONS.map((definition) => {
                    const block = draft.blocks.find((item) => item.blockKey === definition.key);
                    const settings = block?.settingsJson || getBlockSettings(draft, definition.key);

                    return (
                      <article key={definition.key} className="card-premium p-5">
                        <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Bloco visual</p>
                            <h3 className="mt-2 text-lg font-semibold text-white">{definition.name}</h3>
                          </div>
                          <Badge>{definition.fields.length} controles</Badge>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {definition.fields.map(([fieldKey, label]) => {
                            const value = String((settings as Record<string, string>)[fieldKey] || '');

                            if (fieldKey === 'shadow') {
                              return (
                                <SelectField
                                  key={`${definition.key}-${fieldKey}`}
                                  label={label}
                                  value={value as SelectValue}
                                  options={[
                                    { label: 'Sem sombra', value: 'none' },
                                    { label: 'Suave', value: 'soft' },
                                    { label: 'Média', value: 'medium' },
                                    { label: 'Forte', value: 'strong' },
                                    { label: 'Glow', value: 'glow' }
                                  ]}
                                  onChange={(nextValue) => updateBlock(definition.key, fieldKey, nextValue)}
                                />
                              );
                            }

                            if (fieldKey === 'radius') {
                              return (
                                <SelectField
                                  key={`${definition.key}-${fieldKey}`}
                                  label={label}
                                  value={value as SelectValue}
                                  options={[
                                    { label: 'Médio', value: 'md' },
                                    { label: 'Grande', value: 'lg' },
                                    { label: 'XL', value: 'xl' },
                                    { label: '2XL', value: '2xl' },
                                    { label: 'Pill', value: 'pill' }
                                  ]}
                                  onChange={(nextValue) => updateBlock(definition.key, fieldKey, nextValue)}
                                />
                              );
                            }

                            if (fieldKey === 'hoverEffect') {
                              return (
                                <SelectField
                                  key={`${definition.key}-${fieldKey}`}
                                  label={label}
                                  value={value as SelectValue}
                                  options={[
                                    { label: 'Sem hover', value: 'none' },
                                    { label: 'Lift', value: 'lift' },
                                    { label: 'Glow', value: 'glow' },
                                    { label: 'Underline', value: 'underline' },
                                    { label: 'Scale', value: 'scale' }
                                  ]}
                                  onChange={(nextValue) => updateBlock(definition.key, fieldKey, nextValue)}
                                />
                              );
                            }

                            if (fieldKey === 'height') {
                              return (
                                <SelectField
                                  key={`${definition.key}-${fieldKey}`}
                                  label={label}
                                  value={value as SelectValue}
                                  options={[
                                    { label: 'Compacta', value: 'compact' },
                                    { label: 'Confortável', value: 'comfortable' },
                                    { label: 'Alta', value: 'tall' }
                                  ]}
                                  onChange={(nextValue) => updateBlock(definition.key, fieldKey, nextValue)}
                                />
                              );
                            }

                            const colorMode = !['surface'].includes(fieldKey);
                            return <TextTokenField key={`${definition.key}-${fieldKey}`} label={label} value={value} onChange={(nextValue) => updateBlock(definition.key, fieldKey, nextValue)} colorMode={colorMode} />;
                          })}
                        </div>
                      </article>
                    );
                  })
                ) : null}
              </div>

              <div className="space-y-4">
                <PreviewWorkspace layout={draft} title="Rascunho em edição" highlight />
                <PreviewWorkspace layout={activeLayout} title="Layout atualmente publicado" />
              </div>
            </section>
          ) : null}

          {activeTab === 'quick' ? (
            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-4">
                <div className="card-premium p-5">
                  <div className="border-b border-white/10 pb-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Personalização Rápida</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Crie um visual completo em menos de 1 minuto</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      Ao alterar estas 6 opções, o sistema recalcula automaticamente todos os blocos principais do portal.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <QuickField title="Cor principal" subtitle="Base visual do fundo institucional e da página interna.">
                      <TextTokenField label="Cor principal" value={quickConfig.primaryColor} onChange={(value) => setQuickConfig((current) => ({ ...current, primaryColor: value }))} colorMode />
                    </QuickField>
                    <QuickField title="Cor secundária" subtitle="Cor dominante dos botões e ações principais.">
                      <TextTokenField label="Cor secundária" value={quickConfig.secondaryColor} onChange={(value) => setQuickConfig((current) => ({ ...current, secondaryColor: value }))} colorMode />
                    </QuickField>
                    <QuickField title="Cor de destaque" subtitle="Usada em selos, acentos, preços e detalhes premium.">
                      <TextTokenField label="Cor de destaque" value={quickConfig.accentColor} onChange={(value) => setQuickConfig((current) => ({ ...current, accentColor: value }))} colorMode />
                    </QuickField>
                    <QuickField title="Estilo" subtitle="Direção visual macro do portal.">
                      <SelectField
                        label="Estilo"
                        value={quickConfig.style}
                        options={QUICK_STYLE_OPTIONS.map((option) => ({ label: option.label, value: option.value }))}
                        onChange={(value) => setQuickConfig((current) => ({ ...current, style: value as QuickStyle }))}
                      />
                    </QuickField>
                    <QuickField title="Raio de borda" subtitle="Aplica uniformidade em cards, busca, blog e painéis.">
                      <SelectField
                        label="Raio de borda"
                        value={quickConfig.radius}
                        options={[
                          { label: 'Médio', value: 'md' },
                          { label: 'Grande', value: 'lg' },
                          { label: 'XL', value: 'xl' },
                          { label: '2XL', value: '2xl' },
                          { label: 'Pill', value: 'pill' }
                        ]}
                        onChange={(value) => setQuickConfig((current) => ({ ...current, radius: value as QuickCustomizationInput['radius'] }))}
                      />
                    </QuickField>
                    <QuickField title="Intensidade das sombras" subtitle="Ajuste percepção de profundidade e sofisticação.">
                      <SelectField
                        label="Intensidade das sombras"
                        value={quickConfig.shadow}
                        options={[
                          { label: 'Sem sombra', value: 'none' },
                          { label: 'Suave', value: 'soft' },
                          { label: 'Média', value: 'medium' },
                          { label: 'Forte', value: 'strong' },
                          { label: 'Glow', value: 'glow' }
                        ]}
                        onChange={(value) => setQuickConfig((current) => ({ ...current, shadow: value as QuickCustomizationInput['shadow'] }))}
                      />
                    </QuickField>
                  </div>
                </div>

                <div className="card-premium p-5">
                  <div className="border-b border-white/10 pb-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Layouts base</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Escolha um ponto de partida</h3>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {layoutPresets.map((preset) => (
                      <button key={preset.slug} onClick={() => applyPreset(preset)} className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/8">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">{preset.name}</p>
                          <div className="flex items-center gap-2">
                            <MiniSwatch color={preset.palette.background} />
                            <MiniSwatch color={preset.palette.buttonPrimary} />
                            <MiniSwatch color={preset.palette.accent} />
                          </div>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-zinc-400">{preset.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <PreviewWorkspace layout={draft} title="Preview completo do rascunho" highlight />
                <PreviewWorkspace layout={activeLayout} title="Comparação lado a lado com o layout ativo" />
              </div>
            </section>
          ) : null}

          {activeTab === 'history' ? (
            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="card-premium p-5">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Histórico de layouts</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">Ativações com data e restauração rápida</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">Veja quando cada layout entrou no ar e restaure qualquer versão com um clique.</p>
                </div>

                <div className="mt-4 space-y-3">
                  {historyLoading ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-zinc-300">
                      <Loader2 size={16} className="animate-spin" />
                      Carregando histórico...
                    </div>
                  ) : history.length ? (
                    history.map((entry) => (
                      <article key={entry.id} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-white">{entry.layoutNameSnapshot}</p>
                            <p className="mt-1 text-sm text-zinc-400">Ativado em {formatHistoryDate(entry.activatedAt)}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.24em] text-zinc-500">{actionLabel(entry.action)}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {entry.themeLayout?.isActive ? <Badge tone="active">Ativo agora</Badge> : null}
                            {entry.themeLayout?.isDefault ? <Badge>Fallback</Badge> : null}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button onClick={() => restoreHistoryItem(entry)} disabled={saving} className="btn-secondary min-h-11 px-4 py-2 text-xs">
                            <RefreshCcw size={16} />
                            Restaurar este layout
                          </button>
                          {entry.themeLayout ? (
                            <button
                              onClick={() => {
                                const target = layouts.find((item) => item.id === entry.themeLayout?.id);
                                if (target) selectLayout(target);
                                setActiveTab('layouts');
                              }}
                              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-zinc-200 transition hover:bg-white/5"
                            >
                              <Eye size={16} />
                              Abrir no editor
                            </button>
                          ) : null}
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/10 px-4 py-8 text-sm text-zinc-400">
                      Ainda não há histórico de ativações registrado.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <PreviewWorkspace layout={draft} title="Layout atualmente selecionado para edição" highlight />
                <PreviewWorkspace layout={activeLayout} title="Layout ativo publicado" />
                {draft ? (
                  <section className="card-premium p-5">
                    <div className="border-b border-white/10 pb-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-brand-gold">Resumo técnico</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">Tokens principais em uso</h3>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      {[
                        ['Raio dos cards', radiusToCss(getBlockSettings(draft, 'property-cards').radius)],
                        ['Sombra do card', shadowToCss(getBlockSettings(draft, 'property-cards').shadow)],
                        ['Raio institucional', radiusToCss(getBlockSettings(draft, 'institutional-pages').radius)],
                        ['Sombra institucional', shadowToCss(getBlockSettings(draft, 'institutional-pages').shadow)]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                          <p className="mt-2 break-all text-sm text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
