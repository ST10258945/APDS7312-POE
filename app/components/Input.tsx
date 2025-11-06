'use client'

import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

/**
 * Input component with consistent styling and error states
 */
export function Input({
  label,
  error,
  helperText,
  required,
  className = '',
  id,
  ...props
}: InputProps) {
  const normalizedLabel = label?.toLowerCase().replaceAll(/\s+/g, '-')
  const inputId = id || (normalizedLabel ? `input-${normalizedLabel}` : undefined)
  const errorStyles = error
    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
    : 'border-gray-300 focus:ring-teal-500 focus:border-teal-500'
  const baseInputStyles =
    'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseInputStyles} ${errorStyles} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-xs text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  )
}
