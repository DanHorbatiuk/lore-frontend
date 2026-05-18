import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useQuery } from '@tanstack/react-query'
import { authApi, getToken } from './api/client'
import { useStore } from './app/store'
import AuthPage from './features/auth/AuthPage'
import Sidebar from './features/worlds/Sidebar'
import WorldsPage from './features/worlds/WorldsPage'
import GraphPage from './features/graph/GraphPage'
import { Spinner } from './shared/ui'
import './index.css'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1 } } })

function AppInner() {
  const { user, setUser, currentWorld, setCurrentWorld, logout } = useStore()
  const [page, setPage] = useState('worlds')
  const [ready, setReady] = useState(false)

  // restore session
  useEffect(() => {
    const token = getToken()
    if (!token) { setReady(true); return }
    authApi.me()
      .then(u => { setUser(u); setReady(true) })
      .catch(() => { setReady(true) })
  }, [])

  const { data: worlds } = useQuery({
    queryKey: ['worlds'],
    queryFn: () => import('./api/client').then(m => m.worldsApi.list()),
    enabled: !!user,
  })

  const handleSelectWorld = (w) => {
    setCurrentWorld(w)
    setPage('graph')
  }

  const handleNavigate = (p) => {
    setPage(p)
    if (p === 'worlds') setCurrentWorld(null)
  }

  if (!ready) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return <AuthPage onSuccess={() => setReady(true)} />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        page={page}
        onNavigate={handleNavigate}
        worlds={worlds || []}
        onSelectWorld={handleSelectWorld}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {page === 'worlds' && <WorldsPage onSelectWorld={handleSelectWorld} />}
        {page === 'graph'  && <GraphPage />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AppInner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1c1c2e',
            color: '#e8e6f8',
            border: '1px solid rgba(127,119,221,0.24)',
            fontFamily: 'Outfit, sans-serif',
            fontSize: 13,
          },
          success: { iconTheme: { primary: '#1D9E75', secondary: '#0c0c18' } },
          error:   { iconTheme: { primary: '#e04848', secondary: '#0c0c18' } },
        }}
      />
    </QueryClientProvider>
  )
}
