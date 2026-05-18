import { useStore } from '../../../app/store'
import { entityColor, ENTITY_COLORS } from '../../../app/constants'
import { EmptyState } from '../../../shared/ui'
import styles from './TimelineView.module.css'

export default function TimelineView({ graphData }) {
  const { selectNode } = useStore()
  if (!graphData) return null

  const events = graphData.nodes
    .filter(n => n.entity_type === 'event' && n.timeline_position)
    .sort((a, b) => a.timeline_position.localeCompare(b.timeline_position))

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>}
        text="No dated events yet — add Event entities with a timeline position"
      />
    )
  }

  return (
    <div className={styles.wrap}>
      {events.map(ev => {
        const chars = graphData.edges
          .filter(e => e.to_entity_id === ev.id || e.from_entity_id === ev.id)
          .map(e => graphData.nodes.find(n =>
            n.id === (e.to_entity_id === ev.id ? e.from_entity_id : e.to_entity_id)
          ))
          .filter(n => n?.entity_type === 'character')

        return (
          <div key={ev.id} className={styles.row}>
            <div className={styles.timeLabel}>{ev.timeline_position}</div>
            <div className={styles.line}>
              <div className={styles.dot} style={{ borderColor: entityColor('event') }} />
            </div>
            <div className={styles.content}>
              <div
                className={styles.event}
                style={{ background: ENTITY_COLORS.event + '18', color: ENTITY_COLORS.event }}
                onClick={() => selectNode(ev)}
              >
                {ev.name}
              </div>
              {ev.description && <p className={styles.eventDesc}>{ev.description}</p>}
              {chars.length > 0 && (
                <div className={styles.chars}>
                  {chars.map(c => (
                    <div key={c.id} className={styles.char} onClick={() => selectNode(c)}>
                      <div className={styles.charDot} style={{ background: ENTITY_COLORS.character }} />
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
