'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'

interface Payment {
  id: string
  transactionId: string
  amount: string
  currency: string
  recipientName: string
  recipientAccount: string
  swiftCode: string
  paymentReference?: string
  status: 'PENDING' | 'VERIFIED' | 'SUBMITTED' | 'COMPLETED' | 'REJECTED'
  createdAt: string
  customer?: {
    fullName: string
    email: string
  }
}

export default function EmployeeDashboardPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'SUBMITTED'>('ALL')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    setError('')

    const response = await api.get<{ payments: Payment[] }>('/api/payments/list')

    if (response.ok && response.data) {
      setPayments(response.data.payments || [])
    } else {
      setError(response.error || 'Failed to load payments')
      // If unauthorized, redirect to login
      if (response.error?.includes('authenticated') || response.error?.includes('Forbidden')) {
        router.push('/employee/login')
      }
    }

    setLoading(false)
  }

  const handleLogout = async () => {
    await api.post('/api/logout', {})
    router.push('/employee/login')
  }

  const requestActionToken = async (action: 'VERIFY_PAYMENT' | 'SUBMIT_TO_SWIFT') => {
    const response = await api.post<{ actionToken: string }>('/api/employee/request-action-token', {
      action,
    })

    if (response.ok && response.data) {
      return response.data.actionToken
    }

    throw new Error(response.error || 'Failed to get action token')
  }

  const handleVerify = async (payment: Payment) => {
    if (!confirm(`Verify payment of ${payment.currency} ${payment.amount} to ${payment.recipientName}?`)) {
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const actionToken = await requestActionToken('VERIFY_PAYMENT')
      
      const response = await api.post('/api/payments/verify', {
        paymentId: payment.id,
        actionToken,
      })

      if (response.ok) {
        alert('Payment verified successfully!')
        setSelectedPayment(null)
        await loadPayments()
      } else {
        setError(response.error || 'Failed to verify payment')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitToSwift = async (payment: Payment) => {
    if (!confirm(`Submit payment ${payment.transactionId} to SWIFT for processing?`)) {
      return
    }

    setActionLoading(true)
    setError('')

    try {
      const actionToken = await requestActionToken('SUBMIT_TO_SWIFT')
      
      const response = await api.post('/api/employee/submit-to-swift', {
        paymentId: payment.id,
        actionToken,
      })

      if (response.ok) {
        alert('Payment submitted to SWIFT successfully!')
        setSelectedPayment(null)
        await loadPayments()
      } else {
        setError(response.error || 'Failed to submit to SWIFT')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPayments = filter === 'ALL' 
    ? payments 
    : payments.filter(p => p.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'VERIFIED': return 'bg-blue-100 text-blue-800'
      case 'SUBMITTED': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-gray-100 text-gray-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GlobeWire Employee Portal</h1>
            <p className="text-sm text-gray-600">International Payment Verification</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {(['ALL', 'PENDING', 'VERIFIED', 'SUBMITTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status}
            </button>
          ))}
          <button
            onClick={loadPayments}
            className="ml-auto px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No payments found</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SWIFT Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {payment.transactionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.customer?.fullName || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.currency} {payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment.recipientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {payment.swiftCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.transactionId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedPayment.status)}`}>
                        {selectedPayment.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{selectedPayment.currency} {selectedPayment.amount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedPayment.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <hr />

                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.customer?.fullName}</p>
                  <p className="text-xs text-gray-600">{selectedPayment.customer?.email}</p>
                </div>

                <hr />

                <div>
                  <label className="text-sm font-medium text-gray-500">Recipient Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedPayment.recipientName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Recipient Account</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.recipientAccount}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">SWIFT Code</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.swiftCode}</p>
                </div>

                {selectedPayment.paymentReference && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Payment Reference</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPayment.paymentReference}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                {selectedPayment.status === 'PENDING' && (
                  <button
                    onClick={() => handleVerify(selectedPayment)}
                    disabled={actionLoading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {actionLoading ? 'Processing...' : '✓ Verify Payment'}
                  </button>
                )}

                {selectedPayment.status === 'VERIFIED' && (
                  <button
                    onClick={() => handleSubmitToSwift(selectedPayment)}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {actionLoading ? 'Processing...' : '→ Submit to SWIFT'}
                  </button>
                )}

                {(selectedPayment.status === 'SUBMITTED' || selectedPayment.status === 'COMPLETED') && (
                  <div className="flex-1 text-center text-sm text-gray-600 py-2">
                    Payment has been {selectedPayment.status.toLowerCase()}
                  </div>
                )}

                <button
                  onClick={() => setSelectedPayment(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
