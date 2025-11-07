/**
 * Smoke tests for Employee Login page
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import EmployeeLoginPage from '@/app/employee/login/page'

// Mock next/navigation useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

describe('EmployeeLoginPage (smoke)', () => {
  it('renders inputs via placeholders and submit button', () => {
    render(<EmployeeLoginPage />)

    expect(screen.getByPlaceholderText('e.g., EMP001')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })
})
