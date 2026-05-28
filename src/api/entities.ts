import { api } from './client';
import type { Entity, EntityCreate, EntityUpdate } from '@/types';

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
      .replace('http://minio:9000', 'http://localhost:9000')
      .replace('https://minio:9000', 'http://localhost:9000');
  }
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
  const full = base + (url.startsWith('/') ? url : '/' + url);
  return full.replace('http://minio:9000', 'http://localhost:9000');
}

export const entitiesApi = {
  list: (worldId: string) =>
    api.get<Entity[]>(`/worlds/${worldId}/entities`).then((r) => r.data),
  search: (worldId: string, q: string, entityType?: string) =>
    api
      .get<Entity[]>(`/worlds/${worldId}/entities/search`, {
        params: { q, ...(entityType ? { entity_type: entityType } : {}) },
      })
      .then((r) => r.data),
  get: (worldId: string, id: string) =>
    api.get<Entity>(`/worlds/${worldId}/entities/${id}`).then((r) => r.data),
  create: (worldId: string, data: EntityCreate) =>
    api.post<Entity>(`/worlds/${worldId}/entities`, data).then((r) => r.data),
  update: (worldId: string, id: string, data: EntityUpdate) =>
    api.patch<Entity>(`/worlds/${worldId}/entities/${id}`, data).then((r) => r.data),
  delete: (worldId: string, id: string) =>
    api.delete(`/worlds/${worldId}/entities/${id}`),
  uploadImage: (worldId: string, id: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api
      .post<{ image_url: string }>(`/worlds/${worldId}/entities/${id}/upload-image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
