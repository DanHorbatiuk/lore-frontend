import { useStore } from '../../app/store'
import styles from './Sidebar.module.css'

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13" cy="6"  r="4"   fill="#7F77DD"/>
      <circle cx="5"  cy="20" r="3"   fill="#3dd4a6"/>
      <circle cx="21" cy="20" r="3"   fill="#3dd4a6"/>
      <circle cx="13" cy="20" r="2.5" fill="#AFA9EC"/>
      <line x1="13" y1="10" x2="13" y2="17.5" stroke="#534AB7" stroke-width="1.4"/>
      <line x1="10.5" y1="8.2" x2="6.5" y2="17" stroke="#534AB7" stroke-width="1.4"/>
      <line x1="15.5" y1="8.2" x2="19.5" y2="17" stroke="#534AB7" stroke-width="1.4"/>
    </svg>
  )
}

const WorldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>
  </svg>
)

const GraphIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
  </svg>
)

export default function Sidebar({ page, onNavigate, worlds, onSelectWorld }) {
  const { user, currentWorld, logout } = useStore()
  const initial = user?.username?.[0]?.toUpperCase() || '?'

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <Logo />
        <span className={styles.logoText}>Lore</span>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Navigation</div>
        <div
          className={`${styles.item} ${page === 'worlds' ? styles.active : ''}`}
          onClick={() => onNavigate('worlds')}
        >
          <WorldIcon /> Worlds
        </div>
        {currentWorld && (
          <div
            className={`${styles.item} ${page === 'graph' ? styles.active : ''}`}
            onClick={() => onNavigate('graph')}
          >
            <GraphIcon /> Graph
          </div>
        )}
      </div>

      {worlds?.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>My Worlds</div>
          {worlds.map(w => (
            <div
              key={w.id}
              className={`${styles.item} ${currentWorld?.id === w.id && page === 'graph' ? styles.active : ''}`}
              onClick={() => onSelectWorld(w)}
            >
              <div className={styles.worldDot} />
              {w.name}
            </div>
          ))}
        </div>
      )}

      <div className={styles.spacer} />

      <div className={styles.user} onClick={logout}>
        <div className={styles.avatar}>{initial}</div>
        <span className={styles.username}>{user?.username}</span>
        <span className={styles.logoutHint}>Sign out</span>
      </div>
    </div>
  )
}
