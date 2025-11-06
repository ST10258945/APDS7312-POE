'use client'

import { Component, ReactNode } from 'react'
import { Alert } from './Alert'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component for React error catching
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert variant="error">
              <div>
                <h3 className="font-semibold mb-2">Something went wrong</h3>
                <p className="text-sm">
                  {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
                </p>
                <button
                  onClick={() => globalThis.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Refresh Page
                </button>
              </div>
            </Alert>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
