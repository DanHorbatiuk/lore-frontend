import { api } from './client';
import type { WorldStats } from '@/types';

export const statsApi = {
  get: (worldId: string) =>
    api.get<WorldStats>(`/worlds/${worldId}/stats`).then((r) => r.data),
};
