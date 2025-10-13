'use client'

import { useState, useEffect } from 'react'

export default function AdminDashboard() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const stats = [
    { label: 'Total Orders', value: '0', gradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    { label: 'Revenue', value: '$0', gradient: 'linear-gradient(90deg, #10b981, #34d399)' },
    { label: '3D Print Requests', value: '0', gradient: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
    { label: 'Service Inquiries', value: '0', gradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
  ]

  const quickActions = [
    { title: 'Add Product', description: 'Create a new product listing', href: '/admin/products' },
    { title: 'View Orders', description: 'Manage customer orders', href: '/admin/orders' },
    { title: '3D Print Requests', description: 'Review custom print quotes', href: '/admin/custom-requests' },
    { title: 'Settings', description: 'Configure your site', href: '/admin/settings' },
  ]

  return (
    <div>
      {/* Welcome Section */}
      <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
        <h1 style={{
          fontSize: isMobile ? '28px' : '36px',
          fontWeight: 700,
          marginBottom: '8px',
          margin: 0
        }}>Dashboard</h1>
        <p style={{
          color: '#a1a1aa',
          margin: 0,
          fontSize: isMobile ? '14px' : '16px'
        }}>Welcome to 47 Industries Admin</p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '24px' : '32px'
      }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: '24px',
              transition: 'border-color 0.2s'
            }}
          >
            <p style={{
              fontSize: '14px',
              color: '#71717a',
              marginBottom: '12px',
              margin: 0,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 500
            }}>{stat.label}</p>
            <p style={{
              fontSize: isMobile ? '28px' : '32px',
              fontWeight: 700,
              margin: 0,
              marginBottom: '16px'
            }}>{stat.value}</p>
            <div style={{
              height: '3px',
              borderRadius: '2px',
              background: stat.gradient
            }} />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
        <h2 style={{
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: 700,
          marginBottom: isMobile ? '16px' : '24px'
        }}>Quick Actions</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: isMobile ? '16px' : '24px'
        }}>
          {quickActions.map((action) => (
            <a
              key={action.title}
              href={action.href}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '24px',
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#27272a'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <h3 style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '8px',
                margin: 0
              }}>{action.title}</h3>
              <p style={{
                fontSize: '14px',
                color: '#71717a',
                margin: 0
              }}>{action.description}</p>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{
          fontSize: isMobile ? '20px' : '24px',
          fontWeight: 700,
          marginBottom: isMobile ? '16px' : '24px'
        }}>Recent Activity</h2>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: isMobile ? '32px 16px' : '48px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.2
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="M18 17l-5-5-4 4-4-4" />
            </svg>
          </div>
          <h3 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 700,
            marginBottom: '8px'
          }}>No recent activity</h3>
          <p style={{
            color: '#71717a',
            margin: 0,
            fontSize: isMobile ? '14px' : '16px'
          }}>
            Your recent orders, requests, and updates will appear here
          </p>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Dashboard - Admin - 47 Industries',
}
