import { useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UserPlus, Trash2, Crown } from 'lucide-react';
import { membersApi } from '@/api/members';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input, Select } from '@/components/ui/Input';
import { getApiError } from '@/utils/errorHandler';
import { useAuthStore } from '@/store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import type { MemberRole, WorldMember } from '@/types';
import type { WorldOutletContext } from './WorldDetailPage';

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
];

const inviteSchema = z.object({
  email: z.string().email('Невірний email'),
  role: z.enum(['viewer', 'editor', 'admin']),
});
type InviteFormData = z.infer<typeof inviteSchema>;

export default function MembersPage() {
  const { worldId } = useParams<{ worldId: string }>();
  const { world, userRole } = useOutletContext<WorldOutletContext>();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const [inviteOpen, setInviteOpen] = useState(false);

  const { data: members = [] } = useQuery<WorldMember[]>({
    queryKey: ['members', worldId],
    queryFn: () => membersApi.list(worldId!),
    enabled: !!worldId,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'viewer' },
  });

  const inviteMutation = useMutation({
    mutationFn: (data: InviteFormData) => membersApi.invite(worldId!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members', worldId] }); toast.success('Запрошено'); setInviteOpen(false); reset(); },
    onError: (err) => toast.error(getApiError(err)),
  });
  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: MemberRole }) => membersApi.updateRole(worldId!, userId, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', worldId] }),
    onError: (err) => toast.error(getApiError(err)),
  });
  const removeMember = useMutation({
    mutationFn: (userId: string) => membersApi.remove(worldId!, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['members', worldId] }); toast.success('Видалено'); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const isOwner = userRole === 'owner';
  const canManage = userRole === 'owner' || userRole === 'admin';
  const ownerName = isOwner ? (currentUser?.username ?? world?.owner_id) : world?.owner_id;
  const ownerEmail = isOwner ? currentUser?.email : undefined;
  const ownerInitial = String(ownerName ?? '?')[0].toUpperCase();

  return (
    <>
      <PageHeader title="Учасники" action={canManage ? <Button onClick={() => setInviteOpen(true)}><UserPlus size={16} /> Запросити</Button> : undefined} />
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="px-4 py-3 text-left font-medium text-slate-600">Користувач</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Роль</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Запрошено</th>
              {canManage && <th className="px-4 py-3 text-left font-medium text-slate-600">Дії</th>}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-50 bg-amber-50/40">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">{ownerInitial}</div>
                  <div>
                    <p className="font-medium text-slate-800 flex items-center gap-1.5">
                      {isOwner ? currentUser?.username : <span className="text-slate-500 font-normal text-xs">{String(world?.owner_id ?? '').slice(0, 8)}…</span>}
                      {isOwner && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Ви</span>}
                    </p>
                    {ownerEmail && <p className="text-xs text-slate-400">{ownerEmail}</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700"><Crown size={10} /> Власник</span>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">—</td>
              {canManage && <td className="px-4 py-3" />}
            </tr>
            {members.map((m) => {
              const isMe = m.user_id === currentUser?.id;
              const displayName = m.user?.username ?? m.user_id;
              return (
                <tr key={m.user_id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold uppercase">{String(displayName)[0]}</div>
                      <div>
                        <p className="font-medium text-slate-800 flex items-center gap-1.5">
                          {displayName}
                          {isMe && <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Ви</span>}
                        </p>
                        {m.user?.email && <p className="text-xs text-slate-400">{m.user.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {canManage && !isMe ? (
                      <select value={m.role} onChange={(e) => updateRole.mutate({ userId: m.user_id, role: e.target.value as MemberRole })} className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:border-slate-400 bg-white">
                        {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <Badge type="role" value={m.role} />
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{formatDistanceToNow(new Date(m.invited_at), { addSuffix: true, locale: uk })}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      {!isMe && (
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => { if (confirm('Видалити учасника?')) removeMember.mutate(m.user_id); }}>
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal isOpen={inviteOpen} onClose={() => setInviteOpen(false)} title="Запросити учасника">
        <form onSubmit={handleSubmit((d) => inviteMutation.mutateAsync(d))} className="space-y-4">
          <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
          <Select label="Роль" options={ROLE_OPTIONS} error={errors.role?.message} {...register('role')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)}>Скасувати</Button>
            <Button type="submit" isLoading={isSubmitting}>Запросити</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
