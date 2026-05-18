import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { worldsApi } from '@/api/worlds';
import { cn } from '@/utils/cn';
import type { World } from '@/types';

export default function WorldDetailPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const { data: world } = useQuery({
    queryKey: ['worlds', worldId],
    queryFn: () => worldsApi.get(worldId!),
    enabled: !!worldId,
  });

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
      isActive
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-slate-500 hover:text-slate-700',
    );

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{world?.name ?? '...'}</h1>
        {world?.description && (
          <p className="text-slate-500 text-sm mt-1">{world.description}</p>
        )}
      </div>
      <nav className="flex border-b border-slate-200 mb-6">
        <NavLink to={`/worlds/${worldId}`} end className={tabClass}>Entities</NavLink>
        <NavLink to={`/worlds/${worldId}/graph`} className={tabClass}>Граф</NavLink>
        <NavLink to={`/worlds/${worldId}/members`} className={tabClass}>Члени</NavLink>
        <NavLink to={`/worlds/${worldId}/stats`} className={tabClass}>Аналітика</NavLink>
      </nav>
      <div className="flex-1 overflow-y-auto">
        <Outlet context={{ world } satisfies { world: World | undefined }} />
      </div>
    </div>
  );
}
