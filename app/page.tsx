'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [allowRegistration, setAllowRegistration] = useState(false)

  useEffect(() => {
    // Check if registration is enabled by testing the API
    const checkRegistration = async () => {
      try {
        const response = await fetch('/api/customer/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: '',
            idNumber: '',
            accountNumber: '',
            username: '',
            email: '',
            password: '',
          }),
        })
        const data = await response.json()
        // If we get error 'Registration disabled', it's disabled
        const isDisabled = data.error?.includes('disabled')
        setAllowRegistration(!isDisabled)
      } catch {
        // If error, assume disabled for safety
        setAllowRegistration(false)
      }
    }
    checkRegistration()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          GlobeWire
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Secure International Payment Portal
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Portal */}
          <div className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💳</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Customer Portal</h2>
            <p className="text-gray-600 mb-6">
              Make secure international payments with our SWIFT-enabled platform
            </p>
            <div className="space-y-3">
              {allowRegistration && (
                <a
                  href="/customer/register"
                  className="block w-full bg-teal-600 text-white py-3 px-6 rounded-md hover:bg-teal-700 transition-colors font-medium"
                >
                  Register
                </a>
              )}
              <a
                href="/customer/login"
                className="block w-full border-2 border-teal-600 text-teal-600 py-3 px-6 rounded-md hover:bg-teal-50 transition-colors font-medium"
              >
                Sign In
              </a>
            </div>
          </div>

          {/* Employee Portal */}
          <div className="bg-white rounded-lg shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👨‍💼</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Employee Portal</h2>
            <p className="text-gray-600 mb-6">
              Verify and process international payments for submission to SWIFT
            </p>
            <div className="space-y-3">
              <a
                href="/employee/login"
                className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-md hover:bg-indigo-700 transition-colors font-medium"
              >
                Employee Sign In
              </a>
              <p className="text-sm text-gray-500">
                Pre-registered staff accounts only
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">🔒 Security Features</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            <div>✓ SSL/TLS Encryption</div>
            <div>✓ CSRF Protection</div>
            <div>✓ Rate Limiting</div>
            <div>✓ Input Validation</div>
            <div>✓ Audit Logging</div>
            <div>✓ Action Tokens</div>
          </div>
        </div>
      </div>
    </div>
  );
}
