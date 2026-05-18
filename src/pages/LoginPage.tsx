import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getApiError } from '@/utils/errorHandler';

const schema = z.object({
  email: z.string().email('Невірний формат email'),
  password: z.string().min(8, 'Мінімум 8 символів'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const tokens = await authApi.login(data);
      setTokens(tokens);
      navigate('/worlds', { replace: true });
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-black tracking-widest text-white hover:text-blue-400 transition-colors">
            LORE
          </Link>
          <p className="text-slate-500 mt-2 text-sm">World-building platform</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Вхід в акаунт</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              labelClassName="text-slate-200"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Пароль"
              labelClassName="text-slate-200"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" className="w-full justify-center mt-2" isLoading={isSubmitting}>Увійти</Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            Немає акаунту?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Зареєструватись</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
