'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface Payout {
  id: string
  payoutNumber: string
  amount: number
  method?: string
  reference?: string
  status: string
  paidAt?: string
  createdAt: string
  partner: {
    id: string
    name: string
    partnerNumber: string
  }
  commissions: { id: string; amount: number; type: string }[]
}

interface Stats {
  total: number
  totalAmount: number
  pendingAmount: number
  paidAmount: number
}

export default function PartnerPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchPayouts()
  }, [statusFilter])

  const fetchPayouts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/partners/payouts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPayouts(data.payouts)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching payouts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkPaid = async (id: string, method?: string) => {
    const reference = window.prompt('Enter payment reference (check number, transaction ID, etc.):')
    try {
      const res = await fetch(`/api/admin/partners/payouts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          method: method || undefined,
          reference: reference || undefined,
        }),
      })
      if (res.ok) {
        showToast('Payout marked as paid', 'success')
        fetchPayouts()
      }
    } catch (error) {
      showToast('Failed to update payout', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      PAID: '#10b981',
    }
    return colors[status] || '#6b7280'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PAID', label: 'Paid' },
  ]

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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
          Partner Payouts
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0 0' }}>
          Track and manage partner payments
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>Total Payouts</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700 }}>{stats.total}</p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>Total Amount</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700 }}>{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>Pending</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
              {formatCurrency(stats.pendingAmount)}
            </p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>Paid</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
              {formatCurrency(stats.paidAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ marginBottom: '24px' }}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            minWidth: '180px',
          }}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Payouts List */}
      {loading ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>Loading payouts...</p>
        </div>
      ) : payouts.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>No payouts found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {payouts.map((payout) => (
            <div
              key={payout.id}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '16px' }}>{payout.payoutNumber}</span>
                    <span style={{
                      padding: '2px 8px',
                      background: `${getStatusColor(payout.status)}20`,
                      color: getStatusColor(payout.status),
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>
                      {payout.status}
                    </span>
                    {payout.method && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#27272a',
                        color: '#a1a1aa',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {payout.method}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                    To{' '}
                    <Link href={`/admin/partners/${payout.partner.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {payout.partner.name}
                    </Link>
                    {' '}| {payout.commissions?.length || 0} commission{(payout.commissions?.length || 0) !== 1 ? 's' : ''}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#71717a', fontSize: '13px' }}>
                    Created {formatDate(payout.createdAt)}
                    {payout.paidAt && ` | Paid ${formatDate(payout.paidAt)}`}
                    {payout.reference && ` | Ref: ${payout.reference}`}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontWeight: 700, fontSize: '20px' }}>
                    {formatCurrency(Number(payout.amount))}
                  </span>
                  {payout.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleMarkPaid(payout.id, 'CASH')}
                        style={{
                          padding: '8px 14px',
                          background: '#27272a',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Cash
                      </button>
                      <button
                        onClick={() => handleMarkPaid(payout.id, 'ZELLE')}
                        style={{
                          padding: '8px 14px',
                          background: '#27272a',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Zelle
                      </button>
                      <button
                        onClick={() => handleMarkPaid(payout.id, 'CHECK')}
                        style={{
                          padding: '8px 14px',
                          background: '#27272a',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Check
                      </button>
                      <button
                        onClick={() => handleMarkPaid(payout.id)}
                        style={{
                          padding: '8px 14px',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Mark Paid
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
