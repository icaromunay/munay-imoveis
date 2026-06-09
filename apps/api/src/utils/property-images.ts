import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

type ImageItem = {
  url: string;
  alt?: string;
};

const uploadsRoot = fileURLToPath(new URL('../../../web/public/uploads/properties/', import.meta.url));

function getInputBuffer(value: string) {
  const match = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s);

  if (!match) {
    throw new Error('Formato de imagem inválido.');
  }

  const [, mimeType, base64Body] = match;
  return {
    mimeType,
    buffer: Buffer.from(base64Body, 'base64')
  };
}

function buildTargetPaths() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const targetDir = path.join(uploadsRoot, year, month);
  const baseName = `${Date.now()}-${randomUUID()}`;

  return {
    year,
    month,
    targetDir,
    mainFileName: `${baseName}.webp`,
    thumbFileName: `${baseName}-thumb.webp`
  };
}

async function optimizeAndPersistImageData(value: string) {
  const { mimeType, buffer } = getInputBuffer(value);
  const { year, month, targetDir, mainFileName, thumbFileName } = buildTargetPaths();
  const mainPath = path.join(targetDir, mainFileName);
  const thumbPath = path.join(targetDir, thumbFileName);

  await mkdir(targetDir, { recursive: true });

  const image = sharp(buffer, { failOn: 'none' }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width || 1920;
  const targetMainWidth = Math.min(width, 1920);
  const targetThumbWidth = Math.min(width, 400);
  const shouldPreserveOriginalWebp = mimeType.includes('webp') && width <= 1920;

  const mainBuffer = shouldPreserveOriginalWebp
    ? buffer
    : await image
        .clone()
        .resize({ width: targetMainWidth, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();

  const thumbBuffer = await image
    .clone()
    .resize({ width: targetThumbWidth, withoutEnlargement: true, fit: 'inside' })
    .webp({ quality: 76, effort: 4 })
    .toBuffer();

  await Promise.all([writeFile(mainPath, mainBuffer), writeFile(thumbPath, thumbBuffer)]);

  return `/uploads/properties/${year}/${month}/${mainFileName}`;
}

export async function persistImageValue(value?: string | null) {
  if (!value || !value.startsWith('data:image/')) {
    return value || null;
  }

  return optimizeAndPersistImageData(value);
}

export async function persistPropertyImages(images: ImageItem[]) {
  const persisted = await Promise.all(
    images.map(async (image) => ({
      ...image,
      url: (await persistImageValue(image.url)) || image.url
    }))
  );

  return persisted;
}
