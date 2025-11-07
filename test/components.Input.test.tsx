/**
 * Tests for Input component
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '@/app/components/Input'

describe('Input Component', () => {
  it('should render input with label', () => {
    render(<Input label="Username" />)
    
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
  })

  it('should render input without label', () => {
    render(<Input placeholder="Enter text" />)
    
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
  })

  it('should display error message', () => {
    render(<Input label="Email" error="Invalid email" />)
    
    expect(screen.getByText('Invalid email')).toBeInTheDocument()
  })

  it('should apply error styling when error exists', () => {
    render(<Input label="Email" error="Invalid email" />)
    
    const input = screen.getByLabelText('Email')
    expect(input).toHaveClass('border-red-300')
  })

  it('should set aria-invalid when error exists', () => {
    render(<Input label="Email" error="Invalid email" />)
    
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('should not set aria-invalid when no error', () => {
    render(<Input label="Email" />)
    
    const input = screen.getByLabelText('Email')
    // aria-invalid is not set when there's no error
    expect(input).not.toHaveAttribute('aria-invalid')
  })

  it('should call onChange when value changes', () => {
    const onChange = jest.fn()
    render(<Input label="Username" onChange={onChange} />)
    
    const input = screen.getByLabelText('Username')
    fireEvent.change(input, { target: { value: 'newvalue' } })
    
    expect(onChange).toHaveBeenCalled()
  })

  it('should render with value', () => {
    render(<Input label="Username" value="testuser" onChange={() => {}} />)
    
    const input = screen.getByLabelText('Username') as HTMLInputElement
    expect(input.value).toBe('testuser')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input label="Username" disabled />)
    
    const input = screen.getByLabelText('Username')
    expect(input).toBeDisabled()
  })

  it('should render with custom type', () => {
    render(<Input label="Password" type="password" />)
    
    const input = screen.getByLabelText('Password')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('should render with placeholder', () => {
    render(<Input label="Email" placeholder="Enter your email" />)
    
    const input = screen.getByPlaceholderText('Enter your email')
    expect(input).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<Input label="Username" className="custom-class" />)
    
    const input = screen.getByLabelText('Username')
    expect(input).toHaveClass('custom-class')
  })

  it('should generate unique ID from label', () => {
    render(<Input label="Full Name" />)
    
    const input = screen.getByLabelText('Full Name')
    expect(input).toHaveAttribute('id', 'input-full-name')
  })

  it('should use provided ID over generated one', () => {
    render(<Input label="Username" id="custom-id" />)
    
    const input = screen.getByLabelText('Username')
    expect(input).toHaveAttribute('id', 'custom-id')
  })

  it('should link error message with aria-describedby', () => {
    render(<Input label="Email" error="Invalid email" />)
    
    const input = screen.getByLabelText('Email')
    const errorId = input.getAttribute('aria-describedby')
    expect(errorId).toBeTruthy()
    expect(screen.getByText('Invalid email')).toHaveAttribute('id', errorId)
  })

  it('should show required indicator when required prop is true', () => {
    render(<Input label="Username" required />)
    
    // The required indicator is shown as an asterisk
    expect(screen.getByText('*')).toBeInTheDocument()
  })
})
