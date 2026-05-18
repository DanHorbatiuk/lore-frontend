import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const token = useAuthStore.getState().accessToken;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      const refresh = useAuthStore.getState().refreshToken;
      if (!refresh) {
        useAuthStore.getState().logout();
        return Promise.reject(err);
      }
      try {
        const { data } = await axios.post(
          (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + '/api/v1/auth/refresh',
          { refresh_token: refresh },
        );
        useAuthStore.getState().setTokens(data);
        err.config.headers.Authorization = `Bearer ${data.access_token}`;
        return api(err.config);
      } catch {
        useAuthStore.getState().logout();
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  },
);
