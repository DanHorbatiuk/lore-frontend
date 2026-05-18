import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Navigate } from 'react-router-dom';
import { BookOpen, Network, Users, BarChart2, Globe, Scroll, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken) return <Navigate to="/worlds" replace />;

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-widest text-white">LORE</span>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            Увійти
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium"
          >
            Розпочати
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-32 max-w-4xl mx-auto">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-900/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] rounded-full bg-indigo-900/15 blur-3xl" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-700/40 text-blue-300 text-xs font-medium mb-6 tracking-wide">
          <Sparkles size={12} />
          Платформа для world-building
        </div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-tight">
          Твій світ.<br />Твоя легенда.
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mb-10 leading-relaxed">
          LORE — це простір для творців: будуй всесвіти, керуй персонажами, відстежуй зв'язки та ділись своїм світом з командою.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/register"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-base transition-colors shadow-lg shadow-blue-900/40"
          >
            Створити безкоштовно
          </Link>
          <Link
            to="/login"
            className="px-8 py-3 border border-slate-700 hover:border-slate-500 rounded-xl font-semibold text-base text-slate-300 hover:text-white transition-colors"
          >
            Увійти в акаунт
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-center text-3xl font-bold mb-14 text-slate-100">
          Все для твоєї творчості
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <Scroll size={22} />, title: 'Entities', desc: 'Персонажі, локації, події, фракції — структуруй кожен елемент свого світу.', color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/30' },
            { icon: <Network size={22} />, title: "Граф зв'язків", desc: 'Візуалізуй відносини між елементами у вигляді інтерактивного графу.', color: 'text-blue-400', bg: 'bg-blue-900/20 border-blue-800/30' },
            { icon: <Users size={22} />, title: 'Співпраця', desc: 'Запрошуй авторів, редакторів і глядачів — разом будуйте більші всесвіти.', color: 'text-purple-400', bg: 'bg-purple-900/20 border-purple-800/30' },
            { icon: <BarChart2 size={22} />, title: 'Аналітика', desc: "Відстежуй активність, найпов'язаніші вузли та розвиток свого світу.", color: 'text-emerald-400', bg: 'bg-emerald-900/20 border-emerald-800/30' },
          ].map((f) => (
            <div key={f.title} className={`rounded-2xl border p-6 flex flex-col gap-3 ${f.bg}`}>
              <div className={f.color}>{f.icon}</div>
              <h3 className="font-semibold text-slate-100">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12">
          <Globe size={40} className="mx-auto text-blue-400 mb-4" />
          <h2 className="text-3xl font-bold mb-3 text-white">Готовий почати?</h2>
          <p className="text-slate-400 mb-8">Реєстрація безкоштовна. Твій перший всесвіт чекає.</p>
          <Link to="/register" className="inline-block px-10 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-semibold text-base transition-colors">
            Створити акаунт
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        LORE — World-building platform
      </footer>
    </div>
  );
}
