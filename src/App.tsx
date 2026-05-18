import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './router';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api/client';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function AppBootstrap() {
  const { accessToken, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (!accessToken) return;
    api
      .get('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => logout());
  }, [accessToken, setUser, logout]);

  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppBootstrap />
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#F1F5F9',
            border: '1px solid #334155',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 13,
          },
          success: { iconTheme: { primary: '#16A34A', secondary: '#1E293B' } },
          error: { iconTheme: { primary: '#DC2626', secondary: '#1E293B' } },
        }}
      />
    </QueryClientProvider>
  );
}
