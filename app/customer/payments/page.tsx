'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'

export default function CustomerPaymentsPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    provider: 'SWIFT',
    recipientName: '',
    recipientAccount: '',
    swiftCode: '',
    paymentReference: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleLogout = async () => {
    await api.post('/api/logout', {})
    router.push('/customer/login')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await api.post('/api/payments/create', formData)

      if (response.ok) {
        setSuccess('Payment created successfully! It will appear on the employee portal for verification.')
        // Reset form
        setFormData({
          amount: '',
          currency: 'USD',
          provider: 'SWIFT',
          recipientName: '',
          recipientAccount: '',
          swiftCode: '',
          paymentReference: '',
        })
      } else {
        // Map technical errors to user-friendly messages
        let errorMessage = response.error || 'Failed to create payment'
        
        if (errorMessage.includes('CSRF')) {
          errorMessage = 'Session expired. Please refresh the page and try again.'
        } else if (errorMessage.includes('authenticated') || errorMessage.includes('Forbidden')) {
          errorMessage = 'Your session has expired. Redirecting to login...'
          setTimeout(() => router.push('/customer/login'), 2000)
        } else if (errorMessage.includes('format') || errorMessage.includes('invalid')) {
          errorMessage = errorMessage // Keep validation messages
        } else if (errorMessage.includes('Too many')) {
          errorMessage = 'Too many requests. Please wait a moment and try again.'
        }
        
        setError(errorMessage)
      }
    } catch (err) {
      setError('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'ZAR', 'AUD', 'CAD', 'CHF', 'CNY', 'INR']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GlobeWire Customer Portal</h1>
            <p className="text-sm text-gray-600">International Payment Processing</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create International Payment</h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="text"
                  value={formData.amount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., 1000.50"
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">Up to 2 decimal places</p>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  required
                  disabled={loading}
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="provider" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Provider <span className="text-red-500">*</span>
                </label>
                <select
                  id="provider"
                  name="provider"
                  value={formData.provider}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  required
                  disabled={loading}
                >
                  <option value="SWIFT">SWIFT</option>
                </select>
              </div>

              <div>
                <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700 mb-2">
                  SWIFT Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="swiftCode"
                  name="swiftCode"
                  type="text"
                  value={formData.swiftCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., ABCDUS33XXX"
                  required
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-gray-500">8 or 11 characters</p>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="recipientName"
                  name="recipientName"
                  type="text"
                  value={formData.recipientName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder="Full name of recipient"
                  required
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="recipientAccount" className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="recipientAccount"
                  name="recipientAccount"
                  type="text"
                  value={formData.recipientAccount}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder="8-12 digit account number"
                  required
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="paymentReference" className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Reference <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  id="paymentReference"
                  name="paymentReference"
                  type="text"
                  value={formData.paymentReference}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder="e.g., Invoice #12345"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-teal-600 text-white py-3 px-6 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-lg"
              >
                {loading ? 'Processing...' : 'Submit Payment'}
              </button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Your payment will be reviewed by bank staff</li>
              <li>Staff will verify recipient details and SWIFT code</li>
              <li>Once verified, payment will be submitted to SWIFT</li>
              <li>You'll be notified once the payment is processed</li>
            </ol>
          </div>
        </div>
      </main>
    </div>
  )
}
