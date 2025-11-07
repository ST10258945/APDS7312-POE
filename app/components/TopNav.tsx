'use client'

import Link from 'next/link'

interface TopNavProps {
  title?: string
  showHomeLink?: boolean
}

/**
 * Top navigation bar with optional home link
 */
export function TopNav({ title, showHomeLink = true }: Readonly<TopNavProps>) {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div>
          {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
        </div>
        {showHomeLink && (
          <Link
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            aria-label="Back to home"
          >
            ← Back to Home
          </Link>
        )}
      </div>
    </nav>
  )
}
