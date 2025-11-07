/**
 * Tests for LoadingSpinner component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from '@/app/components/LoadingSpinner'

describe('LoadingSpinner Component', () => {
  it('should render loading spinner', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('should have aria-live polite', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-live', 'polite')
  })

  it('should render with custom size', () => {
    render(<LoadingSpinner size="lg" />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('should render with small size', () => {
    render(<LoadingSpinner size="sm" />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('should render with default medium size', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('should apply custom className to container', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />)
    
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('custom-class')
  })

  it('should display loading text for screen readers', () => {
    render(<LoadingSpinner />)
    
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
