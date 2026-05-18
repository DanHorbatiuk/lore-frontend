import axios from 'axios';

export function getApiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d: { msg?: string }) => d.msg).join(', ');
    return 'Невідома помилка';
  }
  return 'Щось пішло не так';
}
