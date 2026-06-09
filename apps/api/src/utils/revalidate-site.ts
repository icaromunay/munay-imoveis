import { PropertyCategory } from '@prisma/client';
import { env } from '../config/env.js';

type PropertyPathInput = {
  slug: string;
  category: PropertyCategory;
  approved?: boolean | null;
};

export type RevalidateSiteResult = {
  ok: boolean;
  paths: string[];
  targets: string[];
  attempts: number;
  reason?: 'no-paths' | 'no-targets' | 'frontend-offline';
  warnings: string[];
};

const REVALIDATE_TIMEOUT_MS = 1800;
const MAX_ATTEMPTS = 2;

function getPropertyDetailPath(property: Pick<PropertyPathInput, 'slug' | 'category'>) {
  if (property.category === PropertyCategory.TERRENO) {
    return `/terreno/${property.slug}`;
  }

  if (property.category === PropertyCategory.LOTEAMENTO) {
    return `/loteamento/${property.slug}`;
  }

  return `/imovel/${property.slug}`;
}

function getCategoryListingPaths(category: PropertyCategory) {
  const paths = ['/imoveis'];

  if (category === PropertyCategory.CASA) {
    paths.push('/casas');
  }

  if (category === PropertyCategory.TERRENO) {
    paths.push('/terrenos');
  }

  if (category === PropertyCategory.LOTEAMENTO) {
    paths.push('/empreendimentos');
    paths.push('/lancamentos');
    paths.push('/terrenos');
  }

  return paths;
}

export function buildPropertyRevalidationPaths(...properties: Array<PropertyPathInput | null | undefined>) {
  const paths = new Set<string>(['/', '/imoveis', '/casas', '/terrenos', '/lancamentos', '/empreendimentos', '/sitemap.xml']);

  for (const property of properties) {
    if (!property?.slug) {
      continue;
    }

    paths.add(getPropertyDetailPath(property));

    for (const listingPath of getCategoryListingPaths(property.category)) {
      paths.add(listingPath);
    }
  }

  return [...paths];
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeTarget(candidate?: string | null) {
  const raw = String(candidate || '').trim();
  if (!raw) return '';

  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';

    parsed.pathname = '';
    parsed.search = '';
    parsed.hash = '';

    return parsed.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function getRevalidateTargets() {
  const directCandidates = [env.SITE_URL, env.FRONTEND_URL, env.NEXT_PUBLIC_SITE_URL, ...env.CORS_ORIGINS]
    .map((candidate) => normalizeTarget(candidate))
    .filter(Boolean);

  const targets = new Set<string>(directCandidates);

  for (const target of directCandidates) {
    try {
      const parsed = new URL(target);
      if (parsed.hostname === 'localhost') {
        const ipv4Target = new URL(target);
        ipv4Target.hostname = '127.0.0.1';
        targets.add(ipv4Target.toString().replace(/\/$/, ''));
      }
    } catch {
      // ignore invalid target after normalization guard
    }
  }

  return [...targets];
}

async function postRevalidate(target: string, paths: string[]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REVALIDATE_TIMEOUT_MS);

  try {
    const response = await fetch(new URL('/api/revalidate', `${target}/`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': env.JWT_SECRET
      },
      body: JSON.stringify({ paths }),
      signal: controller.signal
    });

    const details = await response.text().catch(() => 'sem detalhes');
    return {
      ok: response.ok,
      status: response.status,
      details
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function revalidateSitePaths(paths: string[]): Promise<RevalidateSiteResult> {
  const uniquePaths = [...new Set(paths.map((path) => String(path || '').trim()).filter(Boolean))];

  if (!uniquePaths.length) {
    return {
      ok: true,
      paths: [],
      targets: [],
      attempts: 0,
      reason: 'no-paths',
      warnings: []
    };
  }

  const targets = getRevalidateTargets();

  if (!targets.length) {
    const warning = '[revalidate] Nenhum alvo configurado para revalidação.';
    console.warn(warning);
    return {
      ok: false,
      paths: uniquePaths,
      targets: [],
      attempts: 0,
      reason: 'no-targets',
      warnings: [warning]
    };
  }

  const warnings: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    for (const target of targets) {
      try {
        const startedAt = Date.now();
        const result = await postRevalidate(target, uniquePaths);
        const duration = Date.now() - startedAt;

        if (result.ok) {
          console.info(
            `[revalidate] sucesso target=${target} attempt=${attempt}/${MAX_ATTEMPTS} paths=${uniquePaths.length} duration=${duration}ms`
          );
          return {
            ok: true,
            paths: uniquePaths,
            targets,
            attempts: attempt,
            warnings
          };
        }

        const warning = `[revalidate] falha target=${target} attempt=${attempt}/${MAX_ATTEMPTS} status=${result.status} duration=${duration}ms details=${result.details}`;
        warnings.push(warning);
        console.warn(warning);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        const warning = `[revalidate] frontend indisponível target=${target} attempt=${attempt}/${MAX_ATTEMPTS} reason=${reason}`;
        warnings.push(warning);
        console.warn(warning);
      }
    }

    if (attempt < MAX_ATTEMPTS) {
      await wait(450);
    }
  }

  console.warn('[revalidate] Revalidação ignorada porque o frontend está offline. A operação principal continuará sem bloqueio.');

  return {
    ok: false,
    paths: uniquePaths,
    targets,
    attempts: MAX_ATTEMPTS,
    reason: 'frontend-offline',
    warnings
  };
}
