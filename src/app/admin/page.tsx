'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Stats {
  ordersCount: number
  revenue: number
  customRequestsCount: number
  serviceInquiriesCount: number
}

interface AnalyticsSnapshot {
  activeUsers: number
  totalPageViews: number
  uniqueVisitors: number
}

interface ActivityItem {
  type: 'order' | 'request' | 'inquiry'
  id: string
  number: string
  name: string
  detail: string
  status: string
  createdAt: string
}

interface PendingSignature {
  contractId: string
  contractNumber: string
  title: string
  status: string
  type: 'client' | 'partner'
  clientId?: string
  clientName?: string
  clientNumber?: string
  partnerId?: string
  partnerName?: string
  partnerNumber?: string
  unsignedCount: number
  totalAdminFields: number
  signedAdminFields: number
}

export default function AdminDashboard() {
  const [isMobile, setIsMobile] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [pendingSignatures, setPendingSignatures] = useState<PendingSignature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data.stats)
          setRecentActivity(data.recentActivity || [])
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  // Fetch analytics separately and refresh every 30 seconds
  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch('/api/admin/analytics?period=24h')
        if (res.ok) {
          const data = await res.json()
          setAnalytics({
            activeUsers: data.activeUsers,
            totalPageViews: data.totalPageViews,
            uniqueVisitors: data.uniqueVisitors
          })
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      }
    }
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 30000)
    return () => clearInterval(interval)
  }, [])

  // Fetch pending signatures
  useEffect(() => {
    async function fetchPendingSignatures() {
      try {
        const res = await fetch('/api/admin/pending-signatures')
        if (res.ok) {
          const data = await res.json()
          setPendingSignatures(data.pendingContracts || [])
        }
      } catch (error) {
        console.error('Failed to fetch pending signatures:', error)
      }
    }
    fetchPendingSignatures()
  }, [])

  const statsDisplay = [
    { label: 'Total Orders', value: loading ? '...' : (stats?.ordersCount ?? 0).toString(), gradient: 'linear-gradient(90deg, #3b82f6, #60a5fa)' },
    { label: 'Revenue', value: loading ? '...' : `$${(stats?.revenue ?? 0).toLocaleString()}`, gradient: 'linear-gradient(90deg, #10b981, #34d399)' },
    { label: '3D Print Requests', value: loading ? '...' : (stats?.customRequestsCount ?? 0).toString(), gradient: 'linear-gradient(90deg, #8b5cf6, #a78bfa)' },
    { label: 'Service Inquiries', value: loading ? '...' : (stats?.serviceInquiriesCount ?? 0).toString(), gradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)' },
  ]

  const getActivityIcon = (type: 'order' | 'request' | 'inquiry') => {
    switch (type) {
      case 'order':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        )
      case 'request':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
          </svg>
        )
      case 'inquiry':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )
    }
  }

  const getActivityColor = (type: 'order' | 'request' | 'inquiry') => {
    switch (type) {
      case 'order': return '#3b82f6'
      case 'request': return '#8b5cf6'
      case 'inquiry': return '#f59e0b'
    }
  }

  const getActivityLink = (item: ActivityItem) => {
    switch (item.type) {
      case 'order': return `/admin/orders/${item.id}`
      case 'request': return `/admin/custom-requests/${item.id}`
      case 'inquiry': return `/admin/inquiries/${item.id}`
    }
  }

  const getActivityLabel = (type: 'order' | 'request' | 'inquiry') => {
    switch (type) {
      case 'order': return 'Order'
      case 'request': return '3D Print'
      case 'inquiry': return 'Inquiry'
    }
  }

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase()
    if (s === 'paid' || s === 'completed' || s === 'delivered') return '#10b981'
    if (s === 'pending' || s === 'new') return '#f59e0b'
    if (s === 'cancelled' || s === 'rejected') return '#ef4444'
    if (s === 'shipped' || s === 'processing' || s === 'quoted') return '#3b82f6'
    return '#71717a'
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

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

      {/* Live Analytics Bar */}
      <Link
        href="/admin/analytics"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1))',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'border-color 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              animation: 'pulse 2s infinite'
            }} />
            <span style={{ fontSize: '14px', color: '#a1a1aa' }}>Active Now:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#10b981' }}>
              {analytics?.activeUsers ?? 0}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#a1a1aa' }}>Today's Views:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
              {analytics?.totalPageViews?.toLocaleString() ?? 0}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', color: '#a1a1aa' }}>Unique Visitors:</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#8b5cf6' }}>
              {analytics?.uniqueVisitors?.toLocaleString() ?? 0}
            </span>
          </div>
        </div>
        <span style={{ color: '#71717a', fontSize: '14px' }}>View Analytics →</span>
      </Link>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: isMobile ? '16px' : '24px',
        marginBottom: isMobile ? '24px' : '32px'
      }}>
        {statsDisplay.map((stat) => (
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

      {/* Pending Signatures - Only show if there are pending signatures */}
      {pendingSignatures.length > 0 && (
        <div style={{ marginBottom: isMobile ? '24px' : '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: isMobile ? '16px' : '24px' }}>
            <h2 style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: 700,
              margin: 0
            }}>Pending Signatures</h2>
            <span style={{
              background: '#f59e0b',
              color: '#000',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '12px'
            }}>
              {pendingSignatures.length}
            </span>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            overflow: 'hidden'
          }}>
            {pendingSignatures.map((sig, index) => (
              <Link
                key={sig.contractId}
                href={sig.type === 'client' ? `/admin/clients/${sig.clientId}` : `/admin/partners/${sig.partnerId}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: isMobile ? '16px' : '20px 24px',
                  borderBottom: index < pendingSignatures.length - 1 ? '1px solid #27272a' : 'none',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#27272a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: sig.type === 'client' ? '#3b82f6' : '#8b5cf6',
                      background: sig.type === 'client' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {sig.type === 'client' ? 'Client' : 'Partner'}
                    </span>
                    {sig.contractNumber && (
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#ffffff'
                      }}>
                        {sig.contractNumber}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#a1a1aa',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {sig.type === 'client' ? sig.clientName : sig.partnerName} - {sig.title}
                  </div>
                </div>

                {/* Status */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '4px',
                  flexShrink: 0
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#f59e0b'
                  }}>
                    {sig.signedAdminFields} of {sig.totalAdminFields} signed
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#71717a'
                  }}>
                    {sig.unsignedCount} field{sig.unsignedCount !== 1 ? 's' : ''} need signature
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: isMobile ? '32px 16px' : '48px 24px', textAlign: 'center' }}>
              <p style={{ color: '#71717a', margin: 0 }}>Loading activity...</p>
            </div>
          ) : recentActivity.length === 0 ? (
            <div style={{ padding: isMobile ? '32px 16px' : '48px 24px', textAlign: 'center' }}>
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
          ) : (
            <div>
              {recentActivity.map((item, index) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={getActivityLink(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: isMobile ? '16px' : '20px 24px',
                    borderBottom: index < recentActivity.length - 1 ? '1px solid #27272a' : 'none',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#27272a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: `${getActivityColor(item.type)}20`,
                    color: getActivityColor(item.type),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getActivityIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px'
                    }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: getActivityColor(item.type),
                        background: `${getActivityColor(item.type)}20`,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {getActivityLabel(item.type)}
                      </span>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#ffffff'
                      }}>
                        {item.number}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#a1a1aa',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.name} • {item.detail}
                    </div>
                  </div>

                  {/* Status & Time */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px',
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: getStatusColor(item.status),
                      background: `${getStatusColor(item.status)}20`,
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {item.status}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: '#71717a'
                    }}>
                      {formatTimeAgo(item.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
