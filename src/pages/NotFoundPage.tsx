import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-slate-300">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mt-2">Сторінку не знайдено</h2>
        <p className="text-slate-500 mt-1 mb-6">Ця сторінка не існує</p>
        <Link to="/"><Button variant="secondary">На головну</Button></Link>
      </div>
    </div>
  );
}
