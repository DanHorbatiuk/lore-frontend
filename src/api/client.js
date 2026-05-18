import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const client = axios.create({ baseURL: BASE })

// ── token helpers ──
export const getToken = ()  => sessionStorage.getItem('lore_access_token')
export const setToken = (t) => sessionStorage.setItem('lore_access_token', t)
export const getRefreshToken = ()  => sessionStorage.getItem('lore_refresh_token')
export const setRefreshToken = (t) => sessionStorage.setItem('lore_refresh_token', t)
export const clearTokens = () => {
  sessionStorage.removeItem('lore_access_token')
  sessionStorage.removeItem('lore_refresh_token')
}

// ── request: attach token ──
client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── response: auto-refresh on 401 ──
let refreshing = null
client.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const rt = getRefreshToken()
      if (!rt) { clearTokens(); window.location.href = '/'; return Promise.reject(error) }
      if (!refreshing) {
        refreshing = client.post('/auth/refresh', null, { params: { refresh_token: rt } })
          .then(r => { setToken(r.data.access_token); setRefreshToken(r.data.refresh_token); return r.data.access_token })
          .catch(() => { clearTokens(); window.location.href = '/'; return null })
          .finally(() => { refreshing = null })
      }
      const newToken = await refreshing
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return client(original)
      }
    }
    return Promise.reject(error)
  }
)

// ── API methods ──
export const authApi = {
  register: (data) => client.post('/auth/register', data).then(r => r.data),
  login:    (data) => client.post('/auth/login', data).then(r => r.data),
  me:       ()     => client.get('/auth/me').then(r => r.data),
}

export const worldsApi = {
  list:   ()         => client.get('/worlds').then(r => r.data),
  get:    (id)       => client.get(`/worlds/${id}`).then(r => r.data),
  create: (data)     => client.post('/worlds', data).then(r => r.data),
  update: (id, data) => client.patch(`/worlds/${id}`, data).then(r => r.data),
  delete: (id)       => client.delete(`/worlds/${id}`),
}

export const entitiesApi = {
  list:   (wid)       => client.get(`/worlds/${wid}/entities`).then(r => r.data),
  get:    (wid, id)   => client.get(`/worlds/${wid}/entities/${id}`).then(r => r.data),
  create: (wid, data) => client.post(`/worlds/${wid}/entities`, data).then(r => r.data),
  update: (wid, id, data) => client.patch(`/worlds/${wid}/entities/${id}`, data).then(r => r.data),
  delete: (wid, id)   => client.delete(`/worlds/${wid}/entities/${id}`),
}

export const graphApi = {
  get:       (wid)      => client.get(`/worlds/${wid}/graph`).then(r => r.data),
  createEdge:(wid, data)=> client.post(`/worlds/${wid}/graph/edges`, data).then(r => r.data),
  deleteEdge:(wid, eid) => client.delete(`/worlds/${wid}/graph/edges/${eid}`),
  conflicts: (wid)      => client.get(`/worlds/${wid}/graph/conflicts`).then(r => r.data),
}
