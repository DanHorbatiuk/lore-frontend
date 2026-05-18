import { api } from './client';
import type { User, TokenOut } from '@/types';

export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post<User>('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<TokenOut>('/auth/login', data).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
  refresh: (refresh_token: string) =>
    api.post<TokenOut>('/auth/refresh', { refresh_token }).then((r) => r.data),
};
