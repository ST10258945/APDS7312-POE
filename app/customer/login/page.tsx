'use client'

import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { Alert, Button, Input, TopNav } from '@/app/components'
import { validateUsername, validateAccountNumber, validatePassword } from '@/lib/validation'

export default function CustomerLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [allowRegistration, setAllowRegistration] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; accountNumber?: string; password?: string }>({})

  useEffect(() => {
    // Check if registration is enabled by testing the API
    const checkRegistration = async () => {
      try {
        const response = await api.post('/api/customer/register', {
          fullName: '',
          idNumber: '',
          accountNumber: '',
          username: '',
          email: '',
          password: '',
        })
        // If we get error 'Registration disabled', it's disabled
        // Otherwise (validation error or success), it's enabled
        const isDisabled = response.error?.includes('disabled')
        setAllowRegistration(!isDisabled)
      } catch {
        // If error, assume disabled for safety
        setAllowRegistration(false)
      }
    }
    checkRegistration()
  }, [])

  const validateAll = () => {
    const errors: typeof fieldErrors = {}
    const r1 = validateUsername(username); if (!r1.isValid) errors.username = r1.error
    const r2 = validateAccountNumber(accountNumber); if (!r2.isValid) errors.accountNumber = r2.error
    const r3 = validatePassword(password); if (!r3.isValid) errors.password = r3.error
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!validateAll()) {
        setError('Please correct the highlighted fields')
        setLoading(false)
        return
      }

      const response = await api.post('/api/customer/login', {
        username,
        accountNumber,
        password,
      })

      if (response.ok) {
        router.push('/customer/payments')
      } else {
        setError(response.userMessage || response.error || 'Login failed')
      }
    } catch (error) {
      console.error('Customer login error:', error)
      setError('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TopNav />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GlobeWire Customer Portal
          </h1>
          <p className="text-gray-600">Sign in to make international payments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            error={fieldErrors.username}
            required
            disabled={loading}
            id="username"
          />

          <Input
            label="Account Number"
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="8-12 digit account number"
            helperText="8-12 digit account number"
            error={fieldErrors.accountNumber}
            required
            disabled={loading}
            id="accountNumber"
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            error={fieldErrors.password}
            required
            disabled={loading}
            id="password"
          />

          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Default credentials:{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">testcustomer</code> /{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">12345678</code> /{' '}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">TestPass123!</code>
          </p>
        </div>

          {allowRegistration && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <a href="/customer/register" className="text-teal-600 hover:text-teal-700 font-medium">
                  Register here
                </a>
              </p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <a
              href="/employee/login"
              className="text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              Employee Portal →
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
