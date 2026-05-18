import { api } from './client';
import type { GraphData, Edge, EdgeCreate, Entity } from '@/types';

export const graphApi = {
  get: (worldId: string) =>
    api.get<GraphData>(`/worlds/${worldId}/graph`).then((r) => r.data),
  createEdge: (worldId: string, data: EdgeCreate) =>
    api.post<Edge>(`/worlds/${worldId}/graph/edges`, data).then((r) => r.data),
  deleteEdge: (worldId: string, edgeId: string) =>
    api.delete(`/worlds/${worldId}/graph/edges/${edgeId}`),
  neighbors: (worldId: string, entityId: string, depth = 1) =>
    api
      .get<Entity[]>(`/worlds/${worldId}/graph/neighbors/${entityId}`, { params: { depth } })
      .then((r) => r.data),
  path: (worldId: string, from: string, to: string) =>
    api
      .get<Entity[]>(`/worlds/${worldId}/graph/path`, { params: { from_id: from, to_id: to } })
      .then((r) => r.data),
  conflicts: (worldId: string) =>
    api.get<{ conflicts: string[] }>(`/worlds/${worldId}/graph/conflicts`).then((r) => r.data),
};
