import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { graphApi } from '../../api/client'
import { useStore } from '../../app/store'
import { Button, EmptyState, Spinner } from '../../shared/ui'
import GraphCanvas from './components/GraphCanvas'
import TimelineView from './components/TimelineView'
import EntityPanel from '../entities/EntityPanel'
import CreateEntityModal from '../entities/CreateEntityModal'
import { ENTITY_COLORS } from '../../app/constants'
import styles from './GraphPage.module.css'

const LEGEND = Object.entries(ENTITY_COLORS)

export default function GraphPage() {
  const { currentWorld, currentView, setCurrentView } = useStore()
  const [entityModal, setEntityModal] = useState(false)
  const fitRef     = useRef(null)
  const zoomInRef  = useRef(null)
  const zoomOutRef = useRef(null)

  const { data: graphData, isLoading } = useQuery({
    queryKey: ['graph', currentWorld?.id],
    queryFn: () => graphApi.get(currentWorld.id),
    enabled: !!currentWorld,
    staleTime: 30_000,
  })

  const { data: conflicts } = useQuery({
    queryKey: ['conflicts', currentWorld?.id],
    queryFn: () => graphApi.conflicts(currentWorld.id),
    enabled: !!currentWorld,
    refetchInterval: 30_000,
  })

  if (!currentWorld) return null

  const nodeCount = graphData?.nodes?.length || 0
  const edgeCount = graphData?.edges?.length || 0

  return (
    <div className={styles.page}>
      {/* Topbar */}
      <div className={styles.topbar}>
        <div>
          <div className={styles.worldName}>{currentWorld.name}</div>
          <div className={styles.worldMeta}>
            {isLoading ? 'Loading…' : `${nodeCount} entities · ${edgeCount} connections`}
          </div>
        </div>
        <div className={styles.topbarSpacer} />
        <div className={styles.topbarActions}>
          {conflicts?.has_conflicts && (
            <div className={styles.conflictBadge}>⚠ Conflict detected</div>
          )}
          <div className={styles.viewTabs}>
            {['graph', 'timeline'].map(v => (
              <button
                key={v}
                className={`${styles.viewTab} ${currentView === v ? styles.active : ''}`}
                onClick={() => setCurrentView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={() => setEntityModal(true)}>+ Entity</Button>
        </div>
      </div>

      {/* Main area */}
      <div className={styles.main}>

        {/* Graph view */}
        {currentView === 'graph' && (
          <div className={styles.graphArea}>
            {isLoading && (
              <div className={styles.graphCenter}><Spinner /></div>
            )}
            {!isLoading && nodeCount === 0 && (
              <div className={styles.graphCenter}>
                <EmptyState
                  icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>}
                  text="Add your first entity to start building the graph"
                  action={<Button variant="primary" size="sm" onClick={() => setEntityModal(true)}>+ Add entity</Button>}
                />
              </div>
            )}
            {!isLoading && nodeCount > 0 && (
              <GraphCanvas
                graphData={graphData}
                onFitRef={fitRef}
                onZoomInRef={zoomInRef}
                onZoomOutRef={zoomOutRef}
              />
            )}

            {/* Toolbar */}
            <div className={styles.toolbar}>
              <button className={styles.toolBtn} onClick={() => fitRef.current?.()} title="Fit view">⊞</button>
              <button className={styles.toolBtn} onClick={() => zoomInRef.current?.()} title="Zoom in">+</button>
              <button className={styles.toolBtn} onClick={() => zoomOutRef.current?.()} title="Zoom out">−</button>
            </div>

            {/* Legend */}
            <div className={styles.legend}>
              {LEGEND.map(([type, color]) => (
                <div key={type} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: color }} />
                  {type}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline view */}
        {currentView === 'timeline' && (
          <div className={styles.timelineArea}>
            <TimelineView graphData={graphData} />
          </div>
        )}

        {/* Entity panel */}
        <EntityPanel graphData={graphData} />
      </div>

      <CreateEntityModal open={entityModal} onClose={() => setEntityModal(false)} />
    </div>
  )
}
