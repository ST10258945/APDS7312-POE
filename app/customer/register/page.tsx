'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { Alert, Button, Input, useToast, TopNav } from '@/app/components'
import {
  validateFullName,
  validateSAIdNumber,
  validateAccountNumber,
  validateUsername,
  validateEmail,
  validatePassword,
} from '@/lib/validation'

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof formData, string>>>({})

  // Validator map to reduce cognitive complexity
  const validators: Record<string, (value: string) => { isValid: boolean; error?: string }> = {
    fullName: validateFullName,
    idNumber: validateSAIdNumber,
    accountNumber: validateAccountNumber,
    username: validateUsername,
    email: validateEmail,
    password: validatePassword,
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    let err = ''
    const validator = validators[name]
    if (validator) {
      const result = validator(value)
      err = result.isValid ? '' : result.error || 'Invalid'
    }
    setFieldErrors((prev) => ({ ...prev, [name]: err }))
  }

  const validateAll = () => {
    const errors: Partial<Record<keyof typeof formData, string>> = {}
    const r1 = validateFullName(formData.fullName); if (!r1.isValid) errors.fullName = r1.error
    const r2 = validateSAIdNumber(formData.idNumber); if (!r2.isValid) errors.idNumber = r2.error
    const r3 = validateAccountNumber(formData.accountNumber); if (!r3.isValid) errors.accountNumber = r3.error
    const r4 = validateUsername(formData.username); if (!r4.isValid) errors.username = r4.error
    const r5 = validateEmail(formData.email); if (!r5.isValid) errors.email = r5.error
    const r6 = validatePassword(formData.password); if (!r6.isValid) errors.password = r6.error
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
        return
      }
      const response = await api.post('/api/customer/register', formData)

      if (response.ok) {
        toast.success('Registration successful! Please log in.')
        setTimeout(() => router.push('/customer/login'), 1500)
      } else {
        setError(response.userMessage || response.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Customer registration error:', error)
      setError('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TopNav />
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
              error={fieldErrors.fullName}
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
              error={fieldErrors.idNumber}
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
              error={fieldErrors.accountNumber}
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
              error={fieldErrors.username}
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
              error={fieldErrors.email}
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
              error={fieldErrors.password}
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
    </>
  )
}
