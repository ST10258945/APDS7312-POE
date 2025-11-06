'use client'

import { useEffect, useRef, ReactNode, useState, useCallback } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  stacking?: number // 0 = base (z-50), 1 = nested (z-60), 2 = further nested (z-70)
}

/**
 * Modal component for dialogs and confirmations with stacking support and smooth animations
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  stacking = 0,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Calculate z-index based on stacking level
  const zIndex = stacking === 0 ? 50 : stacking === 1 ? 60 : 70

  const focusFirstElement = useCallback(() => {
    const modal = modalRef.current
    if (!modal) return

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    firstElement?.focus()
  }, [])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    window.setTimeout(() => {
      onClose()
    }, 200)
  }, [onClose])

  // Handle Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, handleClose])

  // Focus trap
  useEffect(() => {
    if (!isOpen) return

    // Save previous focus
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus modal with slight delay for animation
    const modal = modalRef.current
    if (!modal) return

    const timer = window.setTimeout(focusFirstElement, 100)

    // Trap focus within modal
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableArray = Array.from(
        modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      )
      if (focusableArray.length === 0) return

      const first = focusableArray[0]
      const last = focusableArray[focusableArray.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    modal.addEventListener('keydown', handleTab)
    return () => {
      window.clearTimeout(timer)
      modal.removeEventListener('keydown', handleTab)
      // Restore previous focus
      previousFocusRef.current?.focus()
    }
  }, [isOpen, focusFirstElement])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle entrance animation
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      setIsVisible(true)
      // Trigger animation after render
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true)
        })
      })
    } else {
      setIsVisible(false)
      setTimeout(() => {
        setIsAnimating(false)
      }, 300) // Wait for exit animation
    }
  }, [isOpen])

  // Handle exit animation
  if (!isOpen && !isAnimating) return null

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center p-4 transition-opacity duration-300 motion-reduce:transition-none ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ zIndex }}
      onClick={closeOnBackdropClick ? handleClose : undefined}
      onKeyDown={(e) => {
        if (!closeOnBackdropClick) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClose()
        }
      }}
      tabIndex={closeOnBackdropClick ? 0 : -1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={contentRef}
          className={`bg-white rounded-lg shadow-xl transition-all duration-300 motion-reduce:transition-none ${
            isVisible
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-95 translate-y-4'
          }`}
          style={{ backgroundColor: 'white' }}
        >
          <div className="p-6">
            {title && (
              <div className="flex justify-between items-start mb-6">
                <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                  {title}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded transition-colors duration-150"
                  aria-label="Close modal"
                >
                  <span className="text-2xl" aria-hidden="true">
                    ✕
                  </span>
                </button>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}