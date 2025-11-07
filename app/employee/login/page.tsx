'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { Alert, Button, Input, TopNav } from '@/app/components'

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
        router.push('/employee/dashboard')
      } else {
        setError(response.userMessage || response.error || 'Login failed')
      }
    } catch (error) {
      console.error('Employee login error:', error)
      setError('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TopNav />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GlobeWire Employee Portal</h1>
          <p className="text-gray-600">Sign in to verify and process payments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            label="Employee ID"
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="e.g., EMP001"
            required
            disabled={loading}
            id="employeeId"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            disabled={loading}
            id="password"
          />

          <Button
            type="submit"
            loading={loading}
            className="w-full bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Default credentials:{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">EMP001</code> /{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">EmpSecurePass123!</code>
          </p>
        </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <a href="/customer/login" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Customer Portal →
            </a>
          </div>
        </div>
      </div>
    </>
  )
}