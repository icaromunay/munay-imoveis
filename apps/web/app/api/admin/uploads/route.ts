import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { requireAdminRoute } from '@/lib/admin-route';

const uploadSchema = z.object({
  dataUrl: z.string().trim().min(20, 'Imagem inválida.'),
  fileName: z.string().trim().min(1).default('imagem'),
  folder: z.enum(['blog-cover', 'editor', 'property-description', 'property-gallery']).default('editor'),
  width: z.coerce.number().int().positive().optional(),
  height: z.coerce.number().int().positive().optional()
});

const mimeToExtension: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

function sanitizeBaseName(fileName: string) {
  const name = fileName.replace(/\.[a-z0-9]+$/i, '');
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return normalized || 'imagem';
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Formato de imagem inválido.');
  }

  const [, mimeType, base64Payload] = match;
  const extension = mimeToExtension[mimeType.toLowerCase()];

  if (!extension) {
    throw new Error('Formato não suportado. Use JPG, PNG ou WEBP.');
  }

  return {
    mimeType: mimeType.toLowerCase(),
    extension,
    buffer: Buffer.from(base64Payload, 'base64')
  };
}

function resolveUploadsDirectories() {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, 'public'),
    path.join(cwd, 'apps', 'web', 'public'),
    path.join(cwd, '.next', 'standalone', 'apps', 'web', 'public'),
    path.join(cwd, 'standalone', 'apps', 'web', 'public')
  ];

  return Array.from(new Set(candidates));
}

export async function POST(request: Request) {
  const auth = await requireAdminRoute();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = uploadSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors).flat()[0] || 'Dados inválidos.';
      return jsonResponse({ message: firstError }, 400);
    }

    const { dataUrl, fileName, folder, width, height } = parsed.data;
    const { mimeType, extension, buffer } = parseDataUrl(dataUrl);
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const publicRoots = resolveUploadsDirectories();
    const safeBaseName = sanitizeBaseName(fileName);
    const finalFileName = `${Date.now()}-${crypto.randomUUID()}-${safeBaseName}.${extension}`;
    const storageFolder = folder === 'property-gallery' ? 'properties' : folder;
    const publicUrl = `/api/uploads/${storageFolder}/${year}/${month}/${finalFileName}`;

    await Promise.all(
      publicRoots.map(async (publicRoot) => {
        const targetDirectory = path.join(publicRoot, 'uploads', storageFolder, year, month);
        const diskPath = path.join(targetDirectory, finalFileName);
        await mkdir(targetDirectory, { recursive: true });
        await writeFile(diskPath, buffer);
      })
    );

    return jsonResponse({
      url: publicUrl,
      fileName: finalFileName,
      contentType: mimeType,
      width,
      height
    });
  } catch (error) {
    return jsonResponse(
      {
        message: error instanceof Error ? error.message : 'Não foi possível salvar a imagem.'
      },
      400
    );
  }
}
