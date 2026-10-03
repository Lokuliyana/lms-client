// services/mediaService.ts
import API from '@/lib/axios';

export type MediaOwnerType = 'class' | 'quiz' | 'answer' | 'enrollment';

export type UploadMediaResponse = {
  success: boolean;
  publicUrl: string;
  filePath: string;
  fileId?: string;
};

type DeleteResp = { success: boolean; message: string };
type SignedUrlResp = { url: string };

const isAxiosError = (e: any): e is { response?: { status: number; data?: any } } =>
  !!e && typeof e === 'object' && 'response' in e;

export const uploadMedia = async (
  file: File,
  ownerType: MediaOwnerType,
  ownerId: string,
  onProgress?: (pct: number) => void
): Promise<UploadMediaResponse> => {
  if (!ownerId) throw new Error('ownerId is required');

  const fd = new FormData();
  fd.append('file', file);
  fd.append('ownerType', ownerType);
  fd.append('ownerId', ownerId);

  try {
    const { data } = await API.post<UploadMediaResponse>('/media/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (!onProgress || !evt.total) return;
        const pct = Math.round((evt.loaded * 100) / evt.total);
        onProgress(pct);
      },
    });
    return data;
  } catch (e) {
    if (isAxiosError(e)) {
      const msg = e.response?.data?.message || `Upload failed (${e.response?.status || 'net'})`;
      throw new Error(msg);
    }
    throw e;
  }
};

export const deleteMedia = async (filePath: string): Promise<boolean> => {
  try {
    const { data } = await API.delete<DeleteResp>('/media/delete', { data: { filePath } });
    return data.success;
  } catch (e) {
    if (isAxiosError(e)) {
      const msg = e.response?.data?.message || `Delete failed (${e.response?.status || 'net'})`;
      throw new Error(msg);
    }
    throw e;
  }
};

export const getSignedUrl = async (filePath: string, ttlSeconds = 3600): Promise<string> => {
  try {
    const { data } = await API.get<SignedUrlResp>('/media/url', {
      params: { filePath, ttl: ttlSeconds },
    });
    return data.url;
  } catch (e) {
    if (isAxiosError(e)) {
      const msg = e.response?.data?.message || `Signed URL failed (${e.response?.status || 'net'})`;
      throw new Error(msg);
    }
    throw e;
  }
};
