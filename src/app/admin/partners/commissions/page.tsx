'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface Commission {
  id: string
  type: string
  baseAmount: number
  rate: number
  amount: number
  status: string
  createdAt: string
  source: 'service' | 'affiliate'
  description: string
  partner: {
    id: string
    name: string
    partnerNumber: string
    partnerType?: string
  }
  lead?: {
    id: string
    businessName: string
    leadNumber: string
  }
  referral?: {
    id: string
    platform: string
    eventType: string
    orderId: string | null
    customerEmail: string | null
  }
  payout?: {
    id: string
    payoutNumber: string
    status: string
  }
}

interface Stats {
  total: number
  totalAmount: number
  pendingAmount: number
  approvedAmount: number
  paidAmount: number
}

export default function PartnerCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set())
  const [isMobile, setIsMobile] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchCommissions()
  }, [statusFilter, sourceFilter])

  const fetchCommissions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (sourceFilter !== 'all') params.append('source', sourceFilter)

      const res = await fetch(`/api/admin/partners/commissions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCommissions(data.commissions)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/partners/commissions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      if (res.ok) {
        showToast('Commission approved', 'success')
        fetchCommissions()
      }
    } catch (error) {
      showToast('Failed to approve', 'error')
    }
  }

  const handleBulkApprove = async () => {
    if (selectedCommissions.size === 0) return
    try {
      await Promise.all(
        Array.from(selectedCommissions).map(id =>
          fetch(`/api/admin/partners/commissions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'APPROVED' }),
          })
        )
      )
      showToast(`${selectedCommissions.size} commissions approved`, 'success')
      setSelectedCommissions(new Set())
      fetchCommissions()
    } catch (error) {
      showToast('Failed to approve commissions', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      APPROVED: '#3b82f6',
      PAID: '#10b981',
    }
    return colors[status] || '#6b7280'
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      FIRST_SALE: '#3b82f6',
      RECURRING: '#8b5cf6',
    }
    return colors[type] || '#6b7280'
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
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PAID', label: 'Paid' },
  ]

  const sources = [
    { value: 'all', label: 'All Sources' },
    { value: 'service', label: 'Service Referrals' },
    { value: 'affiliate', label: 'Affiliate Sales' },
  ]

  const getSourceColor = (source: string) => {
    return source === 'service' ? '#3b82f6' : '#10b981'
  }

  const getSourceLabel = (source: string) => {
    return source === 'service' ? 'Service' : 'Affiliate'
  }

  const pendingCommissions = commissions.filter(c => c.status === 'PENDING')

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
          Partner Commissions
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0 0' }}>
          Manage and approve partner commissions
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
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>Total Commissions</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700 }}>{formatCurrency(stats.totalAmount)}</p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>Pending Approval</p>
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
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>Approved (Unpaid)</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
              {formatCurrency(stats.approvedAmount)}
            </p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>Paid Out</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
              {formatCurrency(stats.paidAmount)}
            </p>
          </div>
        </div>
      )}

      {/* Filter & Actions */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
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
            minWidth: '150px',
          }}
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            minWidth: '160px',
          }}
        >
          {sources.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        {selectedCommissions.size > 0 && (
          <button
            onClick={handleBulkApprove}
            style={{
              padding: '12px 20px',
              background: '#10b981',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Approve {selectedCommissions.size} Selected
          </button>
        )}

        {pendingCommissions.length > 0 && selectedCommissions.size === 0 && (
          <button
            onClick={() => setSelectedCommissions(new Set(pendingCommissions.map(c => c.id)))}
            style={{
              padding: '12px 20px',
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Select All Pending ({pendingCommissions.length})
          </button>
        )}
      </div>

      {/* Commissions List */}
      {loading ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>Loading commissions...</p>
        </div>
      ) : commissions.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>No commissions found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {commissions.map((commission) => {
            const commissionKey = `${commission.source}-${commission.id}`
            return (
            <div
              key={commissionKey}
              style={{
                background: '#18181b',
                border: selectedCommissions.has(commissionKey) ? '2px solid #3b82f6' : '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {commission.status === 'PENDING' && (
                    <input
                      type="checkbox"
                      checked={selectedCommissions.has(commissionKey)}
                      onChange={(e) => {
                        const newSet = new Set(selectedCommissions)
                        if (e.target.checked) {
                          newSet.add(commissionKey)
                        } else {
                          newSet.delete(commissionKey)
                        }
                        setSelectedCommissions(newSet)
                      }}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600 }}>{commission.description}</span>
                      <span style={{
                        padding: '2px 8px',
                        background: `${getSourceColor(commission.source)}20`,
                        color: getSourceColor(commission.source),
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {getSourceLabel(commission.source)}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        background: `${getTypeColor(commission.type)}20`,
                        color: getTypeColor(commission.type),
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {commission.type.replace('_', ' ')}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        background: `${getStatusColor(commission.status)}20`,
                        color: getStatusColor(commission.status),
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {commission.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '13px' }}>
                      <Link href={`/admin/partners/${commission.partner.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                        {commission.partner.name}
                      </Link>
                      {commission.rate ? ` | ${commission.rate}% of ${formatCurrency(Number(commission.baseAmount))}` : ''}
                      {' '}| {formatDate(commission.createdAt)}
                      {commission.payout && (
                        <span style={{ color: '#71717a' }}> | Payout: {commission.payout.payoutNumber}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 700, fontSize: '18px', color: '#10b981' }}>
                    {formatCurrency(Number(commission.amount))}
                  </span>
                  {commission.status === 'PENDING' && (
                    <button
                      onClick={() => handleApprove(commission.id)}
                      style={{
                        padding: '6px 14px',
                        background: '#10b981',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  )
}
