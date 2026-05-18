import { NavLink, useParams } from 'react-router-dom';
import { Home, BookOpen, Network, Users, BarChart2 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useUiStore } from '@/store/uiStore';

export function Sidebar() {
  const { worldId } = useParams<{ worldId?: string }>();
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
      isActive
        ? 'bg-blue-600/10 text-blue-400 font-medium'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200',
    );

  return (
    <aside
      className={cn(
        'bg-slate-900 flex-shrink-0 flex flex-col transition-all duration-200 overflow-hidden',
        sidebarOpen ? 'w-56' : 'w-0',
      )}
    >
      <div className="p-4 border-b border-slate-800">
        <span className="text-lg font-bold text-white tracking-widest">LORE</span>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <NavLink to="/worlds" end className={linkClass}>
          <Home size={16} /> Мої світи
        </NavLink>
        {worldId && (
          <>
            <div className="pt-2 pb-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3">
                Поточний світ
              </p>
            </div>
            <NavLink to={`/worlds/${worldId}`} end className={linkClass}>
              <BookOpen size={16} /> Entities
            </NavLink>
            <NavLink to={`/worlds/${worldId}/graph`} className={linkClass}>
              <Network size={16} /> Граф
            </NavLink>
            <NavLink to={`/worlds/${worldId}/members`} className={linkClass}>
              <Users size={16} /> Члени
            </NavLink>
            <NavLink to={`/worlds/${worldId}/stats`} className={linkClass}>
              <BarChart2 size={16} /> Аналітика
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}
