import { invoiceSchema, type Invoice } from '@/lib/api/schemas';
import { ApiError } from '@/lib/api/api-error';
import { requestWithSchema } from '@/lib/api/http-client';

interface UploadOptions {
  onProgress?: (percent: number) => void;
}

export async function uploadInvoice(file: File, options?: UploadOptions): Promise<Invoice> {
  const isPdfByMime = file.type.toLowerCase().includes('pdf');
  const isPdfByExtension = file.name.toLowerCase().endsWith('.pdf');

  if (!isPdfByMime && !isPdfByExtension) {
    throw new ApiError('Selecione um arquivo PDF valido.', 400);
  }

  const formData = new FormData();
  formData.append('file', file);

  return requestWithSchema(
    {
      method: 'POST',
      url: '/invoices/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (event) => {
        if (!event.total || !options?.onProgress) {
          return;
        }

        const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
        options.onProgress(percent);
      },
    },
    (payload) => {
      const parsed = invoiceSchema.safeParse(payload);
      if (!parsed.success) {
        throw new ApiError('Backend retornou payload invalido para upload.', 502, parsed.error);
      }
      return parsed.data;
    },
  );
}
