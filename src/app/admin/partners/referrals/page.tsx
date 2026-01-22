'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface Referral {
  id: string
  platform: string
  eventType: string
  orderId: string | null
  motorevUserId: string | null
  customerEmail: string | null
  customerName: string | null
  orderTotal: number | null
  signupAt: string | null
  convertedAt: string | null
  partner: {
    id: string
    name: string
    partnerNumber: string
    partnerType: string
  }
  link: {
    code: string
    name: string | null
  } | null
  commission: {
    id: string
    type: string
    amount: number
    status: string
  } | null
  createdAt: string
}

interface Stats {
  totalReferrals: number
  shopOrders: number
  motorevSignups: number
  motorevProConversions: number
  totalOrderValue: number
}

export default function PartnerReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [platformFilter, setPlatformFilter] = useState('all')
  const [eventFilter, setEventFilter] = useState('all')
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [platformFilter, eventFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (platformFilter !== 'all') params.append('platform', platformFilter)
      if (eventFilter !== 'all') params.append('eventType', eventFilter)

      const res = await fetch(`/api/admin/affiliate?${params}`)
      if (res.ok) {
        const data = await res.json()
        setReferrals(data.referrals)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('Failed to load referrals', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      APPROVED: '#3b82f6',
      PAID: '#10b981',
    }
    return colors[status] || '#6b7280'
  }

  const getPlatformLabel = (platform: string) => {
    return platform === 'MOTOREV' ? 'MotoRev' : 'Shop'
  }

  const getEventLabel = (event: string) => {
    const labels: Record<string, string> = {
      ORDER: 'Order',
      SIGNUP: 'Signup',
      PRO_CONVERSION: 'Pro Conversion',
    }
    return labels[event] || event
  }

  const getPartnerTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SERVICE_REFERRAL: '#3b82f6',
      PRODUCT_AFFILIATE: '#10b981',
      BOTH: '#7c3aed',
    }
    return colors[type] || '#6b7280'
  }

  const getPartnerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SERVICE_REFERRAL: 'Service',
      PRODUCT_AFFILIATE: 'Affiliate',
      BOTH: 'Full',
    }
    return labels[type] || type
  }

  return (
    <div style={{ color: '#fff' }}>
      {/* Breadcrumb */}
      <Link
        href="/admin/partners"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#71717a',
          textDecoration: 'none',
          fontSize: '14px',
          marginBottom: '16px',
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Partners
      </Link>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
            Affiliate Referrals
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0 0' }}>
            Track shop orders and MotoRev signups from partner affiliate links
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Total Referrals</p>
            <p style={{ fontSize: '24px', fontWeight: 700 }}>
              {stats.totalReferrals}
            </p>
          </div>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Shop Orders</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
              {stats.shopOrders}
            </p>
          </div>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>MotoRev Signups</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#a78bfa' }}>
              {stats.motorevSignups}
            </p>
          </div>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Pro Conversions</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#7c3aed' }}>
              {stats.motorevProConversions}
            </p>
          </div>
          <div style={{
            padding: '20px',
            background: '#1a1a1a',
            borderRadius: '12px',
            border: '1px solid #27272a',
          }}>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '4px' }}>Total Order Value</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
              {formatCurrency(stats.totalOrderValue)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            background: '#1a1a1a',
            border: '1px solid #3f3f46',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
          }}
        >
          <option value="all">All Platforms</option>
          <option value="SHOP">Shop</option>
          <option value="MOTOREV">MotoRev</option>
        </select>
        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            background: '#1a1a1a',
            border: '1px solid #3f3f46',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
          }}
        >
          <option value="all">All Events</option>
          <option value="ORDER">Orders</option>
          <option value="SIGNUP">Signups</option>
          <option value="PRO_CONVERSION">Pro Conversions</option>
        </select>
      </div>

      {/* Referrals Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
          Loading...
        </div>
      ) : (
        <div style={{
          background: '#1a1a1a',
          borderRadius: '12px',
          border: '1px solid #27272a',
          overflow: 'hidden',
        }}>
          {referrals.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#a1a1aa' }}>
              No referrals found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#27272a' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Partner</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Platform</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Event</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Customer</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Value</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Commission</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500, fontSize: '13px', color: '#a1a1aa' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} style={{ borderBottom: '1px solid #27272a' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {formatDate(referral.createdAt)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Link
                          href={`/admin/partners/${referral.partner.id}`}
                          style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '14px' }}
                        >
                          {referral.partner.name}
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <span style={{ fontSize: '12px', color: '#71717a' }}>
                            {referral.partner.partnerNumber}
                          </span>
                          <span style={{
                            padding: '2px 6px',
                            background: `${getPartnerTypeColor(referral.partner.partnerType)}20`,
                            color: getPartnerTypeColor(referral.partner.partnerType),
                            borderRadius: '4px',
                            fontSize: '10px',
                          }}>
                            {getPartnerTypeLabel(referral.partner.partnerType)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: referral.platform === 'MOTOREV' ? '#7c3aed20' : '#10b98120',
                          color: referral.platform === 'MOTOREV' ? '#a78bfa' : '#34d399',
                        }}>
                          {getPlatformLabel(referral.platform)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {getEventLabel(referral.eventType)}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                        {referral.customerEmail || 'Anonymous'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>
                        {referral.orderTotal ? formatCurrency(referral.orderTotal) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                        {referral.commission ? formatCurrency(referral.commission.amount) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {referral.commission ? (
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: `${getStatusColor(referral.commission.status)}20`,
                            color: getStatusColor(referral.commission.status),
                          }}>
                            {referral.commission.status}
                          </span>
                        ) : (
                          <span style={{ color: '#71717a', fontSize: '12px' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
