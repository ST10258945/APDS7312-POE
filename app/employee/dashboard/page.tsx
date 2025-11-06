'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { LoadingSpinner, Modal, useToast, Button } from '@/app/components'

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
  const toast = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'SUBMITTED'>('ALL')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    type: 'verify' | 'submit' | null
    payment: Payment | null
  }>({ isOpen: false, type: null, payment: null })

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setLoading(true)

    const response = await api.get<{ payments: Payment[] }>('/api/payments/list')

    if (response.ok && response.data) {
      setPayments(response.data.payments || [])
    } else {
      const errorMessage = response.userMessage || response.error || 'Failed to load payments'
      toast.error(errorMessage)
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
    // Close Payment Details modal first, then open confirmation modal
    setSelectedPayment(null)
    // Small delay to allow modal close animation
    setTimeout(() => {
      setConfirmModal({ isOpen: true, type: 'verify', payment })
    }, 200)
  }

  const handleSubmitToSwift = async (payment: Payment) => {
    // Close Payment Details modal first, then open confirmation modal
    setSelectedPayment(null)
    // Small delay to allow modal close animation
    setTimeout(() => {
      setConfirmModal({ isOpen: true, type: 'submit', payment })
    }, 200)
  }

  const confirmAction = async () => {
    if (!confirmModal.payment || !confirmModal.type) return

    const payment = confirmModal.payment
    setActionLoading(true)
    setConfirmModal({ isOpen: false, type: null, payment: null })

    try {
      if (confirmModal.type === 'verify') {
        const actionToken = await requestActionToken('VERIFY_PAYMENT')

        const response = await api.post('/api/payments/verify', {
          paymentId: payment.id,
          actionToken,
        })

        if (response.ok) {
          toast.success('Payment verified successfully!')
          setSelectedPayment(null)
          await loadPayments()
        } else {
          toast.error(response.userMessage || response.error || 'Failed to verify payment')
        }
      } else if (confirmModal.type === 'submit') {
        const actionToken = await requestActionToken('SUBMIT_TO_SWIFT')

        const response = await api.post('/api/employee/submit-to-swift', {
          paymentId: payment.id,
          actionToken,
        })

        if (response.ok) {
          toast.success('Payment submitted to SWIFT successfully!')
          setSelectedPayment(null)
          await loadPayments()
        } else {
          toast.error(response.userMessage || response.error || 'Failed to submit to SWIFT')
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPayments =
    filter === 'ALL' ? payments : payments.filter((p) => p.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'VERIFIED':
        return 'bg-blue-100 text-blue-800'
      case 'SUBMITTED':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast.ToastContainer()}
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">GlobeWire Employee Portal</h1>
            <p className="text-sm text-gray-600">International Payment Verification</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-150"
            aria-label="Logout"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          {(['ALL', 'PENDING', 'VERIFIED', 'SUBMITTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
              aria-pressed={filter === status}
              aria-label={`Filter by ${status}`}
            >
              {status}
            </button>
          ))}
          <button
            onClick={loadPayments}
            disabled={loading}
            className="ml-auto px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-all duration-150 hover:shadow-sm"
            aria-label="Refresh payments"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Payment List */}
        {loading ? (
          <LoadingSpinner text="Loading payments..." />
        ) : filteredPayments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No payments found</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
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
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-150">
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
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors duration-300 ${getStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium transition-colors duration-150"
                          aria-label={`View payment ${payment.transactionId}`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null, payment: null })}
        title={
          confirmModal.type === 'verify'
            ? 'Verify Payment'
            : confirmModal.type === 'submit'
            ? 'Submit to SWIFT'
            : 'Confirm Action'
        }
      >
        {confirmModal.payment && (
          <div className="space-y-4">
            <p className="text-gray-700">
              {confirmModal.type === 'verify' && (
                <>
                  Verify payment of <strong>{confirmModal.payment.currency} {confirmModal.payment.amount}</strong> to{' '}
                  <strong>{confirmModal.payment.recipientName}</strong>?
                </>
              )}
              {confirmModal.type === 'submit' && (
                <>
                  Submit payment <strong>{confirmModal.payment.transactionId}</strong> to SWIFT for processing?
                </>
              )}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="secondary"
                onClick={() => setConfirmModal({ isOpen: false, type: null, payment: null })}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={confirmModal.type === 'verify' ? 'primary' : 'primary'}
                onClick={confirmAction}
                loading={actionLoading}
                className={confirmModal.type === 'submit' ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' : ''}
              >
                {confirmModal.type === 'verify' ? 'Verify Payment' : 'Submit to SWIFT'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={() => setSelectedPayment(null)}
          title="Payment Details"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.transactionId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Status</p>
                <p className="mt-1">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-colors duration-300 ${getStatusColor(
                      selectedPayment.status
                    )}`}
                  >
                    {selectedPayment.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Amount</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {selectedPayment.currency} {selectedPayment.amount}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedPayment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <hr />

            <div>
              <p className="text-sm font-medium text-gray-500">Customer</p>
              <p className="mt-1 text-sm text-gray-900">{selectedPayment.customer?.fullName}</p>
              <p className="text-xs text-gray-600">{selectedPayment.customer?.email}</p>
            </div>

            <hr />

            <div>
              <p className="text-sm font-medium text-gray-500">Recipient Name</p>
              <p className="mt-1 text-sm text-gray-900">{selectedPayment.recipientName}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Recipient Account</p>
              <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.recipientAccount}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">SWIFT Code</p>
              <p className="mt-1 text-sm text-gray-900 font-mono">{selectedPayment.swiftCode}</p>
            </div>

            {selectedPayment.paymentReference && (
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Reference</p>
                <p className="mt-1 text-sm text-gray-900">{selectedPayment.paymentReference}</p>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            {selectedPayment.status === 'PENDING' && (
              <Button
                onClick={() => handleVerify(selectedPayment)}
                disabled={actionLoading}
                loading={actionLoading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
              >
                ✓ Verify Payment
              </Button>
            )}

            {selectedPayment.status === 'VERIFIED' && (
              <Button
                onClick={() => handleSubmitToSwift(selectedPayment)}
                disabled={actionLoading}
                loading={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500"
              >
                → Submit to SWIFT
              </Button>
            )}

            {(selectedPayment.status === 'SUBMITTED' || selectedPayment.status === 'COMPLETED') && (
              <div className="flex-1 text-center text-sm text-gray-600 py-2">
                Payment has been {selectedPayment.status.toLowerCase()}
              </div>
            )}

            <Button variant="secondary" onClick={() => setSelectedPayment(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}