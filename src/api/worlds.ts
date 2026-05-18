import { api } from './client';
import type { World, WorldCreate, WorldUpdate, WorldStats } from '@/types';

export const worldsApi = {
  list: () => api.get<World[]>('/worlds').then((r) => r.data),
  get: (id: string) => api.get<World>(`/worlds/${id}`).then((r) => r.data),
  create: (data: WorldCreate) => api.post<World>('/worlds', data).then((r) => r.data),
  update: (id: string, data: WorldUpdate) =>
    api.patch<World>(`/worlds/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/worlds/${id}`),
  stats: (id: string) => api.get<WorldStats>(`/worlds/${id}/stats`).then((r) => r.data),
};
