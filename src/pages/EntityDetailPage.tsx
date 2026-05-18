import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Clock, ArrowLeft, Network, Upload, Plus, Edit, Trash2, Lock, Unlock } from 'lucide-react';
import { entitiesApi } from '@/api/entities';
import { notesApi } from '@/api/notes';
import { graphApi } from '@/api/graph';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import { getApiError } from '@/utils/errorHandler';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { Note } from '@/types';

const noteSchema = z.object({ content: z.string().min(1), is_private: z.boolean().optional() });
type NoteFormData = z.infer<typeof noteSchema>;

export default function EntityDetailPage() {
  const { worldId, entityId } = useParams<{ worldId: string; entityId: string }>();
  const qc = useQueryClient();
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: entity, isLoading } = useQuery({
    queryKey: ['entities', worldId, entityId],
    queryFn: () => entitiesApi.get(worldId!, entityId!),
    enabled: !!worldId && !!entityId,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['notes', worldId, entityId],
    queryFn: () => notesApi.list(worldId!, entityId!),
    enabled: !!worldId && !!entityId,
  });

  const { data: neighbors = [] } = useQuery({
    queryKey: ['graph', 'neighbors', worldId, entityId],
    queryFn: () => graphApi.neighbors(worldId!, entityId!),
    enabled: !!worldId && !!entityId,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: { is_private: false },
  });

  const createNote = useMutation({
    mutationFn: (data: NoteFormData) => notesApi.create(worldId!, entityId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes', worldId, entityId] }); reset(); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const deleteNote = useMutation({
    mutationFn: (noteId: string) => notesApi.delete(worldId!, entityId!, noteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes', worldId, entityId] }),
    onError: (err) => toast.error(getApiError(err)),
  });

  const uploadImage = useMutation({
    mutationFn: (file: File) => entitiesApi.uploadImage(worldId!, entityId!, file),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['entities', worldId, entityId] }); toast.success('Зображення завантажено'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) return <div className="animate-pulse bg-slate-200 h-64 rounded-xl" />;
  if (!entity) return <p className="text-slate-500">Entity не знайдено</p>;

  const properties = Object.entries(entity.properties ?? {});

  return (
    <div className="max-w-3xl">
      <Link to={`/worlds/${worldId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={14} /> Назад до entities
      </Link>

      {entity.image_url ? (
        <img src={entity.image_url} alt={entity.name} className="w-full max-h-48 object-cover rounded-xl mb-4" />
      ) : (
        <div className="w-full h-20 bg-slate-100 rounded-xl mb-4 flex items-center justify-center">
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Завантажити зображення
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage.mutate(f); }}
      />

      <div className="flex items-start gap-3 mb-4">
        <Badge type="entityType" value={entity.entity_type} />
        {entity.image_url && (
          <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} />
          </Button>
        )}
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-2">{entity.name}</h1>
      {entity.description && <p className="text-slate-600 mb-4">{entity.description}</p>}

      {entity.timeline_position && (
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          <Clock size={14} /> {entity.timeline_position}
        </div>
      )}

      {properties.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-3">Властивості</h3>
          <table className="w-full text-sm">
            <tbody>
              {properties.map(([k, v]) => (
                <tr key={k} className="border-b border-slate-50 last:border-0">
                  <td className="py-1.5 pr-4 font-medium text-slate-600 font-mono text-xs">{k}</td>
                  <td className="py-1.5 text-slate-700">{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {neighbors.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Network size={16} /> Зв'язки
          </h3>
          <div className="flex flex-wrap gap-2">
            {neighbors.map((n) => (
              <Link
                key={n.id}
                to={`/worlds/${worldId}/entities/${n.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-sm transition-colors"
              >
                <Badge type="entityType" value={n.entity_type} />
                {n.name}
              </Link>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-slate-700 mb-4">Нотатки</h3>
        <div className="space-y-3 mb-4">
          {notes.map((note: Note) => (
            <NoteItem
              key={note.id}
              note={note}
              worldId={worldId!}
              entityId={entityId!}
              onDelete={() => deleteNote.mutate(note.id)}
            />
          ))}
        </div>
        <form onSubmit={handleSubmit((d) => createNote.mutateAsync(d))} className="space-y-2">
          <Textarea
            placeholder="Додати нотатку..."
            rows={3}
            {...register('content')}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" {...register('is_private')} className="rounded" />
              Приватна
            </label>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              <Plus size={14} /> Додати
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function NoteItem({
  note, worldId, entityId, onDelete,
}: { note: Note; worldId: string; entityId: string; onDelete: () => void }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit } = useForm({ defaultValues: { content: note.content } });

  const update = useMutation({
    mutationFn: (data: { content: string }) => notesApi.update(worldId, entityId, note.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes', worldId, entityId] }); setEditing(false); },
  });

  return (
    <div className="bg-slate-50 rounded-lg p-3">
      {editing ? (
        <form onSubmit={handleSubmit((d) => update.mutateAsync(d))}>
          <textarea
            {...register('content')}
            className="w-full rounded border border-slate-200 px-2 py-1 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
          <div className="flex gap-2 mt-1">
            <Button type="submit" size="sm">Зберегти</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Скасувати</Button>
          </div>
        </form>
      ) : (
        <>
          <p className="text-sm text-slate-700">{note.content}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              {note.is_private ? <Lock size={10} /> : <Unlock size={10} />}
              {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: uk })}
            </span>
            <div className="flex gap-1">
              <button onClick={() => setEditing(true)} className="p-1 text-slate-400 hover:text-blue-500">
                <Edit size={12} />
              </button>
              <button onClick={onDelete} className="p-1 text-slate-400 hover:text-red-500">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
