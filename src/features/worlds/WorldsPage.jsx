import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { worldsApi } from '../../api/client'
import { useStore } from '../../app/store'
import { Button, Modal, Input, Textarea, Spinner, EmptyState } from '../../shared/ui'
import styles from './WorldsPage.module.css'

function WorldCard({ world, isActive, onClick }) {
  return (
    <div className={`${styles.card} ${isActive ? styles.activeCard : ''} fade-up`} onClick={onClick}>
      <div className={styles.cardIcon}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary-l)" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>
        </svg>
      </div>
      <div className={styles.cardName}>{world.name}</div>
      <div className={styles.cardDesc}>{world.description || 'No description yet'}</div>
      <div className={styles.cardMeta}>
        <span>{new Date(world.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

export default function WorldsPage({ onSelectWorld }) {
  const qc = useQueryClient()
  const { currentWorld } = useStore()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const { data: worlds = [], isLoading } = useQuery({
    queryKey: ['worlds'],
    queryFn: worldsApi.list,
  })

  const createMutation = useMutation({
    mutationFn: () => worldsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['worlds'] })
      setModal(false)
      setForm({ name: '', description: '' })
      toast.success('World created')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create world'),
  })

  if (isLoading) return <div className={styles.page}><Spinner /></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Worlds</h1>
          <p className={styles.subtitle}>Every story begins with a world</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setModal(true)}>+ New World</Button>
      </div>

      {worlds.length === 0 ? (
        <EmptyState
          icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></svg>}
          text="No worlds yet — create your first one"
          action={<Button variant="primary" size="sm" onClick={() => setModal(true)}>+ New World</Button>}
        />
      ) : (
        <div className={styles.grid}>
          {worlds.map(w => (
            <WorldCard key={w.id} world={w} isActive={currentWorld?.id === w.id} onClick={() => onSelectWorld(w)} />
          ))}
          <div className={`${styles.card} ${styles.addCard}`} onClick={() => setModal(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>Create a world</span>
          </div>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New World">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input label="World name" value={form.name} onChange={set('name')} placeholder="Middle Earth, Westeros…" />
          <Textarea label="Description" value={form.description} onChange={set('description')} rows={3} placeholder="A brief description of your world…" />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <Button variant="ghost" size="sm" onClick={() => setModal(false)}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create World'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
