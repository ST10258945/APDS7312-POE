'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'

export default function EmployeeLoginPage() {
  const router = useRouter()
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/api/employee/login', {
        employeeId,
        password,
      })

      if (response.ok) {
        // Redirect to employee dashboard
        router.push('/employee/dashboard')
      } else {
        // Map technical errors to user-friendly messages
        let errorMessage = response.error || 'Login failed'
        
        if (errorMessage.includes('CSRF')) {
          errorMessage = 'Session expired. Please refresh the page and try again.'
        } else if (errorMessage.includes('credentials') || errorMessage.includes('Invalid')) {
          errorMessage = 'Invalid employee ID or password'
        } else if (errorMessage.includes('Too many')) {
          errorMessage = 'Too many login attempts. Please try again in a few minutes.'
        } else if (errorMessage.includes('inactive')) {
          errorMessage = 'Account is inactive. Please contact your administrator.'
        }
        
        setError(errorMessage)
      }
    } catch (err) {
      setError('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GlobeWire Employee Portal
          </h1>
          <p className="text-gray-600">Sign in to verify and process payments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-2">
              Employee ID
            </label>
            <input
              id="employeeId"
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              placeholder="e.g., EMP001"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Default credentials: <code className="bg-gray-100 px-2 py-1 rounded text-xs">EMP001</code> / <code className="bg-gray-100 px-2 py-1 rounded text-xs">EmpSecurePass123!</code>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <a
            href="/customer/login"
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Customer Portal →
          </a>
        </div>
      </div>
    </div>
  )
}
