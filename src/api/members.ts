import { api } from './client';
import type { WorldMember, MemberInvite, MemberRoleUpdate } from '@/types';

export const membersApi = {
  list: (worldId: string) =>
    api.get<WorldMember[]>(`/worlds/${worldId}/members`).then((r) => r.data),
  invite: (worldId: string, data: MemberInvite) =>
    api.post<WorldMember>(`/worlds/${worldId}/members`, data).then((r) => r.data),
  updateRole: (worldId: string, userId: string, data: MemberRoleUpdate) =>
    api.patch<WorldMember>(`/worlds/${worldId}/members/${userId}`, data).then((r) => r.data),
  remove: (worldId: string, userId: string) =>
    api.delete(`/worlds/${worldId}/members/${userId}`),
};
