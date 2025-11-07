'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api-client'
import { LoadingSpinner, Button } from '@/app/components'

interface AuditLog {
  id: string
  entityType: string
  entityId: string
  action: string
  ipAddress: string | null
  userAgent: string | null
  metadata: Record<string, any>
  timestamp: string
}

export default function AuditLogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<{ entityType?: string; action?: string }>({})
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    loadLogs()
  }, [filter, limit])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.entityType) params.append('entityType', filter.entityType)
      if (filter.action) params.append('action', filter.action)
      params.append('limit', limit.toString())

      const response = await api.get<{ logs: AuditLog[] }>(`/api/audit-logs?${params}`)

      if (response.ok && response.data) {
        setLogs(response.data.logs)
      } else {
        console.error('Failed to load audit logs:', response.error)
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await api.post('/api/logout', {})
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-600">System activity and security events</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/employee/dashboard')}
            >
              ← Back to Dashboard
            </Button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium transition-colors duration-150"
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                value={filter.entityType || ''}
                onChange={(e) => setFilter({ ...filter, entityType: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Types</option>
                <option value="Payment">Payment</option>
                <option value="Employee">Employee</option>
                <option value="Customer">Customer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                value={filter.action || ''}
                onChange={(e) => setFilter({ ...filter, action: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Actions</option>
                <option value="CREATE">CREATE</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="SUBMITTED_TO_SWIFT">SUBMITTED_TO_SWIFT</option>
                <option value="ACTION_TOKEN_ISSUED">ACTION_TOKEN_ISSUED</option>
                <option value="ACTION_TOKEN_CONSUMED">ACTION_TOKEN_CONSUMED</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limit
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <LoadingSpinner text="Loading audit logs..." />
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No audit logs found</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {log.entityType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        {log.entityId.slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {log.ipAddress || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-700">View</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-w-xs">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
