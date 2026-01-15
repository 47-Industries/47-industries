'use client'

import { useState, useEffect, use } from 'react'
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
  address?: string
  industry?: string
  type: string
  source: string
  totalRevenue: number
  totalOutstanding: number
  assignedTo?: string
  lastContactedAt?: string
  nextFollowUpAt?: string
  createdAt: string
  updatedAt: string
  contacts: Contact[]
  projects: Project[]
  invoices: Invoice[]
  contracts: Contract[]
  notes: Note[]
  activities: Activity[]
  messages: Message[]
  inquiry?: any
}

interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  role?: string
  isPrimary: boolean
  createdAt: string
}

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
  contractValue?: number
  monthlyRecurring?: number
  startDate?: string
  estimatedEndDate?: string
  completedAt?: string
  repositoryUrl?: string
  productionUrl?: string
  stagingUrl?: string
  createdAt: string
  contracts: Contract[]
}

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  total: number
  status: string
  dueDate: string
  paidAt?: string
  createdAt: string
  items: any[]
}

interface Contract {
  id: string
  contractNumber: string
  title: string
  description?: string
  fileUrl?: string
  externalUrl?: string
  totalValue: number
  monthlyValue?: number
  status: string
  signedAt?: string
  createdAt: string
}

interface Note {
  id: string
  authorName: string
  content: string
  isPinned: boolean
  createdAt: string
}

interface Activity {
  id: string
  type: string
  description: string
  performedBy?: string
  performedAt: string
  metadata?: any
}

interface Message {
  id: string
  direction: string
  channel: string
  subject?: string
  content: string
  senderName: string
  createdAt: string
}

