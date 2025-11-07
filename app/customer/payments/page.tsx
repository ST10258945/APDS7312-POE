'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { Alert, Button, Input, useToast, Modal } from '@/app/components'
import {
  validateAmount,
  validateCurrencyCode,
  validateRecipientName,
  validateAccountNumber,
  validateSwiftCode,
  validatePaymentReference,
} from '@/lib/validation'

const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'ZAR', 'AUD', 'CAD', 'CHF', 'CNY', 'INR']

interface Payment {
  id: string
  transactionId: string
  amount: string
  currency: string
  provider: string
  recipientName: string
  recipientAccount: string
  swiftCode: string
  paymentReference?: string
  status: string
  createdAt: string
  customer?: {
    fullName: string
    username: string
  }
}

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
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof typeof formData, string>>>({})
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [successPayment, setSuccessPayment] = useState<Payment | null>(null)

  // Validator map
  const validators: Record<string, (value: string) => { isValid: boolean; error?: string }> = {
    amount: validateAmount,
    currency: validateCurrencyCode,
    recipientName: validateRecipientName,
    recipientAccount: validateAccountNumber,
    swiftCode: validateSwiftCode,
    paymentReference: validatePaymentReference,
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    const r1 = validateAmount(formData.amount); if (!r1.isValid) errors.amount = r1.error
    const r2 = validateCurrencyCode(formData.currency); if (!r2.isValid) errors.currency = r2.error
    const r3 = validateRecipientName(formData.recipientName); if (!r3.isValid) errors.recipientName = r3.error
    const r4 = validateAccountNumber(formData.recipientAccount); if (!r4.isValid) errors.recipientAccount = r4.error
    const r5 = validateSwiftCode(formData.swiftCode); if (!r5.isValid) errors.swiftCode = r5.error
    if (formData.paymentReference) {
      const r6 = validatePaymentReference(formData.paymentReference); if (!r6.isValid) errors.paymentReference = r6.error
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleLogout = async () => {
    await api.post('/api/logout', {})
    router.push('/')
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

      // Show confirmation modal instead of submitting directly
      setShowConfirmModal(true)
      setLoading(false)
    } catch (error) {
      console.error('Customer payment submission error:', error)
      setError('Unable to connect to the server. Please check your connection and try again.')
      setLoading(false)
    }
  }

  const confirmPayment = async () => {
    setLoading(true)
    setShowConfirmModal(false)

    try {
      const response = await api.post<{ payment: Payment }>('/api/payments/create', formData)

      if (response.ok && response.data?.payment) {
        setSuccessPayment(response.data.payment)
        // Reset form after successful submission
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
                error={fieldErrors.amount}
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
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:border-transparent text-gray-900 ${fieldErrors.currency ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-teal-500'}`}
                  required
                  disabled={loading}
                >
                  {currencies.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
                {fieldErrors.currency && <p className="mt-1 text-sm text-red-600">{fieldErrors.currency}</p>}
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
                error={fieldErrors.swiftCode}
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
                  error={fieldErrors.recipientName}
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
                  error={fieldErrors.recipientAccount}
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
                  error={fieldErrors.paymentReference}
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

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Payment Details"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-600 font-medium">Amount</p>
              <p className="text-lg font-semibold text-gray-900">{formData.currency} {formData.amount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Currency</p>
              <p className="text-lg font-semibold text-gray-900">{formData.currency}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Recipient Name</p>
              <p className="text-sm text-gray-900">{formData.recipientName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Account Number</p>
              <p className="text-sm font-mono text-gray-900">{formData.recipientAccount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">SWIFT Code</p>
              <p className="text-sm font-mono text-gray-900">{formData.swiftCode}</p>
            </div>
            {formData.paymentReference && (
              <div>
                <p className="text-xs text-gray-600 font-medium">Reference</p>
                <p className="text-sm text-gray-900">{formData.paymentReference}</p>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded border border-yellow-200">
            ⚠️ Please review all details carefully. Once submitted, the payment will be sent for verification.
          </p>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowConfirmModal(false)}
              disabled={loading}
            >
              Cancel & Edit
            </Button>
            <Button
              variant="primary"
              onClick={confirmPayment}
              loading={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              ✓ Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      {successPayment && (
        <Modal
          isOpen={!!successPayment}
          onClose={() => {
            setSuccessPayment(null)
          }}
          title="Payment Submitted Successfully!"
        >
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-3">✓ Your payment has been created and sent for verification</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono font-semibold text-gray-900">{successPayment.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold text-gray-900">{successPayment.currency} {successPayment.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">PENDING</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Next steps:</strong> Our team will review your payment details and verify the recipient information. You can check the status in your account.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="primary"
                onClick={() => {
                  setSuccessPayment(null)
                  router.push('/customer/payments')
                }}
                className="flex-1"
              >
                ← Back to Payments
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}