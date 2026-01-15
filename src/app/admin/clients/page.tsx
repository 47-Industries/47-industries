'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Client {
  id: string
  clientNumber: string
  name: string
  email: string
  phone?: string
  website?: string
  industry?: string
  type: string
  source: string
  totalRevenue: number
  totalOutstanding: number
  assignedTo?: string
  lastContactedAt?: string
  nextFollowUpAt?: string
  createdAt: string
  contacts: {
    id: string
    name: string
    email?: string
    phone?: string
    role?: string
    isPrimary: boolean
  }[]
  projects: {
    id: string
    name: string
    status: string
  }[]
  _count: {
    invoices: number
    projects: number
    contracts: number
  }
}

interface Stats {
  total: number
  byType: Record<string, number>
  activeProjects: number
  monthlyRevenue: number
  outstanding: number
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
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
    fetchClients()
  }, [typeFilter, sourceFilter])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (sourceFilter !== 'all') params.append('source', sourceFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/clients?${params}`)
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchClients()
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      LEAD: '#6b7280',
      PENDING: '#f59e0b',
      PROSPECT: '#3b82f6',
      ACTIVE: '#10b981',
      PAST: '#8b5cf6',
    }
    return colors[type] || '#6b7280'
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      INQUIRY: 'Inquiry',
      LEADCHOPPER: 'LeadChopper',
      REFERRAL: 'Referral',
      DIRECT: 'Direct',
    }
    return labels[source] || source
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
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

  const types = [
    { value: 'all', label: 'All Types' },
    { value: 'LEAD', label: 'Lead' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROSPECT', label: 'Prospect' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'PAST', label: 'Past' },
  ]

  const sources = [
    { value: 'all', label: 'All Sources' },
    { value: 'INQUIRY', label: 'Inquiry' },
    { value: 'LEADCHOPPER', label: 'LeadChopper' },
    { value: 'REFERRAL', label: 'Referral' },
    { value: 'DIRECT', label: 'Direct' },
  ]

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
            Clients
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0 0' }}>
            Manage client relationships, projects, and invoices
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
          Add Client
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
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
              Total Clients
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
              Active Projects
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
              {stats.activeProjects}
            </p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '13px', textTransform: 'uppercase' }}>
              Revenue This Month
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>
              {formatCurrency(stats.monthlyRevenue)}
            </p>
          </div>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '13px', textTransform: 'uppercase' }}>
              Outstanding
            </p>
            <p style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
              {formatCurrency(stats.outstanding)}
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
            placeholder="Search by name, email, or client number..."
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
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
          {types.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
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
            minWidth: '150px',
          }}
        >
          {sources.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Clients List */}
      {loading ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>Loading clients...</p>
        </div>
      ) : clients.length === 0 ? (
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
          }}>No clients yet</h3>
          <p style={{ color: '#71717a', margin: '0 0 20px 0' }}>
            Add your first client or convert an inquiry to get started
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
            Add Client
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {clients.map((client) => (
            <div
              key={client.id}
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
                    <span style={{ fontWeight: 600, fontSize: '18px' }}>{client.name}</span>
                    <span style={{ color: '#71717a', fontSize: '14px' }}>{client.clientNumber}</span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: `${getTypeColor(client.type)}20`,
                      color: getTypeColor(client.type),
                    }}>
                      {client.type}
                    </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: '#27272a',
                      color: '#a1a1aa',
                    }}>
                      {getSourceLabel(client.source)}
                    </span>
                  </div>
                  <p style={{ color: '#a1a1aa', margin: 0, fontSize: '14px' }}>
                    Added {formatDate(client.createdAt)}
                    {client.industry && ` | ${client.industry}`}
                  </p>
                </div>
                <Link
                  href={`/admin/clients/${client.id}`}
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
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                gap: '16px',
              }}>
                {/* Primary Contact */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Primary Contact
                  </p>
                  {client.contacts.length > 0 ? (
                    <>
                      <p style={{ margin: '0 0 2px 0', fontWeight: 500 }}>
                        {client.contacts[0].name}
                      </p>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                        {client.contacts[0].email || client.email}
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: '0 0 2px 0', fontWeight: 500 }}>{client.name}</p>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>{client.email}</p>
                    </>
                  )}
                </div>

                {/* Projects */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Projects
                  </p>
                  {client.projects.length > 0 ? (
                    <>
                      <p style={{ margin: '0 0 2px 0' }}>{client._count.projects} project{client._count.projects !== 1 ? 's' : ''}</p>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                        {client.projects.slice(0, 2).map(p => p.name).join(', ')}
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: 0, color: '#71717a', fontStyle: 'italic' }}>No projects</p>
                  )}
                </div>

                {/* Invoices */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Invoices
                  </p>
                  <p style={{ margin: '0 0 2px 0' }}>{client._count.invoices} invoice{client._count.invoices !== 1 ? 's' : ''}</p>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                    {formatCurrency(Number(client.totalRevenue))} revenue
                  </p>
                </div>

                {/* Last Contact */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Last Contacted
                  </p>
                  {client.lastContactedAt ? (
                    <p style={{ margin: 0 }}>{formatDate(client.lastContactedAt)}</p>
                  ) : (
                    <p style={{ margin: 0, color: '#71717a', fontStyle: 'italic' }}>Never</p>
                  )}
                  {client.nextFollowUpAt && (
                    <p style={{ margin: '2px 0 0 0', color: '#f59e0b', fontSize: '14px' }}>
                      Follow up: {formatDate(client.nextFollowUpAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Client Modal */}
      {showCreateModal && (
        <CreateClientModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(client) => {
            setShowCreateModal(false)
            showToast('Client created successfully', 'success')
            router.push(`/admin/clients/${client.id}`)
          }}
        />
      )}
    </div>
  )
}

// Create Client Modal Component
function CreateClientModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (client: Client) => void
}) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    industry: '',
    type: 'PROSPECT',
    source: 'DIRECT',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactRole: '',
  })
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      showToast('Name and email are required', 'warning')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        onSuccess(data.client)
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to create client', 'error')
      }
    } catch (error) {
      console.error('Error creating client:', error)
      showToast('Failed to create client', 'error')
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
        maxWidth: '600px',
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
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Add New Client</h2>
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
            {/* Company Info */}
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
              Company Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Company Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Acme Corp"
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
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
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
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
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
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g., Retail, SaaS, Restaurant"
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

            {/* Classification */}
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
              Classification
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                  <option value="LEAD">Lead</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROSPECT">Prospect</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAST">Past</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
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
                  <option value="DIRECT">Direct</option>
                  <option value="INQUIRY">Inquiry</option>
                  <option value="LEADCHOPPER">LeadChopper</option>
                  <option value="REFERRAL">Referral</option>
                </select>
              </div>
            </div>

            {/* Primary Contact */}
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
              Primary Contact (Optional)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="John Smith"
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
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Role
                </label>
                <input
                  type="text"
                  value={formData.contactRole}
                  onChange={(e) => setFormData({ ...formData, contactRole: e.target.value })}
                  placeholder="e.g., Owner, Manager"
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
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="john@company.com"
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
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
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
              disabled={saving || !formData.name || !formData.email}
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
              {saving ? 'Creating...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
