'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertVariant } from './Alert'

export interface Toast {
  id: string
  variant: AlertVariant
  message: string
  duration?: number
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

/**
 * Toast notification container
 */
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const duration = toast.duration ?? (toast.variant === 'error' ? 5000 : 4000)
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(toast.id), 300) // Allow fade-out animation
    }, duration)

    return () => clearTimeout(timer)
  }, [toast, onDismiss])

  if (!isVisible) return null

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Alert variant={toast.variant} dismissible onDismiss={() => onDismiss(toast.id)}>
        {toast.message}
      </Alert>
    </div>
  )
}

/**
 * Toast hook for managing toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (variant: AlertVariant, message: string, duration?: number) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts((prev) => [...prev, { id, variant, message, duration }])
    return id
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const success = (message: string, duration?: number) => showToast('success', message, duration)
  const error = (message: string, duration?: number) => showToast('error', message, duration)
  const warning = (message: string, duration?: number) => showToast('warning', message, duration)
  const info = (message: string, duration?: number) => showToast('info', message, duration)

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    error,
    warning,
    info,
    ToastContainer: () => <ToastContainer toasts={toasts} onDismiss={dismissToast} />,
  }
}
