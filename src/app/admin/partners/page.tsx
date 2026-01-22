'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Partner {
  id: string
  partnerNumber: string
  name: string
  email: string
  phone?: string
  company?: string
  commissionType: string
  firstSaleRate: number
  recurringRate: number
  status: string
  partnerType: 'SERVICE_REFERRAL' | 'PRODUCT_AFFILIATE' | 'BOTH'
  createdAt: string
  totalEarned: number
  pendingAmount: number
  totalPaid: number
  _count: {
    leads: number
    commissions: number
    payouts: number
  }
  user?: { id: string; email: string }
}

interface Stats {
  total: number
  active: number
  totalLeads: number
  totalCommissions: number
  pendingPayouts: number
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchPartners()
  }, [statusFilter, typeFilter])

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/partners?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPartners(data.partners)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching partners:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPartners()
  }

  const handleDeletePartner = async (partnerId: string, partnerName: string) => {
    if (!confirm(`Are you sure you want to delete ${partnerName}? This cannot be undone if they have no financial records.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/partners/${partnerId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.softDeleted) {
          showToast('Partner marked as inactive (has financial records)', 'success')
        } else {
          showToast('Partner deleted', 'success')
        }
        fetchPartners()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to delete partner', 'error')
      }
    } catch (error) {
      showToast('Failed to delete partner', 'error')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: '#10b981',
      INACTIVE: '#6b7280',
      PENDING: '#f59e0b',
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
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
  ]

  const partnerTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'SERVICE_REFERRAL', label: 'Service Referral' },
    { value: 'PRODUCT_AFFILIATE', label: 'Product Affiliate' },
    { value: 'BOTH', label: 'Full Partner' },
  ]

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      SERVICE_REFERRAL: '#3b82f6',
      PRODUCT_AFFILIATE: '#10b981',
      BOTH: '#7c3aed',
    }
    return colors[type] || '#6b7280'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SERVICE_REFERRAL: 'Service Referral',
      PRODUCT_AFFILIATE: 'Product Affiliate',
      BOTH: 'Full Partner',
    }
    return labels[type] || type
  }

  return (
    <div style={{ color: '#fff' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            Partners
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0 0' }}>
            Manage partner relationships, leads, and commissions
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Partner
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '13px', textTransform: 'uppercase' }}>
              Total Partners
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 700 }}>
              {stats.total}
            </p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '13px', textTransform: 'uppercase' }}>
              Active Partners
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
              {stats.active}
            </p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '13px', textTransform: 'uppercase' }}>
              Total Leads
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>
              {stats.totalLeads}
            </p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '13px', textTransform: 'uppercase' }}>
              Total Commissions
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
              {formatCurrency(stats.totalCommissions)}
            </p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '13px', textTransform: 'uppercase' }}>
              Pending Payouts
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
              {formatCurrency(stats.pendingPayouts)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search by name, email, or partner number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </form>
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{
            padding: '12px 16px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            minWidth: '170px',
          }}
        >
          {partnerTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {/* Quick Links */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap',
      }}>
        <Link
          href="/admin/partners/leads"
          style={{
            padding: '10px 16px',
            background: '#27272a',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          All Leads
        </Link>
        <Link
          href="/admin/partners/commissions"
          style={{
            padding: '10px 16px',
            background: '#27272a',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          All Commissions
        </Link>
        <Link
          href="/admin/partners/payouts"
          style={{
            padding: '10px 16px',
            background: '#27272a',
            border: '1px solid #3f3f46',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          All Payouts
        </Link>
      </div>

      {/* Partners List */}
      {loading ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>Loading partners...</p>
        </div>
      ) : partners.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <svg
            style={{ width: '48px', height: '48px', margin: '0 auto 16px', color: '#71717a' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px',
          }}>No partners yet</h3>
          <p style={{ color: '#71717a', margin: '0 0 20px 0' }}>
            Add your first partner to start tracking leads and commissions
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Add Partner
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {partners.map((partner) => (
            <div
              key={partner.id}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '16px',
                padding: '20px 24px',
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '16px',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: '18px' }}>{partner.name}</span>
                    <span style={{ color: '#71717a', fontSize: '14px' }}>{partner.partnerNumber}</span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: `${getStatusColor(partner.status)}20`,
                      color: getStatusColor(partner.status),
                    }}>
                      {partner.status}
                    </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: `${getTypeColor(partner.partnerType)}20`,
                      color: getTypeColor(partner.partnerType),
                    }}>
                      {getTypeLabel(partner.partnerType)}
                    </span>
                    {partner.user && (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: '#3b82f620',
                        color: '#3b82f6',
                      }}>
                        Portal Access
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#a1a1aa', margin: 0, fontSize: '14px' }}>
                    {partner.email}
                    {partner.company && ` | ${partner.company}`}
                    {` | Partner since ${formatDate(partner.createdAt)}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    href={`/admin/partners/${partner.id}`}
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      background: '#3b82f6',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleDeletePartner(partner.id, partner.name)}
                    style={{
                      padding: '8px 12px',
                      background: 'transparent',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#71717a',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                    title="Delete partner"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)',
                gap: '16px',
              }}>
                {/* Commission Rates */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Commission Rates
                  </p>
                  <p style={{ margin: '0 0 2px 0', fontWeight: 500 }}>
                    {partner.firstSaleRate}% First Sale
                  </p>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                    {partner.recurringRate}% Recurring
                  </p>
                </div>

                {/* Leads */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Leads
                  </p>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '18px', color: '#3b82f6' }}>
                    {partner._count.leads}
                  </p>
                </div>

                {/* Total Earned */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Total Earned
                  </p>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '18px', color: '#10b981' }}>
                    {formatCurrency(partner.totalEarned)}
                  </p>
                </div>

                {/* Pending */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Pending
                  </p>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '18px', color: partner.pendingAmount > 0 ? '#f59e0b' : '#71717a' }}>
                    {formatCurrency(partner.pendingAmount)}
                  </p>
                </div>

                {/* Paid Out */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Paid Out
                  </p>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '18px' }}>
                    {formatCurrency(partner.totalPaid)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Partner Modal */}
      {showCreateModal && (
        <CreatePartnerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(partner, inviteSent) => {
            setShowCreateModal(false)
            if (inviteSent) {
              showToast('Partner created and invite email sent!', 'success')
            } else {
              showToast('Partner created successfully', 'success')
            }
            router.push(`/admin/partners/${partner.id}`)
          }}
        />
      )}
    </div>
  )
}

