export type PreparedImage = {
  id: string;
  url: string;
  name: string;
  format: 'webp' | 'jpg' | 'original';
  originalFormat?: 'jpg' | 'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'unknown';
  width?: number;
  height?: number;
  sizeKb: number;
  originalSizeKb?: number;
  optimizedSizeKb?: number;
  thumbnailSizeKb?: number;
  compressionRatio?: number;
};

export type ImagePreparationProgress = {
  percent: number;
  stage: string;
  fileName: string;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível processar a imagem.'));
    };
    image.src = objectUrl;
  });
}

function roundSize(size: number) {
  return Math.max(1, Math.round(size / 1024));
}

function detectOriginalFormat(file: File): PreparedImage['originalFormat'] {
  if (file.type.includes('jpeg')) return 'jpeg';
  if (file.type.includes('jpg')) return 'jpg';
  if (file.type.includes('png')) return 'png';
  if (file.type.includes('webp')) return 'webp';
  if (file.type.includes('gif')) return 'gif';
  if (file.type.includes('avif')) return 'avif';
  return 'unknown';
}

function estimateBase64Size(dataUrl: string) {
  const base64Body = dataUrl.split(',')[1] || '';
  return Math.ceil((base64Body.length * 3) / 4);
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawImageToCanvas(image: HTMLImageElement, width: number, height: number) {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas indisponível.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
  return canvas;
}

export async function prepareImageFile(
  file: File,
  onProgress?: (progress: ImagePreparationProgress) => void
): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`O arquivo ${file.name} não é uma imagem válida.`);
  }

  const report = (percent: number, stage: string) => {
    onProgress?.({ percent, stage, fileName: file.name });
  };

  const originalFormat = detectOriginalFormat(file);
  const originalSizeKb = roundSize(file.size);

  try {
    report(10, 'Lendo arquivo');
    const image = await loadImage(file);

    report(25, 'Analisando dimensões');
    const maxWidth = 1920;
    const maxHeight = 1920;
    const mainRatio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const targetWidth = Math.max(1, Math.round(image.width * mainRatio));
    const targetHeight = Math.max(1, Math.round(image.height * mainRatio));

    report(50, 'Gerando imagem otimizada');
    const mainCanvas = drawImageToCanvas(image, targetWidth, targetHeight);

    let mainDataUrl = '';
    let format: PreparedImage['format'] = 'webp';

    if (originalFormat === 'webp' && mainRatio === 1) {
      mainDataUrl = await readFileAsDataUrl(file);
    } else {
      mainDataUrl = mainCanvas.toDataURL('image/webp', 0.8);
      if (!mainDataUrl.startsWith('data:image/webp')) {
        mainDataUrl = mainCanvas.toDataURL('image/jpeg', 0.82);
        format = mainDataUrl.startsWith('data:image/jpeg') ? 'jpg' : 'original';
      }
    }

    report(75, 'Gerando miniatura');
    const thumbRatio = Math.min(400 / image.width, 1);
    const thumbWidth = Math.max(1, Math.round(image.width * thumbRatio));
    const thumbHeight = Math.max(1, Math.round(image.height * thumbRatio));
    const thumbCanvas = drawImageToCanvas(image, thumbWidth, thumbHeight);
    const thumbDataUrl = thumbCanvas.toDataURL('image/webp', 0.76);

    const optimizedSizeKb = roundSize(estimateBase64Size(mainDataUrl));
    const thumbnailSizeKb = roundSize(estimateBase64Size(thumbDataUrl));
    const compressionRatio = Math.max(0, Math.min(100, Math.round((1 - optimizedSizeKb / Math.max(originalSizeKb, 1)) * 100)));

    report(100, 'Imagem pronta');

    return {
      id: crypto.randomUUID(),
      url: mainDataUrl,
      name: file.name,
      format,
      originalFormat,
      width: targetWidth,
      height: targetHeight,
      sizeKb: optimizedSizeKb,
      originalSizeKb,
      optimizedSizeKb,
      thumbnailSizeKb,
      compressionRatio
    };
  } catch {
    report(100, 'Usando imagem original');
    const originalDataUrl = await readFileAsDataUrl(file);
    return {
      id: crypto.randomUUID(),
      url: originalDataUrl,
      name: file.name,
      format: originalFormat === 'webp' ? 'webp' : 'original',
      originalFormat,
      sizeKb: originalSizeKb,
      originalSizeKb,
      optimizedSizeKb: originalSizeKb,
      thumbnailSizeKb: originalSizeKb,
      compressionRatio: 0
    };
  }
}
