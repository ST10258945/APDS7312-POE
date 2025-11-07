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
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

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
        <div className="mb-6 bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="entity-type" className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                id="entity-type"
                value={filter.entityType || ''}
                onChange={(e) => setFilter({ ...filter, entityType: e.target.value || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="Payment">Payment</option>
                <option value="Employee">Employee</option>
                <option value="Customer">Customer</option>
              </select>
            </div>

            <div>
              <label htmlFor="action" className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <select
                id="action"
                value={filter.action || ''}
                onChange={(e) => setFilter({ ...filter, action: e.target.value || undefined })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-2">
                Results Per Page
              </label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => setLimit(Number.parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                  {logs.map((log) => {
                    const getActionColor = (action: string) => {
                      if (action.includes('SUCCESS') || action === 'VERIFIED' || action === 'SUBMITTED_TO_SWIFT' || action === 'CREATE') {
                        return 'bg-green-100 text-green-800'
                      }
                      if (action.includes('FAIL') || action.includes('ERROR')) {
                        return 'bg-red-100 text-red-800'
                      }
                      if (action.includes('TOKEN')) {
                        return 'bg-purple-100 text-purple-800'
                      }
                      return 'bg-gray-100 text-gray-800'
                    }

                    const getEntityColor = (type: string) => {
                      switch (type) {
                        case 'Payment':
                          return 'bg-blue-100 text-blue-800'
                        case 'Employee':
                          return 'bg-indigo-100 text-indigo-800'
                        case 'Customer':
                          return 'bg-cyan-100 text-cyan-800'
                        default:
                          return 'bg-gray-100 text-gray-800'
                      }
                    }

                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getEntityColor(log.entityType)}`}>
                            {log.entityType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700 bg-gray-50 rounded px-2 py-1">
                          {log.entityId.slice(0, 12)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">{log.ipAddress || 'N/A'}</code>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                          >
                            View Details →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">{selectedLog.action}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-white text-2xl">×</button>
            </div>
            <div className="overflow-auto flex-1 p-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">TIMESTAMP</p>
                <p className="text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">ENTITY TYPE</p>
                <p className="text-sm text-gray-900">{selectedLog.entityType}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">ENTITY ID</p>
                <p className="text-sm font-mono text-gray-900 break-all">{selectedLog.entityId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">IP ADDRESS</p>
                <p className="text-sm text-gray-900">{selectedLog.ipAddress || 'N/A'}</p>
              </div>
              {selectedLog.userAgent && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">USER AGENT</p>
                  <p className="text-xs text-gray-700 break-all">{selectedLog.userAgent}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">METADATA</p>
                {Object.keys(selectedLog.metadata).length > 0 ? (
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48 border border-gray-300">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                ) : (
                  <p className="text-xs text-gray-500 italic">No additional metadata</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
