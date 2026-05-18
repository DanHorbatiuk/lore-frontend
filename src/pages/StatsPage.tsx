import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Network, Users, Calendar, AlertTriangle, Trophy } from 'lucide-react';
import { statsApi } from '@/api/stats';
import { graphApi } from '@/api/graph';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

const ENTITY_TYPE_LABELS: Record<string, string> = {
  character: 'Персонажі', location: 'Локації', event: 'Події',
  faction: 'Фракції', artifact: 'Артефакти', chapter: 'Розділи',
};

const ENTITY_TYPE_COLORS: Record<string, string> = {
  character: 'bg-blue-500', location: 'bg-emerald-500', event: 'bg-orange-500',
  faction: 'bg-purple-500', artifact: 'bg-yellow-500', chapter: 'bg-slate-500',
};

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </Card>
  );
}

export default function StatsPage() {
  const { worldId } = useParams<{ worldId: string }>();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats', worldId],
    queryFn: () => statsApi.get(worldId!),
    enabled: !!worldId,
  });

  const { data: conflictsData } = useQuery({
    queryKey: ['conflicts', worldId],
    queryFn: () => graphApi.conflicts(worldId!),
    enabled: !!worldId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!stats) return null;

  const maxCount = Math.max(...(stats.entities_by_type?.map((e) => e.count) ?? [1]), 1);
  const conflicts = conflictsData?.conflicts ?? [];

  return (
    <>
      <PageHeader title="Аналітика" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Entities"  value={stats.total_entities} icon={BookOpen}  color="bg-blue-600" />
        <KpiCard label="Зв'язки"   value={stats.total_edges}    icon={Network}   color="bg-indigo-600" />
        <KpiCard label="Учасники"  value={stats.total_members}  icon={Users}     color="bg-emerald-600" />
        <KpiCard label="Події"     value={stats.total_events}   icon={Calendar}  color="bg-orange-600" />
      </div>

      {stats.entities_by_type && stats.entities_by_type.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-4">Entities за типами</h3>
          <div className="space-y-3">
            {stats.entities_by_type.map((row) => (
              <div key={row.entity_type} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-24 flex-shrink-0">
                  {ENTITY_TYPE_LABELS[row.entity_type] ?? row.entity_type}
                </span>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${ENTITY_TYPE_COLORS[row.entity_type] ?? 'bg-slate-400'}`}
                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-slate-700 w-6 text-right">{row.count}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.last_activity_at && (
          <Card>
            <h3 className="font-semibold text-slate-700 mb-2">Остання активність</h3>
            <p className="text-slate-500 text-sm">
              {formatDistanceToNow(new Date(stats.last_activity_at), { addSuffix: true, locale: uk })}
            </p>
          </Card>
        )}

        {stats.most_connected && (
          <Card>
            <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <Trophy size={16} className="text-yellow-500" /> Найпов'язаніша entity
            </h3>
            <Link
              to={`/worlds/${worldId}/entities/${stats.most_connected}`}
              className="text-blue-600 hover:underline text-sm"
            >
              Переглянути entity
            </Link>
          </Card>
        )}
      </div>

      {conflicts.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              Знайдено {conflicts.length} конфлікт{conflicts.length === 1 ? '' : 'ів'} у графі
            </p>
            <Link to={`/worlds/${worldId}/graph`} className="text-amber-700 hover:underline text-sm">
              Переглянути у графі
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
