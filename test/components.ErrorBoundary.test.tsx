/**
 * Tests for ErrorBoundary component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '@/app/components/ErrorBoundary'

function Bomb({ message = 'Boom' }: { message?: string }) {
  throw new Error(message)
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    ;(console.error as jest.Mock).mockRestore()
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Safe Child</div>
      </ErrorBoundary>
    )
    expect(screen.getByText('Safe Child')).toBeInTheDocument()
  })

  it('renders default fallback with error message when child throws', () => {
    render(
      <ErrorBoundary>
        {/* @ts-expect-error testing throw */}
        <Bomb message="Kaboom" />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Kaboom')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Refresh Page' })).toBeInTheDocument()
    expect(console.error).toHaveBeenCalled()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div role="alert">Custom Fallback</div>}>
        {/* @ts-expect-error testing throw */}
        <Bomb />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Custom Fallback')
  })
})
