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

const schema = z
  .object({
    email: z.string().email('Невірний формат email'),
    username: z.string().min(3, 'Мінімум 3 символи'),
    password: z.string().min(8, 'Мінімум 8 символів'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  });
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setTokens } = useAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, username, password }: FormData) => {
    try {
      await authApi.register({ email, username, password });
      const tokens = await authApi.login({ email, password });
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
          <p className="text-slate-500 mt-2 text-sm">Створіть свій акаунт</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-white mb-6">Реєстрація</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" labelClassName="text-slate-200" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Ім'я користувача" labelClassName="text-slate-200" placeholder="username" error={errors.username?.message} {...register('username')} />
            <Input label="Пароль" labelClassName="text-slate-200" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            <Input label="Підтвердити пароль" labelClassName="text-slate-200" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" className="w-full justify-center mt-2" isLoading={isSubmitting}>Зареєструватись</Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            Вже є акаунт?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Увійти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
