import { prepareImageFile } from '@/lib/image-upload';

export type AdminMediaFolder = 'blog-cover' | 'editor' | 'property-description';

export type UploadedAdminImage = {
  url: string;
  fileName: string;
  contentType: string;
  width?: number;
  height?: number;
};

async function postAdminImageUpload(payload: {
  dataUrl: string;
  fileName: string;
  folder: AdminMediaFolder;
  width?: number;
  height?: number;
}) {
  const response = await fetch('/api/admin/uploads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    cache: 'no-store',
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.url) {
    throw new Error(data?.message || 'Não foi possível enviar a imagem para a biblioteca interna.');
  }

  return data as UploadedAdminImage;
}

export async function uploadPreparedAdminImage(prepared: {
  url: string;
  name: string;
  width?: number;
  height?: number;
}, folder: AdminMediaFolder) {
  return postAdminImageUpload({
    dataUrl: prepared.url,
    fileName: prepared.name,
    folder,
    width: prepared.width,
    height: prepared.height
  });
}

export async function prepareAndUploadAdminImage(file: File, folder: AdminMediaFolder) {
  const prepared = await prepareImageFile(file);
  return uploadPreparedAdminImage(prepared, folder);
}