interface ExistingUser {
  id: string
  email: string
  name: string | null
  role: string
}

// Create Partner Modal Component
function CreatePartnerModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (partner: Partner, inviteSent: boolean) => void
}) {
  const [saving, setSaving] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([])
  const [userMode, setUserMode] = useState<'new' | 'existing'>('new')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    commissionType: 'TIERED',
    firstSaleRate: '50',
    recurringRate: '30',
    userId: '',
    partnerType: 'BOTH' as 'SERVICE_REFERRAL' | 'PRODUCT_AFFILIATE' | 'BOTH',
  })
  const { showToast } = useToast()

  // Fetch existing users when switching to existing mode
  useEffect(() => {
    if (userMode === 'existing' && existingUsers.length === 0) {
      fetchExistingUsers()
    }
  }, [userMode])

  const fetchExistingUsers = async () => {
    try {
      setLoadingUsers(true)
      // Fetch all users (any role can become a partner)
      const res = await fetch('/api/admin/users?limit=100')
      if (res.ok) {
        const data = await res.json()
        // Filter out users who are already partners
        setExistingUsers(data.users.filter((u: any) => !u.partner))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUserSelect = (userId: string) => {
    const user = existingUsers.find(u => u.id === userId)
    if (user) {
      setFormData({
        ...formData,
        userId,
        name: user.name || '',
        email: user.email || '',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      showToast('Name and email are required', 'warning')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: userMode === 'existing' ? formData.userId : undefined,
          firstSaleRate: parseFloat(formData.firstSaleRate),
          recurringRate: parseFloat(formData.recurringRate),
          partnerType: formData.partnerType,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        onSuccess(data.partner, data.inviteSent)
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to create partner', 'error')
      }
    } catch (error) {
      console.error('Error creating partner:', error)
      showToast('Failed to create partner', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div style={{
        background: '#18181b',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '550px',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid #27272a',
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          background: '#18181b',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Add New Partner</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px' }}>
            {/* User Mode Selection */}
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
              Link to User Account
            </h3>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setUserMode('new')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: userMode === 'new' ? '#3b82f620' : '#0a0a0a',
                  border: userMode === 'new' ? '2px solid #3b82f6' : '1px solid #27272a',
                  borderRadius: '8px',
                  color: userMode === 'new' ? '#3b82f6' : '#a1a1aa',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ marginBottom: '4px' }}>New User</div>
                <div style={{ fontSize: '12px', fontWeight: 400 }}>Send invite email</div>
              </button>
              <button
                type="button"
                onClick={() => setUserMode('existing')}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: userMode === 'existing' ? '#3b82f620' : '#0a0a0a',
                  border: userMode === 'existing' ? '2px solid #3b82f6' : '1px solid #27272a',
                  borderRadius: '8px',
                  color: userMode === 'existing' ? '#3b82f6' : '#a1a1aa',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <div style={{ marginBottom: '4px' }}>Existing User</div>
                <div style={{ fontSize: '12px', fontWeight: 400 }}>Select from list</div>
              </button>
            </div>

            {/* Existing User Selector */}
            {userMode === 'existing' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Select User *
                </label>
                {loadingUsers ? (
                  <div style={{ padding: '12px', color: '#71717a', fontSize: '14px' }}>Loading users...</div>
                ) : (
                  <select
                    value={formData.userId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#0a0a0a',
                      border: '1px solid #27272a',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select a user...</option>
                    {existingUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email} {user.name && `(${user.email})`} {user.role !== 'CUSTOMER' && `[${user.role}]`}
                      </option>
                    ))}
                  </select>
                )}
                {existingUsers.length === 0 && !loadingUsers && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#f59e0b' }}>
                    No available users found. All existing users are already partners.
                  </p>
                )}
              </div>
            )}

            {/* Partner Type Selection */}
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
              Partner Type
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, partnerType: 'BOTH' })}
                style={{
                  padding: '12px 16px',
                  background: formData.partnerType === 'BOTH' ? '#7c3aed20' : '#0a0a0a',
                  border: formData.partnerType === 'BOTH' ? '2px solid #7c3aed' : '1px solid #27272a',
                  borderRadius: '8px',
                  color: formData.partnerType === 'BOTH' ? '#a78bfa' : '#a1a1aa',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#7c3aed',
                  }} />
                  <span>Full Partner (Recommended)</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 400, marginTop: '4px', marginLeft: '16px' }}>
                  Can refer service leads and earn affiliate commissions
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, partnerType: 'SERVICE_REFERRAL' })}
                style={{
                  padding: '12px 16px',
                  background: formData.partnerType === 'SERVICE_REFERRAL' ? '#3b82f620' : '#0a0a0a',
                  border: formData.partnerType === 'SERVICE_REFERRAL' ? '2px solid #3b82f6' : '1px solid #27272a',
                  borderRadius: '8px',
                  color: formData.partnerType === 'SERVICE_REFERRAL' ? '#60a5fa' : '#a1a1aa',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                  }} />
                  <span>Service Referral Only</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 400, marginTop: '4px', marginLeft: '16px' }}>
                  For partners who refer clients for web/app dev or 3D printing
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, partnerType: 'PRODUCT_AFFILIATE' })}
                style={{
                  padding: '12px 16px',
                  background: formData.partnerType === 'PRODUCT_AFFILIATE' ? '#10b98120' : '#0a0a0a',
                  border: formData.partnerType === 'PRODUCT_AFFILIATE' ? '2px solid #10b981' : '1px solid #27272a',
                  borderRadius: '8px',
                  color: formData.partnerType === 'PRODUCT_AFFILIATE' ? '#34d399' : '#a1a1aa',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10b981',
                  }} />
                  <span>Product Affiliate Only</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 400, marginTop: '4px', marginLeft: '16px' }}>
                  For partners who drive shop sales and MotoRev signups
                </div>
              </button>
            </div>

            {/* Partner Info */}
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
              Partner Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Partner Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jesse Dawson"
                  disabled={userMode === 'existing' && !!formData.userId}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    opacity: userMode === 'existing' && formData.userId ? 0.6 : 1,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="partner@email.com"
                  disabled={userMode === 'existing' && !!formData.userId}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    opacity: userMode === 'existing' && formData.userId ? 0.6 : 1,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Company (optional)
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Partner's company name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Commission Structure */}
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
              Commission Structure
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  First Sale Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.firstSaleRate}
                  onChange={(e) => setFormData({ ...formData, firstSaleRate: e.target.value })}
                  placeholder="50"
                  min="0"
                  max="100"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717a' }}>
                  Commission on first sale from a lead
                </p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Recurring Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.recurringRate}
                  onChange={(e) => setFormData({ ...formData, recurringRate: e.target.value })}
                  placeholder="30"
                  min="0"
                  max="100"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717a' }}>
                  Commission on future sales from same lead
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div style={{
              marginTop: '20px',
              padding: '14px',
              background: userMode === 'new' ? '#10b98110' : '#3b82f610',
              border: userMode === 'new' ? '1px solid #10b98130' : '1px solid #3b82f630',
              borderRadius: '8px',
            }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa' }}>
                {userMode === 'new' ? (
                  <>
                    An invite email will be sent to <strong style={{ color: '#10b981' }}>{formData.email || 'the partner'}</strong> with a link to set up their password and access the partner portal.
                  </>
                ) : (
                  <>
                    The selected user will immediately have access to the partner portal at /account/partner.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid #27272a',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: '#27272a',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name || !formData.email || (userMode === 'existing' && !formData.userId)}
              style={{
                padding: '10px 20px',
                background: saving || !formData.name || !formData.email ? '#1e40af' : '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving || !formData.name || !formData.email ? 'not-allowed' : 'pointer',
                opacity: saving || !formData.name || !formData.email ? 0.6 : 1,
              }}
            >
              {saving ? 'Creating...' : userMode === 'new' ? 'Create & Send Invite' : 'Create Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
