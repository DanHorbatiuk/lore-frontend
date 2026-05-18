import { useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Image, Clock, X } from 'lucide-react';
import { entitiesApi } from '@/api/entities';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { getApiError } from '@/utils/errorHandler';
import { useDebounce } from '@/hooks/useDebounce';
import type { Entity, EntityType } from '@/types';
import type { WorldOutletContext } from './WorldDetailPage';

const ENTITY_TYPES: { value: string; label: string }[] = [
  { value: 'character', label: 'Персонаж' },
  { value: 'location',  label: 'Локація' },
  { value: 'event',     label: 'Подія' },
  { value: 'faction',   label: 'Фракція' },
  { value: 'artifact',  label: 'Артефакт' },
  { value: 'chapter',   label: 'Розділ' },
];

const entitySchema = z.object({
  entity_type: z.enum(['character','location','event','faction','artifact','chapter']),
  name: z.string().min(1, "Назва обов'язкова").max(255),
  description: z.string().optional(),
  timeline_position: z.string().optional(),
  properties: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});
type EntityFormData = z.infer<typeof entitySchema>;

function EntityFormModal({
  isOpen, onClose, defaultValues, onSubmit, title,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultValues?: Partial<EntityFormData>;
  onSubmit: (data: EntityFormData) => Promise<void>;
  title: string;
}) {
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm<EntityFormData>({
    resolver: zodResolver(entitySchema),
    defaultValues: { entity_type: 'character', ...defaultValues },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'properties' });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} className="max-w-xl">
      <form onSubmit={handleSubmit(async (data) => { await onSubmit(data); handleClose(); })} className="space-y-4">
        <Select
          label="Тип"
          options={ENTITY_TYPES}
          error={errors.entity_type?.message}
          {...register('entity_type')}
        />
        <Input label="Назва" error={errors.name?.message} {...register('name')} />
        <Textarea label="Опис" rows={3} {...register('description')} />
        <Input label="Позиція на таймлайні" placeholder="Chapter 3 / 1200 AD" {...register('timeline_position')} />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Властивості</label>
          <div className="space-y-2">
            {fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2 items-center">
                <input
                  {...register(`properties.${idx}.key`)}
                  placeholder="Ключ"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  {...register(`properties.${idx}.value`)}
                  placeholder="Значення"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => remove(idx)} className="p-1 text-slate-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => append({ key: '', value: '' })}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            + Додати поле
          </button>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Скасувати</Button>
          <Button type="submit" isLoading={isSubmitting}>Зберегти</Button>
        </div>
      </form>
    </Modal>
  );
}

function EntityCard({
  entity, canEdit, onEdit, onDelete,
}: {
  entity: Entity;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const { worldId } = useParams<{ worldId: string }>();

  return (
    <Card
      className="flex flex-col gap-3"
      onClick={() => navigate(`/worlds/${worldId}/entities/${entity.id}`)}
    >
      {entity.image_url && (
        <img src={entity.image_url} alt={entity.name} className="w-full h-24 object-cover rounded-lg" />
      )}
      <div>
        <div className="flex items-start justify-between gap-2">
          <Badge type="entityType" value={entity.entity_type} />
        </div>
        <h3 className="font-semibold text-slate-800 mt-2">{entity.name}</h3>
        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{entity.description ?? 'Без опису'}</p>
      </div>
      {entity.timeline_position && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Clock size={12} /> {entity.timeline_position}
        </div>
      )}
      {canEdit && (
        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-50">
          <Button
            size="sm" variant="secondary"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
          >
            <Edit size={12} /> Редагувати
          </Button>
          <Button
            size="sm" variant="ghost"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-red-500 hover:bg-red-50"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function EntitiesPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const { userRole } = useOutletContext<WorldOutletContext>();
  const canEdit = userRole !== 'viewer';
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editEntity, setEditEntity] = useState<Entity | null>(null);
  const debouncedSearch = useDebounce(search, 300);

  const useSearch = debouncedSearch.length >= 2 || !!typeFilter;

  const { data: allEntities = [] } = useQuery({
    queryKey: ['entities', worldId],
    queryFn: () => entitiesApi.list(worldId!),
    enabled: !!worldId && !useSearch,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['entities', worldId, 'search', debouncedSearch, typeFilter],
    queryFn: () => entitiesApi.search(worldId!, debouncedSearch, typeFilter || undefined),
    enabled: !!worldId && useSearch,
  });

  const entities = useSearch ? searchResults : allEntities;

  const createMutation = useMutation({
    mutationFn: (data: EntityFormData) =>
      entitiesApi.create(worldId!, {
        entity_type: data.entity_type as EntityType,
        name: data.name,
        description: data.description,
        timeline_position: data.timeline_position,
        properties: Object.fromEntries((data.properties ?? []).filter(p => p.key).map(p => [p.key, p.value])),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['entities', worldId] }); toast.success('Entity створено'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntityFormData }) =>
      entitiesApi.update(worldId!, id, {
        name: data.name,
        description: data.description,
        timeline_position: data.timeline_position,
        properties: Object.fromEntries((data.properties ?? []).filter(p => p.key).map(p => [p.key, p.value])),
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['entities', worldId] }); toast.success('Збережено'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => entitiesApi.delete(worldId!, id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['entities', worldId] }); toast.success('Видалено'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук entities..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400 bg-white"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-slate-400 bg-white"
        >
          <option value="">Всі типи</option>
          {ENTITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {entities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Image size={48} className="text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600">Entities не знайдено</h3>
          <p className="text-slate-400 text-sm mt-1 mb-4">Додайте перший елемент вашого світу</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((e) => (
            <EntityCard
              key={e.id}
              entity={e}
              canEdit={canEdit}
              onEdit={() => setEditEntity(e)}
              onDelete={() => { if (confirm(`Видалити "${e.name}"?`)) deleteMutation.mutate(e.id); }}
            />
          ))}
        </div>
      )}

      {canEdit && (
        <button
          onClick={() => setCreateOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
          title="Додати entity"
        >
          <Plus size={20} />
        </button>
      )}

      <EntityFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Нова entity"
        onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
      />

      {editEntity && (
        <EntityFormModal
          isOpen={!!editEntity}
          onClose={() => setEditEntity(null)}
          title="Редагувати entity"
          defaultValues={{
            entity_type: editEntity.entity_type,
            name: editEntity.name,
            description: editEntity.description ?? '',
            timeline_position: editEntity.timeline_position ?? '',
            properties: Object.entries(editEntity.properties ?? {}).map(([key, value]) => ({ key, value: String(value) })),
          }}
          onSubmit={async (data) => { await updateMutation.mutateAsync({ id: editEntity.id, data }); }}
        />
      )}
    </>
  );
}
