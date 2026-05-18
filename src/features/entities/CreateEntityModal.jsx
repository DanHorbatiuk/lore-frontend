import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { entitiesApi } from '../../api/client'
import { useStore } from '../../app/store'
import { Modal, Input, Textarea, Button } from '../../shared/ui'
import { ENTITY_TYPES, entityColor } from '../../app/constants'
import styles from './CreateEntityModal.module.css'

export default function CreateEntityModal({ open, onClose }) {
  const qc = useQueryClient()
  const { currentWorld } = useStore()
  const [form, setForm] = useState({ entity_type: 'character', name: '', description: '', timeline_position: '', properties: '{}' })
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const mutation = useMutation({
    mutationFn: () => {
      let properties = {}
      try { properties = JSON.parse(form.properties) } catch {}
      return entitiesApi.create(currentWorld.id, {
        entity_type: form.entity_type,
        name: form.name,
        description: form.description,
        timeline_position: form.timeline_position || null,
        properties,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['graph', currentWorld.id] })
      onClose()
      setForm({ entity_type: 'character', name: '', description: '', timeline_position: '', properties: '{}' })
      toast.success('Entity added')
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to create'),
  })

  return (
    <Modal open={open} onClose={onClose} title="New Entity">
      <div className={styles.form}>
        <div>
          <div className={styles.label}>Type</div>
          <div className={styles.typeGrid}>
            {ENTITY_TYPES.map(type => {
              const color = entityColor(type)
              const selected = form.entity_type === type
              return (
                <button
                  key={type}
                  className={`${styles.typeBtn} ${selected ? styles.selected : ''}`}
                  style={selected ? { color, borderColor: color, background: color + '18' } : {}}
                  onClick={() => setForm(f => ({ ...f, entity_type: type }))}
                >
                  {type}
                </button>
              )
            })}
          </div>
        </div>

        <Input label="Name" value={form.name} onChange={set('name')} placeholder="Entity name…" />
        <Textarea label="Description" value={form.description} onChange={set('description')} rows={2} placeholder="Brief description…" />
        <Input label="Timeline position" value={form.timeline_position} onChange={set('timeline_position')} placeholder="Year 3001, Chapter 4…" />
        <div>
          <div className={styles.label}>Properties (JSON)</div>
          <textarea
            value={form.properties}
            onChange={set('properties')}
            rows={3}
            placeholder='{"race": "hobbit", "age": 50}'
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'none' }}
          />
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={() => mutation.mutate()} disabled={!form.name || mutation.isPending}>
            {mutation.isPending ? 'Adding…' : 'Add Entity'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
