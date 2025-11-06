'use client'

import { useState, useEffect } from 'react'
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
    <section
      className="fixed top-4 right-4 z-[60] space-y-2 max-w-md w-full"
      aria-labelledby="toast-notifications-title"
      aria-live="polite"
    >
      <h2 id="toast-notifications-title" className="sr-only">
        Notifications
      </h2>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </section>
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
      className={`transform transition-all duration-300 motion-reduce:transition-none ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Alert variant={toast.variant} dismissible onDismiss={() => onDismiss(toast.id)}>
        {toast.message}
      </Alert>
    </div>
  )
}

let toastCounter = 0

/**
 * Toast hook for managing toasts
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const generateId = () => {
    const webCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined
    if (webCrypto?.randomUUID) {
      return webCrypto.randomUUID()
    }
    if (webCrypto?.getRandomValues) {
      const buffer = new Uint32Array(2)
      webCrypto.getRandomValues(buffer)
      return Array.from(buffer)
        .map((segment) => segment.toString(36).padStart(8, '0'))
        .join('-')
    }
    toastCounter = (toastCounter + 1) % Number.MAX_SAFE_INTEGER
    const timestamp = Date.now().toString(36)
    const counterSegment = toastCounter.toString(36).padStart(6, '0')
    return `toast-${timestamp}-${counterSegment}`
  }

  const showToast = (variant: AlertVariant, message: string, duration?: number) => {
    const id = generateId()
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
