'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
  portal?: 'customer' | 'employee'
}

const variantStyles = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500',
  secondary: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
}

// For employee portal, use indigo instead of teal
export const employeeButtonStyles = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
  secondary: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

/**
 * Button component with consistent styling and variants
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  portal = 'customer',
  ...props
}: ButtonProps) {
  const baseStyles =
    'font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed motion-reduce:transition-none'
  const styles =
    portal === 'employee' && variant === 'primary'
      ? `${baseStyles} ${employeeButtonStyles[variant]} ${sizeStyles[size]} ${className}`
      : `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  return (
    <button className={styles} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="flex items-center gap-2 animate-in fade-in duration-200">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
