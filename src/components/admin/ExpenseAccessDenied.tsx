'use client'

import Link from 'next/link'

interface ExpenseAccessDeniedProps {
  reason?: string
}

export default function ExpenseAccessDenied({ reason }: ExpenseAccessDeniedProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '32px',
      textAlign: 'center'
    }}>
      {/* Lock Icon */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h1 style={{
        fontSize: '24px',
        fontWeight: 700,
        color: '#ffffff',
        marginBottom: '12px'
      }}>
        Access Restricted
      </h1>

      <p style={{
        fontSize: '14px',
        color: '#a1a1aa',
        maxWidth: '400px',
        lineHeight: 1.6,
        marginBottom: '8px'
      }}>
        Only team members who split company expenses can view this section.
      </p>

      {reason && (
        <p style={{
          fontSize: '12px',
          color: '#71717a',
          marginBottom: '24px'
        }}>
          {reason}
        </p>
      )}

      <Link
        href="/admin"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 20px',
          borderRadius: '8px',
          background: '#3b82f6',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'background 0.15s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#2563eb'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#3b82f6'
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Return to Dashboard
      </Link>
    </div>
  )
}
