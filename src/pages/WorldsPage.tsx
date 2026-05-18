import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Plus, MoreHorizontal, Globe, Lock, Edit, Trash2, Crown, Users } from 'lucide-react';
import { worldsApi } from '@/api/worlds';
import { useAuthStore } from '@/store/authStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { getApiError } from '@/utils/errorHandler';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { World, WorldCreate } from '@/types';

const worldSchema = z.object({
  name: z.string().min(1, "Назва обов'язкова"),
  description: z.string().optional(),
  is_public: z.boolean().optional(),
});
type WorldFormData = z.infer<typeof worldSchema>;

function WorldFormModal({
  isOpen, onClose, defaultValues, onSubmit, title,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultValues?: Partial<WorldFormData>;
  onSubmit: (data: WorldFormData) => Promise<void>;
  title: string;
}) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<WorldFormData>({
    resolver: zodResolver(worldSchema),
    defaultValues,
  });

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <form onSubmit={handleSubmit(async (data) => { await onSubmit(data); handleClose(); })} className="space-y-4">
        <Input label="Назва" error={errors.name?.message} {...register('name')} />
        <Textarea label="Опис" rows={3} {...register('description')} />
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" {...register('is_public')} className="rounded" />
          Публічний світ
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>Скасувати</Button>
          <Button type="submit" isLoading={isSubmitting}>Зберегти</Button>
        </div>
      </form>
    </Modal>
  );
}

function WorldCard({
  world, currentUserId, onEdit, onDelete,
}: {
  world: World;
  currentUserId: string | undefined;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = world.owner_id === currentUserId;

  return (
    <Card className="relative flex flex-col gap-3" onClick={() => navigate(`/worlds/${world.id}`)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 truncate">{world.name}</h3>
            {!isOwner && (
              <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                <Users size={10} /> Учасник
              </span>
            )}
            {isOwner && (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                <Crown size={10} /> Власник
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 line-clamp-2">{world.description ?? 'Без опису'}</p>
        </div>
        {isOwner && (
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 flex-shrink-0"
          >
            <MoreHorizontal size={16} />
          </button>
        )}
        {menuOpen && (
          <div
            className="absolute right-4 top-12 bg-white rounded-xl border border-slate-100 shadow-modal z-10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setMenuOpen(false); onEdit(); }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 w-full"
            >
              <Edit size={14} /> Редагувати
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(); }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
            >
              <Trash2 size={14} /> Видалити
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400 mt-auto pt-2 border-t border-slate-50">
        <span className="flex items-center gap-1">
          {world.is_public ? <Globe size={12} /> : <Lock size={12} />}
          {world.is_public ? 'Публічний' : 'Приватний'}
        </span>
        <span>{formatDistanceToNow(new Date(world.updated_at), { addSuffix: true, locale: uk })}</span>
      </div>
    </Card>
  );
}

export default function WorldsPage() {
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);
  const [editWorld, setEditWorld] = useState<World | null>(null);

  const { data: worlds = [], isLoading } = useQuery({
    queryKey: ['worlds'],
    queryFn: worldsApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: WorldCreate) => worldsApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['worlds'] }); toast.success('Світ створено'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: WorldCreate }) => worldsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['worlds'] }); toast.success('Збережено'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => worldsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['worlds'] }); toast.success('Видалено'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const ownedWorlds = worlds.filter((w) => w.owner_id === currentUser?.id);
  const memberWorlds = worlds.filter((w) => w.owner_id !== currentUser?.id);

  return (
    <>
      <PageHeader
        title="Мої світи"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Створити світ
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : worlds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Globe size={48} className="text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-600">Ще немає жодного світу</h3>
          <p className="text-slate-400 text-sm mt-1 mb-4">Створіть свій перший world-building світ</p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> Створити світ
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {ownedWorlds.length > 0 && (
            <div>
              {memberWorlds.length > 0 && (
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Crown size={13} /> Мої проєкти
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ownedWorlds.map((w) => (
                  <WorldCard
                    key={w.id}
                    world={w}
                    currentUserId={currentUser?.id}
                    onEdit={() => setEditWorld(w)}
                    onDelete={() => {
                      if (confirm(`Видалити світ "${w.name}"?`)) deleteMutation.mutate(w.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {memberWorlds.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Users size={13} /> Запрошені світи
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {memberWorlds.map((w) => (
                  <WorldCard
                    key={w.id}
                    world={w}
                    currentUserId={currentUser?.id}
                    onEdit={() => setEditWorld(w)}
                    onDelete={() => {
                      if (confirm(`Видалити світ "${w.name}"?`)) deleteMutation.mutate(w.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <WorldFormModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Новий світ"
        onSubmit={async (data) => { await createMutation.mutateAsync(data); }}
      />

      {editWorld && (
        <WorldFormModal
          isOpen={!!editWorld}
          onClose={() => setEditWorld(null)}
          title="Редагувати світ"
          defaultValues={{ name: editWorld.name, description: editWorld.description ?? '', is_public: editWorld.is_public }}
          onSubmit={async (data) => { await updateMutation.mutateAsync({ id: editWorld.id, data }); }}
        />
      )}
    </>
  );
}
