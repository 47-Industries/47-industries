'use client'

import { useState, useEffect } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  readAt: string | null
  metadata: any
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    today: 0,
    thisWeek: 0,
  })

  useEffect(() => {
    fetchNotifications()
  }, [filter])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/admin/notifications?filter=${filter}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}/read`, {
        method: 'POST',
      })
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ))
      setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/admin/notifications/read-all', {
        method: 'POST',
      })
      setNotifications(notifications.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      setStats(prev => ({ ...prev, unread: 0 }))
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      })
      setNotifications(notifications.filter(n => n.id !== id))
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        unread: notifications.find(n => n.id === id)?.isRead ? prev.unread : prev.unread - 1
      }))
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ORDER_NEW: '#10b981',
      ORDER_STATUS: '#3b82f6',
      ORDER_REFUND: '#ef4444',
      INVENTORY_LOW: '#f59e0b',
      INVENTORY_OUT: '#ef4444',
      CUSTOM_REQUEST: '#8b5cf6',
      SERVICE_INQUIRY: '#06b6d4',
      REVIEW_NEW: '#f59e0b',
      USER_SIGNUP: '#10b981',
      SYSTEM: '#6b7280',
    }
    return colors[type] || '#6b7280'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ORDER_NEW: 'New Order',
      ORDER_STATUS: 'Order Update',
      ORDER_REFUND: 'Refund',
      INVENTORY_LOW: 'Low Stock',
      INVENTORY_OUT: 'Out of Stock',
      CUSTOM_REQUEST: '3D Print Request',
      SERVICE_INQUIRY: 'Service Inquiry',
      REVIEW_NEW: 'New Review',
      USER_SIGNUP: 'New Customer',
      SYSTEM: 'System',
    }
    return labels[type] || type
  }

  const formatDate = (dateString: string) => {
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

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Notification Center</h1>
          <p style={{ color: '#71717a', marginTop: '8px' }}>Stay updated on important events</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {stats.unread > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
                background: 'transparent',
                color: '#3b82f6',
                border: '1px solid #3b82f6',
                borderRadius: '12px',
                cursor: 'pointer',
              }}
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {[
          { label: 'Total Notifications', value: stats.total, color: '#3b82f6' },
          { label: 'Unread', value: stats.unread, color: '#ef4444' },
          { label: 'Today', value: stats.today, color: '#10b981' },
          { label: 'This Week', value: stats.thisWeek, color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#18181b',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #27272a'
          }}>
            <div style={{ fontSize: '14px', color: '#71717a', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: '#18181b',
        padding: '6px',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: `Unread (${stats.unread})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as 'all' | 'unread')}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              background: filter === tab.key ? '#3b82f6' : 'transparent',
              color: filter === tab.key ? '#ffffff' : '#71717a',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#71717a' }}>
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div style={{
          background: '#18181b',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px solid #27272a'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔔</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </div>
          <div style={{ color: '#71717a' }}>
            {filter === 'unread' ? 'You have no unread notifications' : 'Notifications will appear here when there are updates'}
          </div>
        </div>
      ) : (
        <div style={{
          background: '#18181b',
          borderRadius: '16px',
          border: '1px solid #27272a',
          overflow: 'hidden'
        }}>
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              style={{
                padding: '20px 24px',
                borderBottom: index < notifications.length - 1 ? '1px solid #27272a' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                background: notification.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                transition: 'background 0.2s'
              }}
            >
              {/* Unread indicator */}
              {!notification.isRead && (
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  marginTop: '8px',
                  flexShrink: 0
                }} />
              )}

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: getTypeColor(notification.type),
                    background: `${getTypeColor(notification.type)}20`,
                    padding: '4px 10px',
                    borderRadius: '6px'
                  }}>
                    {getTypeLabel(notification.type)}
                  </span>
                  <span style={{ fontSize: '12px', color: '#71717a' }}>
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: notification.isRead ? 400 : 600,
                  marginBottom: '4px'
                }}>
                  {notification.title}
                </div>
                <div style={{ fontSize: '14px', color: '#a1a1aa' }}>
                  {notification.message}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {notification.link && (
                  <a
                    href={notification.link}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      background: '#27272a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    View
                  </a>
                )}
                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 500,
                      background: 'transparent',
                      color: '#71717a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notification.id)}
                  style={{
                    padding: '8px',
                    fontSize: '13px',
                    background: 'transparent',
                    color: '#71717a',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
