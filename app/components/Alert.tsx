'use client'

import { ReactNode } from 'react'

export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

interface AlertProps {
  variant?: AlertVariant
  children: ReactNode
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

const variantStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}

const variantIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}

/**
 * Alert component for displaying success, error, warning, and informational messages
 */
export function Alert({
  variant = 'info',
  children,
  dismissible = false,
  onDismiss,
  className = '',
}: AlertProps) {
  const baseStyles = 'border px-4 py-3 rounded-md text-sm flex items-start gap-2'
  const styles = `${baseStyles} ${variantStyles[variant]} ${className}`

  return (
    <div className={styles} role="alert" aria-live="polite">
      <span className="font-semibold flex-shrink-0" aria-hidden="true">
        {variantIcons[variant]}
      </span>
      <div className="flex-1">{children}</div>
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current rounded"
          aria-label="Dismiss alert"
        >
          <span aria-hidden="true">✕</span>
        </button>
      )}
    </div>
  )
}