type TabId = 'overview' | 'projects' | 'invoices' | 'contracts' | 'activity' | 'notes'

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [isMobile, setIsMobile] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchClient()
  }, [id])

  const fetchClient = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/clients/${id}`)
      if (res.ok) {
        const data = await res.json()
        setClient(data.client)
      } else if (res.status === 404) {
        showToast('Client not found', 'error')
        router.push('/admin/clients')
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      showToast('Failed to load client', 'error')
    } finally {
      setLoading(false)
    }
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PROPOSAL: '#f59e0b',
      ACTIVE: '#3b82f6',
      ON_HOLD: '#6b7280',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
      DRAFT: '#6b7280',
      SENT: '#3b82f6',
      SIGNED: '#10b981',
      VIEWED: '#8b5cf6',
      PAID: '#10b981',
      OVERDUE: '#ef4444',
    }
    return colors[status] || '#6b7280'
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'projects' as const, label: 'Projects' },
    { id: 'invoices' as const, label: 'Invoices' },
    { id: 'contracts' as const, label: 'Contracts' },
    { id: 'activity' as const, label: 'Activity' },
    { id: 'notes' as const, label: 'Notes' },
  ]

  if (loading) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#71717a' }}>Loading client...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#71717a' }}>Client not found</p>
      </div>
    )
  }

  return (
    <div style={{ color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/admin/clients"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#71717a',
            textDecoration: 'none',
            fontSize: '14px',
            marginBottom: '12px',
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Clients
        </Link>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{client.name}</h1>
              <span style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: `${getTypeColor(client.type)}20`,
                color: getTypeColor(client.type),
              }}>
                {client.type}
              </span>
            </div>
            <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>
              {client.clientNumber} | Added {formatDate(client.createdAt)}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#27272a',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Email
            </button>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
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
              Create Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '10px',
          padding: '16px',
        }}>
          <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
            Total Revenue
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
            {formatCurrency(Number(client.totalRevenue))}
          </p>
        </div>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '10px',
          padding: '16px',
        }}>
          <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
            Outstanding
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>
            {formatCurrency(Number(client.totalOutstanding))}
          </p>
        </div>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '10px',
          padding: '16px',
        }}>
          <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
            Projects
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 700 }}>
            {client.projects.length}
          </p>
        </div>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '10px',
          padding: '16px',
        }}>
          <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
            Invoices
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '20px', fontWeight: 700 }}>
            {client.invoices.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        background: '#1a1a1a',
        padding: '4px',
        borderRadius: '12px',
        marginBottom: '24px',
        width: 'fit-content',
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#a1a1aa',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab client={client} onUpdate={fetchClient} />
      )}
      {activeTab === 'projects' && (
        <ProjectsTab client={client} onUpdate={fetchClient} />
      )}
      {activeTab === 'invoices' && (
        <InvoicesTab client={client} />
      )}
      {activeTab === 'contracts' && (
        <ContractsTab client={client} onUpdate={fetchClient} />
      )}
      {activeTab === 'activity' && (
        <ActivityTab client={client} />
      )}
      {activeTab === 'notes' && (
        <NotesTab client={client} onUpdate={fetchClient} />
      )}
    </div>
  )
}

// Overview Tab
function OverviewTab({ client, onUpdate }: { client: Client; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: client.name,
    email: client.email,
    phone: client.phone || '',
    website: client.website || '',
    address: client.address || '',
    industry: client.industry || '',
    type: client.type,
    source: client.source,
  })
  const { showToast } = useToast()

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        showToast('Client updated', 'success')
        setEditing(false)
        onUpdate()
      } else {
        showToast('Failed to update client', 'error')
      }
    } catch (error) {
      showToast('Failed to update client', 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Client Info */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Client Information</h3>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: '6px 12px',
                background: '#27272a',
                border: 'none',
                borderRadius: '6px',
                color: '#a1a1aa',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: '6px 12px',
                  background: '#27272a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#a1a1aa',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {!editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Email</p>
              <p style={{ margin: '2px 0 0 0' }}>{client.email}</p>
            </div>
            {client.phone && (
              <div>
                <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Phone</p>
                <p style={{ margin: '2px 0 0 0' }}>{client.phone}</p>
              </div>
            )}
            {client.website && (
              <div>
                <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Website</p>
                <a href={client.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                  {client.website}
                </a>
              </div>
            )}
            {client.address && (
              <div>
                <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Address</p>
                <p style={{ margin: '2px 0 0 0', whiteSpace: 'pre-line' }}>{client.address}</p>
              </div>
            )}
            {client.industry && (
              <div>
                <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Industry</p>
                <p style={{ margin: '2px 0 0 0' }}>{client.industry}</p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
              <div>
                <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Source</p>
                <p style={{ margin: '2px 0 0 0' }}>{client.source}</p>
              </div>
              <div>
                <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Created</p>
                <p style={{ margin: '2px 0 0 0' }}>{formatDate(client.createdAt)}</p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Company Name"
              style={{
                padding: '8px 12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
              }}
            />
            <input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              style={{
                padding: '8px 12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
              }}
            />
            <input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone"
              style={{
                padding: '8px 12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
              }}
            />
            <input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="Website"
              style={{
                padding: '8px 12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
              }}
            />
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Address"
              rows={2}
              style={{
                padding: '8px 12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
            <input
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="Industry"
              style={{
                padding: '8px 12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                style={{
                  padding: '8px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
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
              <select
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                style={{
                  padding: '8px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
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
        )}
      </div>

      {/* Contacts */}
      <ContactsCard client={client} onUpdate={onUpdate} />

      {/* Recent Activity */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '20px',
        gridColumn: 'span 2',
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Recent Activity</h3>
        {client.activities.length === 0 ? (
          <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No activity yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {client.activities.slice(0, 5).map((activity) => (
              <div key={activity.id} style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: '#0a0a0a',
                borderRadius: '8px',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#27272a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="14" height="14" fill="none" stroke="#71717a" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>{activity.description}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717a' }}>
                    {new Date(activity.performedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Contacts Card Component
function ContactsCard({ client, onUpdate }: { client: Client; onUpdate: () => void }) {
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', role: '', isPrimary: false })
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const handleAddContact = async () => {
    if (!newContact.name) {
      showToast('Contact name is required', 'warning')
      return
    }
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/clients/${client.id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContact),
      })
      if (res.ok) {
        showToast('Contact added', 'success')
        setShowAddContact(false)
        setNewContact({ name: '', email: '', phone: '', role: '', isPrimary: false })
        onUpdate()
      } else {
        showToast('Failed to add contact', 'error')
      }
    } catch (error) {
      showToast('Failed to add contact', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Delete this contact?')) return
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/contacts?contactId=${contactId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('Contact deleted', 'success')
        onUpdate()
      } else {
        showToast('Failed to delete contact', 'error')
      }
    } catch (error) {
      showToast('Failed to delete contact', 'error')
    }
  }

  return (
    <div style={{
      background: '#18181b',
      border: '1px solid #27272a',
      borderRadius: '12px',
      padding: '20px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Contacts</h3>
        <button
          onClick={() => setShowAddContact(!showAddContact)}
          style={{
            padding: '6px 12px',
            background: showAddContact ? '#27272a' : '#3b82f6',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          {showAddContact ? 'Cancel' : 'Add Contact'}
        </button>
      </div>

      {showAddContact && (
        <div style={{
          padding: '12px',
          background: '#0a0a0a',
          borderRadius: '8px',
          marginBottom: '16px',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <input
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              placeholder="Name *"
              style={{
                padding: '8px 10px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
              }}
            />
            <input
              value={newContact.role}
              onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
              placeholder="Role"
              style={{
                padding: '8px 10px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
              }}
            />
            <input
              value={newContact.email}
              onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              placeholder="Email"
              style={{
                padding: '8px 10px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
              }}
            />
            <input
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              placeholder="Phone"
              style={{
                padding: '8px 10px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#a1a1aa' }}>
              <input
                type="checkbox"
                checked={newContact.isPrimary}
                onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
              />
              Primary contact
            </label>
            <button
              onClick={handleAddContact}
              disabled={saving || !newContact.name}
              style={{
                padding: '6px 16px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
                opacity: saving || !newContact.name ? 0.5 : 1,
              }}
            >
              {saving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {client.contacts.length === 0 ? (
        <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No contacts yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {client.contacts.map((contact) => (
            <div
              key={contact.id}
              style={{
                padding: '12px',
                background: '#0a0a0a',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 500 }}>{contact.name}</span>
                  {contact.isPrimary && (
                    <span style={{
                      padding: '2px 6px',
                      background: '#3b82f620',
                      color: '#3b82f6',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}>
                      Primary
                    </span>
                  )}
                </div>
                {contact.role && <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#a1a1aa' }}>{contact.role}</p>}
                {contact.email && <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#71717a' }}>{contact.email}</p>}
                {contact.phone && <p style={{ margin: 0, fontSize: '13px', color: '#71717a' }}>{contact.phone}</p>}
              </div>
              <button
                onClick={() => handleDeleteContact(contact.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#71717a',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Projects Tab
function ProjectsTab({ client, onUpdate }: { client: Client; onUpdate: () => void }) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PROPOSAL: '#f59e0b',
      ACTIVE: '#3b82f6',
      ON_HOLD: '#6b7280',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
    }
    return colors[status] || '#6b7280'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Projects ({client.projects.length})</h3>
        <button
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Add Project
        </button>
      </div>

      {client.projects.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>No projects yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {client.projects.map((project) => (
            <div
              key={project.id}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '16px' }}>{project.name}</span>
                    <span style={{
                      padding: '3px 8px',
                      background: `${getStatusColor(project.status)}20`,
                      color: getStatusColor(project.status),
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>
                      {project.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>{project.type.replace('_', ' ')}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {project.contractValue && (
                    <p style={{ margin: 0, fontWeight: 600, color: '#10b981' }}>
                      {formatCurrency(Number(project.contractValue))}
                    </p>
                  )}
                  {project.monthlyRecurring && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#71717a' }}>
                      +{formatCurrency(Number(project.monthlyRecurring))}/mo
                    </p>
                  )}
                </div>
              </div>
              {project.description && (
                <p style={{ margin: '0 0 12px 0', color: '#a1a1aa', fontSize: '14px' }}>
                  {project.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#71717a' }}>
                {project.productionUrl && (
                  <a href={project.productionUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                    Live Site
                  </a>
                )}
                {project.repositoryUrl && (
                  <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>
                    Repository
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Invoices Tab
function InvoicesTab({ client }: { client: Client }) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: '#6b7280',
      SENT: '#3b82f6',
      VIEWED: '#8b5cf6',
      PAID: '#10b981',
      OVERDUE: '#ef4444',
      CANCELLED: '#6b7280',
    }
    return colors[status] || '#6b7280'
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Invoices ({client.invoices.length})</h3>
        <Link
          href={`/admin/invoices/create?clientId=${client.id}`}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            textDecoration: 'none',
          }}
        >
          Create Invoice
        </Link>
      </div>

      {client.invoices.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>No invoices yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {client.invoices.map((invoice) => (
            <Link
              key={invoice.id}
              href={`/admin/invoices/${invoice.id}`}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px 20px',
                textDecoration: 'none',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{invoice.invoiceNumber}</span>
                  <span style={{
                    padding: '3px 8px',
                    background: `${getStatusColor(invoice.status)}20`,
                    color: getStatusColor(invoice.status),
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}>
                    {invoice.status}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>
                  Due: {formatDate(invoice.dueDate)}
                  {invoice.paidAt && ` | Paid: ${formatDate(invoice.paidAt)}`}
                </p>
              </div>
              <span style={{ fontWeight: 600, fontSize: '18px' }}>
                {formatCurrency(Number(invoice.total))}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// Contracts Tab
function ContractsTab({ client, onUpdate }: { client: Client; onUpdate: () => void }) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: '#6b7280',
      SENT: '#3b82f6',
      SIGNED: '#10b981',
      ACTIVE: '#10b981',
      COMPLETED: '#8b5cf6',
      CANCELLED: '#ef4444',
    }
    return colors[status] || '#6b7280'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Contracts ({client.contracts.length})</h3>
        <button
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Add Contract
        </button>
      </div>

      {client.contracts.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>No contracts yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {client.contracts.map((contract) => (
            <div
              key={contract.id}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px 20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600 }}>{contract.title}</span>
                    <span style={{
                      padding: '3px 8px',
                      background: `${getStatusColor(contract.status)}20`,
                      color: getStatusColor(contract.status),
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>
                      {contract.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>{contract.contractNumber}</p>
                  {contract.description && (
                    <p style={{ margin: '8px 0 0 0', color: '#a1a1aa', fontSize: '14px' }}>{contract.description}</p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{formatCurrency(Number(contract.totalValue))}</p>
                  {contract.monthlyValue && (
                    <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#71717a' }}>
                      +{formatCurrency(Number(contract.monthlyValue))}/mo
                    </p>
                  )}
                </div>
              </div>
              {(contract.fileUrl || contract.externalUrl) && (
                <div style={{ marginTop: '12px' }}>
                  <a
                    href={contract.fileUrl || contract.externalUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3b82f6', fontSize: '13px' }}
                  >
                    View Document
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Activity Tab
function ActivityTab({ client }: { client: Client }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'EMAIL':
        return (
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'STATUS_CHANGE':
        return (
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        )
      case 'INVOICE_SENT':
      case 'INVOICE_PAID':
        return (
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      default:
        return (
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Activity Timeline</h3>

      {client.activities.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>No activity yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {client.activities.map((activity, index) => (
            <div
              key={activity.id}
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px 20px',
                background: '#18181b',
                borderRadius: index === 0 ? '12px 12px 0 0' : index === client.activities.length - 1 ? '0 0 12px 12px' : '0',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#27272a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#71717a',
                flexShrink: 0,
              }}>
                {getActivityIcon(activity.type)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '14px' }}>{activity.description}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717a' }}>
                  {new Date(activity.performedAt).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Notes Tab
function NotesTab({ client, onUpdate }: { client: Client; onUpdate: () => void }) {
  const [newNote, setNewNote] = useState('')
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/clients/${client.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      })
      if (res.ok) {
        showToast('Note added', 'success')
        setNewNote('')
        onUpdate()
      } else {
        showToast('Failed to add note', 'error')
      }
    } catch (error) {
      showToast('Failed to add note', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Delete this note?')) return
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/notes?noteId=${noteId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('Note deleted', 'success')
        onUpdate()
      } else {
        showToast('Failed to delete note', 'error')
      }
    } catch (error) {
      showToast('Failed to delete note', 'error')
    }
  }

  return (
    <div>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Notes</h3>

      {/* Add Note */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
      }}>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note..."
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            background: '#0a0a0a',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            resize: 'vertical',
            marginBottom: '12px',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleAddNote}
            disabled={saving || !newNote.trim()}
            style={{
              padding: '8px 16px',
              background: saving || !newNote.trim() ? '#1e40af' : '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
              opacity: saving || !newNote.trim() ? 0.5 : 1,
            }}
          >
            {saving ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </div>

      {/* Notes List */}
      {client.notes.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '40px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>No notes yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {client.notes.map((note) => (
            <div
              key={note.id}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 500, fontSize: '14px' }}>{note.authorName}</span>
                  <span style={{ color: '#71717a', fontSize: '12px' }}>
                    {new Date(note.createdAt).toLocaleString()}
                  </span>
                  {note.isPinned && (
                    <span style={{
                      padding: '2px 6px',
                      background: '#f59e0b20',
                      color: '#f59e0b',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}>
                      Pinned
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#71717a',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap', color: '#e4e4e7' }}>
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
