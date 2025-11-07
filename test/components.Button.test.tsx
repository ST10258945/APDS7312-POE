/**
 * Tests for Button component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/app/components/Button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    
    const button = screen.getByRole('button', { name: 'Click me' })
    expect(button).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Click me</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should render primary variant', () => {
    render(<Button variant="primary">Primary</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-teal-600')
  })

  it('should render secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-2')
  })

  it('should render danger variant', () => {
    render(<Button variant="danger">Danger</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-red-600')
  })

  it('should render with default variant when not specified', () => {
    render(<Button>Default</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-teal-600')
  })

  it('should render small size', () => {
    render(<Button size="sm">Small</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')
  })

  it('should render medium size by default', () => {
    render(<Button>Medium</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-4', 'py-2', 'text-base')
  })

  it('should render large size', () => {
    render(<Button size="lg">Large</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should not call onClick when disabled', () => {
    const onClick = jest.fn()
    render(<Button disabled onClick={onClick}>Disabled</Button>)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(onClick).not.toHaveBeenCalled()
  })

  it('should show loading spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Button className="custom-class">Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should use customer portal styling by default', () => {
    render(<Button variant="primary">Customer</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-teal-600')
  })

  it('should use employee portal styling for primary button', () => {
    render(<Button variant="primary" portal="employee">Employee</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-indigo-600')
  })

  it('should pass through native button props', () => {
    render(<Button type="submit" name="test-button">Submit</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveAttribute('name', 'test-button')
  })
})
