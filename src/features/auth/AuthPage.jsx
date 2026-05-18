import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { authApi, setToken, setRefreshToken } from '../../api/client'
import { useStore } from '../../app/store'
import { Button } from '../../shared/ui'
import styles from './Auth.module.css'

function Logo() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
      <circle cx="19" cy="9"  r="5.5" fill="#7F77DD"/>
      <circle cx="7"  cy="29" r="4.5" fill="#3dd4a6"/>
      <circle cx="31" cy="29" r="4.5" fill="#3dd4a6"/>
      <circle cx="19" cy="29" r="3"   fill="#AFA9EC"/>
      <line x1="19" y1="14.5" x2="19" y2="26" stroke="#534AB7" stroke-width="1.6"/>
      <line x1="15.5" y1="12" x2="9"  y2="25" stroke="#534AB7" stroke-width="1.6"/>
      <line x1="22.5" y1="12" x2="29" y2="25" stroke="#534AB7" stroke-width="1.6"/>
      <line x1="11.5" y1="29" x2="16" y2="29" stroke="#0F6E56" stroke-width="1.2"/>
      <line x1="26.5" y1="29" x2="22" y2="29" stroke="#0F6E56" stroke-width="1.2"/>
    </svg>
  )
}

export default function AuthPage({ onSuccess }) {
  const [tab, setTab]   = useState('login')
  const [form, setForm] = useState({ email: '', password: '', username: '' })
  const setUser = useStore(s => s.setUser)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email: form.email, password: form.password }),
    onSuccess: async (data) => {
      setToken(data.access_token)
      setRefreshToken(data.refresh_token)
      const me = await authApi.me()
      setUser(me)
      onSuccess()
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Login failed'),
  })

  const registerMutation = useMutation({
    mutationFn: () => authApi.register({ email: form.email, password: form.password, username: form.username }),
    onSuccess: () => { toast.success('Account created — sign in'); setTab('login') },
    onError: (e) => toast.error(e.response?.data?.detail || 'Registration failed'),
  })

  const submit = (e) => {
    e.preventDefault()
    tab === 'login' ? loginMutation.mutate() : registerMutation.mutate()
  }

  const loading = loginMutation.isPending || registerMutation.isPending

  return (
    <div className={styles.page}>
      <div className={`${styles.card} fade-up`}>
        <div className={styles.logoRow}>
          <Logo />
          <span className={styles.logoText}>Lore</span>
        </div>
        <p className={styles.tagline}>
          Your world. Every character, place and moment — mapped.
        </p>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'login' ? styles.active : ''}`} onClick={() => setTab('login')}>Sign in</button>
          <button className={`${styles.tab} ${tab === 'register' ? styles.active : ''}`} onClick={() => setTab('register')}>Create account</button>
        </div>

        <form onSubmit={submit} className={styles.form}>
          {tab === 'register' && (
            <div className={styles.field}>
              <div className={styles.label}>Username</div>
              <input value={form.username} onChange={set('username')} placeholder="yourname" autoComplete="username"/>
            </div>
          )}
          <div className={styles.field}>
            <div className={styles.label}>Email</div>
            <input type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email"/>
          </div>
          <div className={styles.field}>
            <div className={styles.label}>Password</div>
            <input type="password" value={form.password} onChange={set('password')} placeholder="••••••••" autoComplete="current-password"/>
          </div>
          <Button type="submit" variant="primary" size="md" disabled={loading}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
