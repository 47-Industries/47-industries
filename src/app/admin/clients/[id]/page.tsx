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
  relationshipSummary?: string
  stripeCustomerId?: string
  autopayEnabled: boolean
  defaultPaymentMethod?: string
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
  inquiry?: any
  user?: { id: string; email: string; name?: string }
}

interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  role?: string
  isPrimary: boolean
}

interface Project {
  id: string
  name: string
  description?: string
  type: string
  status: string
  contractValue?: number
  monthlyRecurring?: number
  productionUrl?: string
  repositoryUrl?: string
  startDate?: string
  serviceProjectId?: string
  publishedAt?: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  dueDate?: string
  paidAt?: string
  createdAt: string
}

interface Contract {
  id: string
  contractNumber: string
  title: string
  totalValue: number
  monthlyValue?: number
  status: string
  signedAt?: string
  fileUrl?: string
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
  performedAt: string
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingSummary, setEditingSummary] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [savingSummary, setSavingSummary] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  // User linking state
  const [showLinkUserModal, setShowLinkUserModal] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userSearchResults, setUserSearchResults] = useState<Array<{
    id: string
    email: string
    name?: string
    client?: { id: string; name: string }
  }>>([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; name?: string } | null>(null)
  const [linkingUser, setLinkingUser] = useState(false)
  const [showInviteOption, setShowInviteOption] = useState(false)

  // Portfolio publishing state
  const [publishingProject, setPublishingProject] = useState<string | null>(null)

  // Contract creation state
  const [showContractModal, setShowContractModal] = useState(false)
  const [contractForm, setContractForm] = useState({
    title: '',
    description: '',
    totalValue: '',
    monthlyValue: '',
    monthlyStartDate: '',
    paymentTerms: '100_UPFRONT', // '100_UPFRONT', '50_50', 'CUSTOM'
  })
  const [savingContract, setSavingContract] = useState(false)

  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchClient()
  }, [id])

  // Search users as typing
  useEffect(() => {
    const searchUsers = async () => {
      if (userSearchQuery.length < 2) {
        setUserSearchResults([])
        setShowInviteOption(false)
        return
      }

      setSearchingUsers(true)
      try {
        const res = await fetch(`/api/admin/clients/${id}/link-user?search=${encodeURIComponent(userSearchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setUserSearchResults(data.users || [])
          // Show invite option if search looks like an email and no exact match
          const isEmail = userSearchQuery.includes('@') && userSearchQuery.includes('.')
          const hasExactMatch = data.users?.some((u: any) => u.email.toLowerCase() === userSearchQuery.toLowerCase())
          setShowInviteOption(isEmail && !hasExactMatch)
        }
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setSearchingUsers(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [userSearchQuery, id])

  const fetchClient = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/clients/${id}`)
      if (res.ok) {
        const data = await res.json()
        setClient(data.client)
        setSummaryText(data.client.relationshipSummary || '')
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

  const handleSaveSummary = async () => {
    try {
      setSavingSummary(true)
      const res = await fetch(`/api/admin/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationshipSummary: summaryText }),
      })
      if (res.ok) {
        showToast('Summary saved', 'success')
        setEditingSummary(false)
        fetchClient()
      }
    } catch (error) {
      showToast('Failed to save', 'error')
    } finally {
      setSavingSummary(false)
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return
    try {
      setSavingNote(true)
      const res = await fetch(`/api/admin/clients/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote }),
      })
      if (res.ok) {
        showToast('Note added', 'success')
        setNewNote('')
        fetchClient()
      }
    } catch (error) {
      showToast('Failed to add note', 'error')
    } finally {
      setSavingNote(false)
    }
  }

  const handleLinkUser = async (userId?: string) => {
    try {
      setLinkingUser(true)
      const res = await fetch(`/api/admin/clients/${id}/link-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId || selectedUser?.id }),
      })
      if (res.ok) {
        showToast('User linked successfully', 'success')
        resetLinkModal()
        fetchClient()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to link user', 'error')
      }
    } catch (error) {
      showToast('Failed to link user', 'error')
    } finally {
      setLinkingUser(false)
    }
  }

  const handleSendInvite = async () => {
    if (!userSearchQuery.includes('@')) return
    try {
      setLinkingUser(true)
      const res = await fetch(`/api/admin/clients/${id}/link-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userSearchQuery.trim(), sendInvite: true }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || 'Invitation sent!', 'success')
        resetLinkModal()
        fetchClient()
      } else {
        showToast(data.error || 'Failed to send invitation', 'error')
      }
    } catch (error) {
      showToast('Failed to send invitation', 'error')
    } finally {
      setLinkingUser(false)
    }
  }

  const resetLinkModal = () => {
    setShowLinkUserModal(false)
    setUserSearchQuery('')
    setUserSearchResults([])
    setSelectedUser(null)
    setShowInviteOption(false)
  }

  const handleUnlinkUser = async () => {
    if (!confirm('Unlink this user from the client? They will lose access to the client portal.')) return
    try {
      const res = await fetch(`/api/admin/clients/${id}/link-user`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('User unlinked', 'success')
        fetchClient()
      }
    } catch (error) {
      showToast('Failed to unlink user', 'error')
    }
  }

  const handlePublishToPortfolio = async (projectId: string, projectName: string) => {
    if (!confirm(`Publish "${projectName}" to the public portfolio?`)) return
    try {
      setPublishingProject(projectId)
      const res = await fetch(`/api/admin/clients/${id}/projects/${projectId}/publish`, {
        method: 'POST',
      })
      if (res.ok) {
        showToast('Published to portfolio!', 'success')
        fetchClient()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to publish', 'error')
      }
    } catch (error) {
      showToast('Failed to publish', 'error')
    } finally {
      setPublishingProject(null)
    }
  }

  const handleCreateContract = async () => {
    if (!contractForm.title.trim() || !contractForm.totalValue) {
      showToast('Title and total value are required', 'error')
      return
    }

    try {
      setSavingContract(true)

      // Build description with payment terms
      let paymentTermsText = ''
      if (contractForm.paymentTerms === '100_UPFRONT') {
        paymentTermsText = `Payment Terms: 100% upfront payment of ${formatCurrency(Number(contractForm.totalValue))} required before work begins.`
      } else if (contractForm.paymentTerms === '50_50') {
        const halfAmount = Number(contractForm.totalValue) / 2
        paymentTermsText = `Payment Terms: 50% deposit (${formatCurrency(halfAmount)}) due before work begins, remaining 50% due upon completion.`
      }

      if (contractForm.monthlyValue && contractForm.monthlyStartDate) {
        const startDate = new Date(contractForm.monthlyStartDate)
        paymentTermsText += `\n\nMonthly Recurring: ${formatCurrency(Number(contractForm.monthlyValue))}/month beginning ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
      }

      const fullDescription = contractForm.description
        ? `${contractForm.description}\n\n${paymentTermsText}`
        : paymentTermsText

      const res = await fetch('/api/admin/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: id,
          title: contractForm.title,
          description: fullDescription,
          totalValue: Number(contractForm.totalValue),
          monthlyValue: contractForm.monthlyValue ? Number(contractForm.monthlyValue) : null,
          startDate: contractForm.monthlyStartDate || null,
          status: 'DRAFT',
        }),
      })

      if (res.ok) {
        showToast('Contract created!', 'success')
        setShowContractModal(false)
        setContractForm({
          title: '',
          description: '',
          totalValue: '',
          monthlyValue: '',
          monthlyStartDate: '',
          paymentTerms: '100_UPFRONT',
        })
        fetchClient()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to create contract', 'error')
      }
    } catch (error) {
      showToast('Failed to create contract', 'error')
    } finally {
      setSavingContract(false)
    }
  }

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

  const primaryContact = client.contacts.find(c => c.isPrimary) || client.contacts[0]
  const totalMonthlyRecurring = client.projects.reduce((sum, p) => sum + Number(p.monthlyRecurring || 0), 0)

  return (
    <div style={{ color: '#fff', maxWidth: '1000px' }}>
      {/* Back Link */}
      <Link
        href="/admin/clients"
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
        Back to Clients
      </Link>

      {/* ========== CLIENT HEADER ========== */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
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
              {client.autopayEnabled && (
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: '#10b98120',
                  color: '#10b981',
                }}>
                  Autopay Enabled
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: '#a1a1aa' }}>
              {primaryContact && (
                <span>{primaryContact.name}{primaryContact.role ? ` (${primaryContact.role})` : ''}</span>
              )}
              <span>{client.email}</span>
              {client.phone && <span>{client.phone}</span>}
            </div>

            {client.website && (
              <a
                href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#3b82f6', fontSize: '14px', display: 'inline-block', marginTop: '8px' }}
              >
                {client.website.replace(/^https?:\/\//, '')}
              </a>
            )}

            <p style={{ margin: '8px 0 0 0', color: '#71717a', fontSize: '13px' }}>
              {client.clientNumber} | Client since {formatDate(client.createdAt)}
              {client.industry && ` | ${client.industry}`}
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
              Email
            </button>
            <Link
              href={`/admin/invoices/create?clientId=${client.id}`}
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
                textDecoration: 'none',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invoice
            </Link>
          </div>
        </div>
      </div>

      {/* ========== CLIENT PORTAL ACCESS ========== */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Client Portal Access</h2>
            {client.user ? (
              <span style={{
                padding: '4px 10px',
                background: '#10b98120',
                color: '#10b981',
                borderRadius: '6px',
                fontSize: '12px',
              }}>
                Linked
              </span>
            ) : (
              <span style={{
                padding: '4px 10px',
                background: '#71717a20',
                color: '#71717a',
                borderRadius: '6px',
                fontSize: '12px',
              }}>
                No Portal Access
              </span>
            )}
          </div>
          {client.user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: '#a1a1aa' }}>
                {client.user.email}
                {client.user.name && ` (${client.user.name})`}
              </span>
              <button
                onClick={handleUnlinkUser}
                style={{
                  padding: '5px 12px',
                  background: '#27272a',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#ef4444',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Unlink
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLinkUserModal(true)}
              style={{
                padding: '6px 14px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Link User Account
            </button>
          )}
        </div>
        {!client.user && (
          <p style={{ margin: '10px 0 0 0', color: '#71717a', fontSize: '13px' }}>
            Link a user account to give this client access to view invoices, contracts, and manage billing at /account/client
          </p>
        )}
      </div>

      {/* ========== RELATIONSHIP SUMMARY ========== */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Relationship Summary</h2>
          {!editingSummary ? (
            <button
              onClick={() => setEditingSummary(true)}
              style={{
                padding: '5px 12px',
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
                onClick={() => { setEditingSummary(false); setSummaryText(client.relationshipSummary || '') }}
                style={{
                  padding: '5px 12px',
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
                onClick={handleSaveSummary}
                disabled={savingSummary}
                style={{
                  padding: '5px 12px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {savingSummary ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {editingSummary ? (
          <textarea
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            placeholder="Describe your relationship with this client - who they are, what services you provide, the history of your work together..."
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              background: '#0a0a0a',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              lineHeight: '1.6',
              resize: 'vertical',
            }}
          />
        ) : client.relationshipSummary ? (
          <p style={{ margin: 0, color: '#e4e4e7', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
            {client.relationshipSummary}
          </p>
        ) : (
          <p style={{ margin: 0, color: '#71717a', fontSize: '14px', fontStyle: 'italic' }}>
            No summary yet. Click Edit to describe your relationship with this client.
          </p>
        )}
      </div>

      {/* ========== SERVICES & PROJECTS ========== */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Services & Projects</h2>
          <button
            style={{
              padding: '6px 14px',
              background: '#27272a',
              border: 'none',
              borderRadius: '6px',
              color: '#a1a1aa',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            + Add Project
          </button>
        </div>

        {client.projects.length === 0 ? (
          <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No active projects</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {client.projects.map((project) => (
              <div
                key={project.id}
                style={{
                  background: '#0a0a0a',
                  borderRadius: '10px',
                  padding: '16px',
                  border: '1px solid #27272a',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '15px' }}>{project.name}</span>
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
                      {project.serviceProjectId && (
                        <span style={{
                          padding: '3px 8px',
                          background: '#8b5cf620',
                          color: '#8b5cf6',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}>
                          On Portfolio
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>{project.type.replace(/_/g, ' ')}</p>
                    {project.description && (
                      <p style={{ margin: '8px 0 0 0', color: '#a1a1aa', fontSize: '14px' }}>{project.description}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {project.contractValue ? (
                      <p style={{ margin: 0, fontWeight: 600, color: '#fff' }}>
                        {formatCurrency(Number(project.contractValue))}
                      </p>
                    ) : null}
                    {project.monthlyRecurring ? (
                      <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#10b981' }}>
                        +{formatCurrency(Number(project.monthlyRecurring))}/mo
                      </p>
                    ) : null}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '13px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                  {!project.serviceProjectId && project.status === 'COMPLETED' && (
                    <button
                      onClick={() => handlePublishToPortfolio(project.id, project.name)}
                      disabled={publishingProject === project.id}
                      style={{
                        padding: '4px 10px',
                        background: '#8b5cf6',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        marginLeft: 'auto',
                      }}
                    >
                      {publishingProject === project.id ? 'Publishing...' : 'Publish to Portfolio'}
                    </button>
                  )}
                  {project.serviceProjectId && (
                    <Link
                      href={`/admin/services?tab=projects`}
                      style={{
                        marginLeft: 'auto',
                        padding: '4px 10px',
                        background: '#27272a',
                        borderRadius: '4px',
                        color: '#a1a1aa',
                        fontSize: '12px',
                        textDecoration: 'none',
                      }}
                    >
                      View in Portfolio
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== BILLING ========== */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Billing</h2>
          <Link
            href={`/admin/invoices/create?clientId=${client.id}`}
            style={{
              padding: '6px 14px',
              background: '#27272a',
              border: 'none',
              borderRadius: '6px',
              color: '#a1a1aa',
              fontSize: '13px',
              textDecoration: 'none',
            }}
          >
            + Create Invoice
          </Link>
        </div>

        {/* Billing Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '14px' }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Total Revenue</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
              {formatCurrency(Number(client.totalRevenue))}
            </p>
          </div>
          <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '14px' }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Outstanding</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: Number(client.totalOutstanding) > 0 ? '#f59e0b' : '#fff' }}>
              {formatCurrency(Number(client.totalOutstanding))}
            </p>
          </div>
          <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '14px' }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Monthly Recurring</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#3b82f6' }}>
              {formatCurrency(totalMonthlyRecurring)}/mo
            </p>
          </div>
          <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '14px' }}>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px' }}>Payment Status</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 500, color: client.autopayEnabled ? '#10b981' : '#a1a1aa' }}>
              {client.autopayEnabled ? 'Autopay Active' : 'Manual Payments'}
            </p>
          </div>
        </div>

        {/* Recent Invoices */}
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>Recent Invoices</h3>
        {client.invoices.length === 0 ? (
          <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No invoices yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {client.invoices.slice(0, 5).map((invoice) => (
              <Link
                key={invoice.id}
                href={`/admin/invoices/${invoice.id}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: '#0a0a0a',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'white',
                  border: '1px solid #27272a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 500, fontSize: '14px' }}>{invoice.invoiceNumber}</span>
                  <span style={{
                    padding: '2px 8px',
                    background: `${getStatusColor(invoice.status)}20`,
                    color: getStatusColor(invoice.status),
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}>
                    {invoice.status}
                  </span>
                  {invoice.dueDate && (
                    <span style={{ color: '#71717a', fontSize: '13px' }}>
                      Due {formatDate(invoice.dueDate)}
                    </span>
                  )}
                </div>
                <span style={{ fontWeight: 600, fontSize: '15px' }}>
                  {formatCurrency(Number(invoice.total))}
                </span>
              </Link>
            ))}
            {client.invoices.length > 5 && (
              <Link
                href={`/admin/invoices?clientId=${client.id}`}
                style={{ color: '#3b82f6', fontSize: '13px', textAlign: 'center', padding: '8px' }}
              >
                View all {client.invoices.length} invoices
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ========== CONTRACTS ========== */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Contracts</h2>
          <button
            onClick={() => setShowContractModal(true)}
            style={{
              padding: '6px 14px',
              background: '#27272a',
              border: 'none',
              borderRadius: '6px',
              color: '#a1a1aa',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            + Add Contract
          </button>
        </div>

        {client.contracts.length === 0 ? (
          <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No contracts yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {client.contracts.map((contract) => (
              <div
                key={contract.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px',
                  background: '#0a0a0a',
                  borderRadius: '8px',
                  border: '1px solid #27272a',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 500 }}>{contract.title}</span>
                    <span style={{
                      padding: '2px 8px',
                      background: `${getStatusColor(contract.status)}20`,
                      color: getStatusColor(contract.status),
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}>
                      {contract.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>
                    {contract.contractNumber}
                    {contract.signedAt && ` | Signed ${formatDate(contract.signedAt)}`}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{formatCurrency(Number(contract.totalValue))}</p>
                    {contract.monthlyValue && (
                      <p style={{ margin: 0, fontSize: '12px', color: '#71717a' }}>
                        +{formatCurrency(Number(contract.monthlyValue))}/mo
                      </p>
                    )}
                  </div>
                  {contract.fileUrl && (
                    <a
                      href={contract.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: '6px 12px',
                        background: '#27272a',
                        borderRadius: '6px',
                        color: '#a1a1aa',
                        fontSize: '13px',
                        textDecoration: 'none',
                      }}
                    >
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== CONTACTS ========== */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Contacts ({client.contacts.length})</h2>
          <button
            style={{
              padding: '6px 14px',
              background: '#27272a',
              border: 'none',
              borderRadius: '6px',
              color: '#a1a1aa',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            + Add Contact
          </button>
        </div>

        {client.contacts.length === 0 ? (
          <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No contacts yet</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {client.contacts.map((contact) => (
              <div
                key={contact.id}
                style={{
                  padding: '14px',
                  background: '#0a0a0a',
                  borderRadius: '8px',
                  border: '1px solid #27272a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
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
                {contact.role && <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#a1a1aa' }}>{contact.role}</p>}
                {contact.email && <p style={{ margin: '0 0 2px 0', fontSize: '13px', color: '#71717a' }}>{contact.email}</p>}
                {contact.phone && <p style={{ margin: 0, fontSize: '13px', color: '#71717a' }}>{contact.phone}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== INTERNAL NOTES ========== */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Internal Notes</h2>

        {/* Add Note */}
        <div style={{ marginBottom: '16px' }}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add a note about this client..."
            rows={2}
            style={{
              width: '100%',
              padding: '12px',
              background: '#0a0a0a',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              resize: 'vertical',
              marginBottom: '8px',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleAddNote}
              disabled={savingNote || !newNote.trim()}
              style={{
                padding: '6px 14px',
                background: savingNote || !newNote.trim() ? '#1e40af' : '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
                opacity: savingNote || !newNote.trim() ? 0.5 : 1,
              }}
            >
              {savingNote ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </div>

        {client.notes.length === 0 ? (
          <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No notes yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {client.notes.map((note) => (
              <div
                key={note.id}
                style={{
                  padding: '14px',
                  background: '#0a0a0a',
                  borderRadius: '8px',
                  border: '1px solid #27272a',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 500, fontSize: '13px' }}>{note.authorName}</span>
                  <span style={{ color: '#71717a', fontSize: '12px' }}>{formatDate(note.createdAt)}</span>
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
                <p style={{ margin: 0, fontSize: '14px', color: '#e4e4e7', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                  {note.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== ACTIVITY TIMELINE ========== */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Activity Timeline</h2>

        {client.activities.length === 0 ? (
          <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No activity yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {client.activities.slice(0, 20).map((activity, index) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '12px 0',
                  borderBottom: index < client.activities.length - 1 && index < 19 ? '1px solid #27272a' : 'none',
                }}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#3f3f46',
                  marginTop: '6px',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#e4e4e7' }}>{activity.description}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717a' }}>
                    {new Date(activity.performedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========== LINK USER MODAL ========== */}
      {showLinkUserModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '450px',
            margin: '16px',
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600 }}>Link User Account</h3>
            <p style={{ margin: '0 0 16px 0', color: '#71717a', fontSize: '13px' }}>
              Search for an existing user or enter an email to send an invitation.
            </p>

            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search by email or name..."
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#0a0a0a',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
              {searchingUsers && (
                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a', fontSize: '12px' }}>
                  Searching...
                </div>
              )}
            </div>

            {/* Search Results */}
            {userSearchResults.length > 0 && (
              <div style={{
                marginTop: '12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                maxHeight: '200px',
                overflow: 'auto',
              }}>
                {userSearchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleLinkUser(user.id)}
                    disabled={!!user.client || linkingUser}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #27272a',
                      color: user.client ? '#71717a' : 'white',
                      fontSize: '14px',
                      textAlign: 'left',
                      cursor: user.client ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{user.email}</div>
                      {user.name && <div style={{ fontSize: '12px', color: '#71717a' }}>{user.name}</div>}
                    </div>
                    {user.client ? (
                      <span style={{ fontSize: '11px', color: '#f59e0b', background: '#f59e0b20', padding: '2px 6px', borderRadius: '4px' }}>
                        Linked to {user.client.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#3b82f6' }}>Select</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* No Results + Invite Option */}
            {userSearchQuery.length >= 2 && userSearchResults.length === 0 && !searchingUsers && (
              <div style={{
                marginTop: '12px',
                padding: '16px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <p style={{ margin: '0 0 8px 0', color: '#71717a', fontSize: '14px' }}>
                  No users found matching "{userSearchQuery}"
                </p>
                {showInviteOption && (
                  <button
                    onClick={handleSendInvite}
                    disabled={linkingUser}
                    style={{
                      padding: '10px 20px',
                      background: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      marginTop: '8px',
                    }}
                  >
                    {linkingUser ? 'Sending...' : `Send Invitation to ${userSearchQuery}`}
                  </button>
                )}
              </div>
            )}

            {/* Help text for invite */}
            {userSearchQuery.length >= 2 && !showInviteOption && userSearchResults.length === 0 && !searchingUsers && (
              <p style={{ margin: '12px 0 0 0', color: '#71717a', fontSize: '12px', textAlign: 'center' }}>
                Enter a valid email address to send an invitation
              </p>
            )}

            {/* Cancel Button */}
            <div style={{ marginTop: '16px' }}>
              <button
                onClick={resetLinkModal}
                style={{
                  width: '100%',
                  padding: '10px',
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
            </div>
          </div>
        </div>
      )}

      {/* ========== CREATE CONTRACT MODAL ========== */}
      {showContractModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          overflow: 'auto',
          padding: '20px',
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '24px',
            width: '100%',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 600 }}>Create Contract</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Contract Title *
                </label>
                <input
                  type="text"
                  value={contractForm.title}
                  onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                  placeholder="e.g., Platform Development Agreement"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Description (optional)
                </label>
                <textarea
                  value={contractForm.description}
                  onChange={(e) => setContractForm({ ...contractForm, description: e.target.value })}
                  placeholder="Describe the scope of work..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* Payment Terms Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '8px' }}>
                  Payment Terms
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setContractForm({ ...contractForm, paymentTerms: '100_UPFRONT' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: contractForm.paymentTerms === '100_UPFRONT' ? '#3b82f6' : '#27272a',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    100% Upfront
                  </button>
                  <button
                    onClick={() => setContractForm({ ...contractForm, paymentTerms: '50_50' })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: contractForm.paymentTerms === '50_50' ? '#3b82f6' : '#27272a',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    50% / 50%
                  </button>
                </div>
              </div>

              {/* Total Value */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>
                  Total Contract Value *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}>$</span>
                  <input
                    type="number"
                    value={contractForm.totalValue}
                    onChange={(e) => setContractForm({ ...contractForm, totalValue: e.target.value })}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 26px',
                      background: '#0a0a0a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#71717a' }}>
                  {contractForm.paymentTerms === '100_UPFRONT'
                    ? 'Full amount due before work begins'
                    : '50% due before work begins, 50% upon completion'}
                </p>
              </div>

              {/* Monthly Recurring Section */}
              <div style={{
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '16px',
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
                  Monthly Recurring (Optional)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>
                      Monthly Amount
                    </label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a', fontSize: '13px' }}>$</span>
                      <input
                        type="number"
                        value={contractForm.monthlyValue}
                        onChange={(e) => setContractForm({ ...contractForm, monthlyValue: e.target.value })}
                        placeholder="100.00"
                        step="0.01"
                        min="0"
                        style={{
                          width: '100%',
                          padding: '8px 10px 8px 24px',
                          background: '#18181b',
                          border: '1px solid #3f3f46',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>
                      Starting Date
                    </label>
                    <input
                      type="date"
                      value={contractForm.monthlyStartDate}
                      onChange={(e) => setContractForm({ ...contractForm, monthlyStartDate: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: '#18181b',
                        border: '1px solid #3f3f46',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                </div>

                {contractForm.monthlyValue && contractForm.monthlyStartDate && (
                  <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#10b981' }}>
                    Monthly billing of {formatCurrency(Number(contractForm.monthlyValue))} begins{' '}
                    {new Date(contractForm.monthlyStartDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Summary */}
              {contractForm.totalValue && (
                <div style={{
                  background: '#10b98110',
                  border: '1px solid #10b98130',
                  borderRadius: '8px',
                  padding: '14px',
                }}>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                    Contract Summary
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#a1a1aa' }}>
                    {contractForm.paymentTerms === '100_UPFRONT'
                      ? `100% upfront payment of ${formatCurrency(Number(contractForm.totalValue))}`
                      : `50% deposit (${formatCurrency(Number(contractForm.totalValue) / 2)}) + 50% upon completion`}
                    {contractForm.monthlyValue && contractForm.monthlyStartDate && (
                      <>, then ${contractForm.monthlyValue}/month starting {new Date(contractForm.monthlyStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowContractModal(false)
                  setContractForm({
                    title: '',
                    description: '',
                    totalValue: '',
                    monthlyValue: '',
                    monthlyStartDate: '',
                    paymentTerms: '100_UPFRONT',
                  })
                }}
                style={{
                  flex: 1,
                  padding: '12px',
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
                onClick={handleCreateContract}
                disabled={savingContract || !contractForm.title.trim() || !contractForm.totalValue}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: savingContract || !contractForm.title.trim() || !contractForm.totalValue ? '#1e40af' : '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  opacity: savingContract || !contractForm.title.trim() || !contractForm.totalValue ? 0.5 : 1,
                }}
              >
                {savingContract ? 'Creating...' : 'Create Contract'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
