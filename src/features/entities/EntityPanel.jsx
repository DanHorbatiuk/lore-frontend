import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { entitiesApi } from '../../api/client'
import { useStore } from '../../app/store'
import { Badge, Button } from '../../shared/ui'
import { entityColor, ENTITY_COLORS } from '../../app/constants'
import styles from './EntityPanel.module.css'

export default function EntityPanel({ graphData }) {
  const { selectedNode, panelOpen, closePanel, currentWorld } = useStore()
  const qc = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => entitiesApi.delete(currentWorld.id, selectedNode.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['graph', currentWorld.id] })
      closePanel()
      toast.success('Entity deleted')
    },
    onError: () => toast.error('Failed to delete'),
  })

  if (!panelOpen || !selectedNode) return <div className={styles.panel} />

  const n = selectedNode
  const color = entityColor(n.entity_type)
  const props = n.properties || {}
  const edges = graphData?.edges || []
  const nodes = graphData?.nodes || []

  const connections = edges
    .filter(e => e.from_entity_id === n.id || e.to_entity_id === n.id)
    .map(e => {
      const isFrom = e.from_entity_id === n.id
      const otherId = isFrom ? e.to_entity_id : e.from_entity_id
      const other = nodes.find(nd => nd.id === otherId)
      return other ? { edge: e, other, isFrom } : null
    })
    .filter(Boolean)

  return (
    <div className={`${styles.panel} ${styles.open}`}>
      <div className={styles.header}>
        <Badge color={color}>{n.entity_type}</Badge>
        <button className={styles.close} onClick={closePanel}>×</button>
      </div>

      <div className={styles.body}>
        <div className={styles.name}>{n.name}</div>
        {n.description && <p className={styles.desc}>{n.description}</p>}

        {(Object.keys(props).length > 0 || n.timeline_position) && (
          <>
            <div className={styles.sectionTitle}>Properties</div>
            <div className={styles.props}>
              {Object.entries(props).map(([k, v]) => (
                <div key={k} className={styles.prop}>
                  <span className={styles.propKey}>{k}</span>
                  <span className={styles.propVal}>{String(v)}</span>
                </div>
              ))}
              {n.timeline_position && (
                <div className={styles.prop}>
                  <span className={styles.propKey}>timeline</span>
                  <span className={styles.propVal}>{n.timeline_position}</span>
                </div>
              )}
            </div>
          </>
        )}

        {connections.length > 0 && (
          <>
            <div className={styles.sectionTitle}>Connections</div>
            <div className={styles.connections}>
              {connections.map(({ edge, other, isFrom }) => (
                <div key={edge.id} className={styles.conn}>
                  <div className={styles.connDot} style={{ background: ENTITY_COLORS[other.entity_type] }} />
                  <span className={styles.connLabel}>{isFrom ? '→' : '←'} {edge.label}</span>
                  <span className={styles.connName}>{other.name}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.actions}>
          <Button variant="danger" size="sm" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? 'Deleting…' : 'Delete entity'}
          </Button>
        </div>
      </div>
    </div>
  )
}
