'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { Alert, Button, Input, useToast } from '@/app/components'

export default function CustomerRegisterPage() {
  const router = useRouter()
  const toast = useToast()
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    accountNumber: '',
    username: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/api/customer/register', formData)

      if (response.ok) {
        toast.success('Registration successful! Please log in.')
        setTimeout(() => router.push('/customer/login'), 1500)
      } else {
        setError(response.userMessage || response.error || 'Registration failed')
      }
    } catch (err) {
      setError('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Customer Account
          </h1>
          <p className="text-gray-600">Register to make international payments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <Alert variant="error">{error}</Alert>}
          {toast.ToastContainer()}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={loading}
              id="fullName"
            />

            <Input
              label="ID Number"
              name="idNumber"
              type="text"
              value={formData.idNumber}
              onChange={handleChange}
              placeholder="13-digit SA ID"
              helperText="13-digit South African ID number"
              required
              disabled={loading}
              id="idNumber"
            />

            <Input
              label="Account Number"
              name="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="8-12 digits"
              helperText="8-12 digit account number"
              required
              disabled={loading}
              id="accountNumber"
            />

            <Input
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe123"
              required
              disabled={loading}
              id="username"
            />

            <Input
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              required
              disabled={loading}
              id="email"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 chars, include A-Z, a-z, 0-9, !@#"
              helperText="Min 8 chars, include uppercase, lowercase, number, special char"
              required
              disabled={loading}
              id="password"
            />
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/customer/login" className="text-teal-600 hover:text-teal-700 font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
