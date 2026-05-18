import { cn } from '@/utils/cn';
import type { EntityType, MemberRole } from '@/types';

const roleClasses: Record<MemberRole, string> = {
  viewer: 'bg-green-100 text-green-700 border-green-200',
  editor: 'bg-amber-100 text-amber-700 border-amber-200',
  admin:  'bg-violet-100 text-violet-700 border-violet-200',
};

const entityTypeClasses: Record<EntityType, string> = {
  character: 'bg-blue-100 text-blue-700',
  location:  'bg-emerald-100 text-emerald-700',
  event:     'bg-orange-100 text-orange-700',
  faction:   'bg-purple-100 text-purple-700',
  artifact:  'bg-yellow-100 text-yellow-700',
  chapter:   'bg-slate-100 text-slate-700',
};

interface BadgeProps {
  type: 'role' | 'entityType';
  value: MemberRole | EntityType;
  className?: string;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  viewer: 'Viewer', editor: 'Editor', admin: 'Admin',
};

const ENTITY_LABELS: Record<EntityType, string> = {
  character: 'Персонаж', location: 'Локація', event: 'Подія',
  faction: 'Фракція', artifact: 'Артефакт', chapter: 'Розділ',
};

export function Badge({ type, value, className }: BadgeProps) {
  const cls =
    type === 'role'
      ? roleClasses[value as MemberRole]
      : entityTypeClasses[value as EntityType];
  const label =
    type === 'role' ? ROLE_LABELS[value as MemberRole] : ENTITY_LABELS[value as EntityType];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        cls,
        className,
      )}
    >
      {label}
    </span>
  );
}
