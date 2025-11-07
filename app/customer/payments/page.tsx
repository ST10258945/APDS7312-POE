'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { Alert, Button, Input, useToast, TopNav } from '@/app/components'

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'ZAR', 'AUD', 'CAD', 'CHF', 'CNY', 'INR']

export default function CustomerPaymentsPage() {
  const router = useRouter()
  const toast = useToast()
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
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleLogout = async () => {
    await api.post('/api/logout', {})
    router.push('/customer/login')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/api/payments/create', formData)

      if (response.ok) {
        toast.success('Payment created successfully! It will appear on the employee portal for verification.')
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
        const errorMessage = response.userMessage || response.error || 'Failed to create payment'
        setError(errorMessage)
        if (errorMessage.includes('session') || errorMessage.includes('expired')) {
          setTimeout(() => router.push('/customer/login'), 2000)
        }
      }
    } catch (error) {
      console.error('Customer payment submission error:', error)
      setError('Unable to connect to the server. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <TopNav />
      <div className="min-h-screen bg-gray-50">
        {toast.ToastContainer()}
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
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Create International Payment</h2>

          {error && <Alert variant="error">{error}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Amount"
                name="amount"
                type="text"
                value={formData.amount}
                onChange={handleChange}
                placeholder="e.g., 1000.50"
                helperText="Up to 2 decimal places"
                required
                disabled={loading}
                id="amount"
              />

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
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
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

              <Input
                label="SWIFT Code"
                name="swiftCode"
                type="text"
                value={formData.swiftCode}
                onChange={handleChange}
                placeholder="e.g., ABCDUS33XXX"
                helperText="8 or 11 characters"
                required
                disabled={loading}
                id="swiftCode"
              />

              <div className="md:col-span-2">
                <Input
                  label="Recipient Name"
                  name="recipientName"
                  type="text"
                  value={formData.recipientName}
                  onChange={handleChange}
                  placeholder="Full name of recipient"
                  required
                  disabled={loading}
                  id="recipientName"
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Recipient Account Number"
                  name="recipientAccount"
                  type="text"
                  value={formData.recipientAccount}
                  onChange={handleChange}
                  placeholder="8-12 digit account number"
                  required
                  disabled={loading}
                  id="recipientAccount"
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Payment Reference"
                  name="paymentReference"
                  type="text"
                  value={formData.paymentReference}
                  onChange={handleChange}
                  placeholder="e.g., Invoice #12345"
                  disabled={loading}
                  id="paymentReference"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t">
              <Button type="submit" loading={loading} className="flex-1" size="lg">
                Submit Payment
              </Button>
            </div>
          </form>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Your payment will be reviewed by bank staff</li>
              <li>Staff will verify recipient details and SWIFT code</li>
              <li>Once verified, payment will be submitted to SWIFT</li>
              <li>{"You'll be notified once the payment is processed"}</li>
            </ol>
          </div>
        </div>
      </main>
      </div>
    </>
  )
}