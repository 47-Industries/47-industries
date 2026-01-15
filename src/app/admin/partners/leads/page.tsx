'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'

interface Lead {
  id: string
  leadNumber: string
  businessName: string
  contactName: string
  email: string
  phone?: string
  website?: string
  description?: string
  status: string
  notes?: string
  clientId?: string
  closedAt?: string
  createdAt: string
  partner: {
    id: string
    name: string
    partnerNumber: string
  }
  _count: {
    commissions: number
  }
}

interface Stats {
  total: number
  byStatus: Record<string, number>
  converted: number
}

export default function PartnerLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
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
    fetchLeads()
  }, [statusFilter])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/partners/leads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: '#3b82f6',
      CONTACTED: '#8b5cf6',
      QUALIFIED: '#f59e0b',
      CONVERTED: '#10b981',
      LOST: '#ef4444',
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

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'QUALIFIED', label: 'Qualified' },
    { value: 'CONVERTED', label: 'Converted' },
    { value: 'LOST', label: 'Lost' },
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
          Partner Leads
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0 0' }}>
          All leads submitted by partners
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>Total</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700 }}>{stats.total}</p>
          </div>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div key={status} style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '16px',
            }}>
              <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>{status}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: getStatusColor(status) }}>
                {count}
              </p>
            </div>
          ))}
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

      {/* Leads List */}
      {loading ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>Loading leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>No leads found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {leads.map((lead) => (
            <div
              key={lead.id}
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
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '16px' }}>{lead.businessName}</span>
                    <span style={{ color: '#71717a', fontSize: '13px' }}>{lead.leadNumber}</span>
                    <span style={{
                      padding: '2px 8px',
                      background: `${getStatusColor(lead.status)}20`,
                      color: getStatusColor(lead.status),
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>
                      {lead.status}
                    </span>
                    {lead.clientId && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#10b98120',
                        color: '#10b981',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        Client
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                    {lead.contactName} | {lead.email}
                    {lead.phone && ` | ${lead.phone}`}
                  </p>
                  <p style={{ margin: '6px 0 0 0', color: '#71717a', fontSize: '13px' }}>
                    From{' '}
                    <Link href={`/admin/partners/${lead.partner.id}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                      {lead.partner.name}
                    </Link>
                    {' '}| Submitted {formatDate(lead.createdAt)}
                    {lead.closedAt && ` | Closed ${formatDate(lead.closedAt)}`}
                  </p>
                </div>
                <Link
                  href={`/admin/partners/leads/${lead.id}`}
                  style={{
                    padding: '8px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  View
                </Link>
              </div>
              {lead.description && (
                <p style={{
                  margin: '12px 0 0 0',
                  padding: '12px',
                  background: '#0a0a0a',
                  borderRadius: '6px',
                  color: '#a1a1aa',
                  fontSize: '13px',
                  lineHeight: '1.5',
                }}>
                  {lead.description.length > 200 ? `${lead.description.substring(0, 200)}...` : lead.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
