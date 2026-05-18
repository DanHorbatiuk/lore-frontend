import { useState } from 'react'
import styles from './ui.module.css'

export function Button({ children, variant = 'ghost', size = 'md', onClick, disabled, type = 'button', style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={[styles.btn, styles[`btn-${variant}`], styles[`btn-${size}`]].join(' ')}
    >
      {children}
    </button>
  )
}

export function Input({ label, ...props }) {
  return (
    <div className={styles.field}>
      {label && <div className={styles.label}>{label}</div>}
      <input {...props} />
    </div>
  )
}

export function Textarea({ label, ...props }) {
  return (
    <div className={styles.field}>
      {label && <div className={styles.label}>{label}</div>}
      <textarea {...props} style={{ resize: 'none', ...props.style }} />
    </div>
  )
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} scale-in`}>
        <div className={styles['modal-title']}>{title}</div>
        {children}
      </div>
    </div>
  )
}

export function Badge({ children, color }) {
  return (
    <span
      className={styles.badge}
      style={{ background: color + '22', color, borderColor: color + '44' }}
    >
      {children}
    </span>
  )
}

export function Spinner() {
  return <div className={styles.spinner} />
}

export function EmptyState({ icon, text, action }) {
  return (
    <div className={styles.empty}>
      {icon && <div className={styles['empty-icon']}>{icon}</div>}
      <p className={styles['empty-text']}>{text}</p>
      {action}
    </div>
  )
}
