/**
 * Tests for Alert component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Alert } from '@/app/components/Alert'

describe('Alert Component', () => {
  it('should render success alert', () => {
    render(<Alert variant="success">Success message</Alert>)
    
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('Success message')
    expect(alert).toHaveClass('bg-green-50')
  })

  it('should render error alert', () => {
    render(<Alert variant="error">Error message</Alert>)
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Error message')
    expect(alert).toHaveClass('bg-red-50')
  })

  it('should render warning alert', () => {
    render(<Alert variant="warning">Warning message</Alert>)
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Warning message')
    expect(alert).toHaveClass('bg-yellow-50')
  })

  it('should render info alert by default', () => {
    render(<Alert>Info message</Alert>)
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Info message')
    expect(alert).toHaveClass('bg-blue-50')
  })

  it('should render dismissible alert with close button', () => {
    const onDismiss = jest.fn()
    render(
      <Alert variant="info" dismissible onDismiss={onDismiss}>
        Dismissible message
      </Alert>
    )
    
    const dismissButton = screen.getByLabelText('Dismiss alert')
    expect(dismissButton).toBeInTheDocument()
    
    fireEvent.click(dismissButton)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('should not render dismiss button when not dismissible', () => {
    render(<Alert variant="info">Non-dismissible message</Alert>)
    
    const dismissButton = screen.queryByLabelText('Dismiss alert')
    expect(dismissButton).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Alert className="custom-class">Message</Alert>)
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('custom-class')
  })

  it('should have aria-live polite', () => {
    render(<Alert>Message</Alert>)
    
    const alert = screen.getByRole('alert')
    expect(alert).toHaveAttribute('aria-live', 'polite')
  })

  it('should render icon for each variant', () => {
    const { rerender } = render(<Alert variant="success">Success</Alert>)
    expect(screen.getByText('✓')).toBeInTheDocument()

    rerender(<Alert variant="error">Error</Alert>)
    expect(screen.getByText('✕')).toBeInTheDocument()

    rerender(<Alert variant="warning">Warning</Alert>)
    expect(screen.getByText('⚠')).toBeInTheDocument()

    rerender(<Alert variant="info">Info</Alert>)
    expect(screen.getByText('ℹ')).toBeInTheDocument()
  })

  it('should render children content', () => {
    render(
      <Alert variant="info">
        <div>Complex content</div>
        <span>Multiple elements</span>
      </Alert>
    )
    
    expect(screen.getByText('Complex content')).toBeInTheDocument()
    expect(screen.getByText('Multiple elements')).toBeInTheDocument()
  })
})
