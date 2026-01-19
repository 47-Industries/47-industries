'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useToast } from '@/components/ui/Toast'
import AmendmentFormModal from '@/components/contracts/AmendmentFormModal'

// Dynamically import the signing modal to avoid SSR issues with signature_pad
const AdminContractSigningModal = dynamic(
  () => import('@/components/contracts/AdminContractSigningModal'),
  { ssr: false }
)

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
  referredByPartnerId?: string
  closedByUserId?: string
  referredBy?: {
    id: string
    name: string
    partnerNumber: string
    firstSaleRate: number
    recurringRate: number
  }
  closedBy?: {
    id: string
    name: string
    employeeNumber: string
  }
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

interface Amendment {
  id: string
  amendmentNumber: string
  title: string
  description?: string
  additionalValue: number
  additionalMonthlyValue?: number
  effectiveDate?: string
  fileUrl?: string
  fileName?: string
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'ACTIVE'
  signedAt?: string
  signedByName?: string
  countersignedAt?: string
  countersignedByName?: string
  createdAt: string
}

interface SignatureField {
  id: string
  type: string
  pageNumber: number
  assignedTo: string
  assignedUserId?: string
  label?: string
  isSigned: boolean
  signedByName?: string
  signedAt?: string
}

interface Contract {
  id: string
  contractNumber: string
  title: string
  totalValue: number
  monthlyValue?: number
  status: string
  signedAt?: string
  signedByName?: string
  fileUrl?: string
  originalFileUrl?: string
  countersignedAt?: string
  countersignedByName?: string
  amendments?: Amendment[]
  signatureFields?: SignatureField[]
  requiredAdminSignatures: number
  clientSignatureRequired: boolean
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

  // Expanded project descriptions
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  // Partner assignment state
  const [partners, setPartners] = useState<Array<{ id: string; name: string; partnerNumber: string }>>([])
  const [assigningPartnerToProject, setAssigningPartnerToProject] = useState<string | null>(null)
  const [savingPartnerAssignment, setSavingPartnerAssignment] = useState(false)

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(projectId)) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })
  }

  // Contract creation state
  const [showContractModal, setShowContractModal] = useState(false)
  const [contractForm, setContractForm] = useState({
    title: '',
    description: '',
    totalValue: '',
    monthlyValue: '',
    monthlyStartDate: '',
    paymentTerms: '100_UPFRONT', // '100_UPFRONT', '50_50', 'CUSTOM'
    requiredAdminSignatures: 1, // 0, 1, or 2
    clientSignatureRequired: true,
  })
  const [savingContract, setSavingContract] = useState(false)

  // Amendment state
  const [showAmendmentModal, setShowAmendmentModal] = useState(false)
  const [amendmentContractId, setAmendmentContractId] = useState<string | null>(null)
  const [editingAmendment, setEditingAmendment] = useState<Amendment | null>(null)
  const [uploadingAmendmentId, setUploadingAmendmentId] = useState<string | null>(null)

  // Contract countersign state
  const [countersigningContractId, setCountersigningContractId] = useState<string | null>(null)

  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchClient()
    fetchPartners()
  }, [id])

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/admin/partners?status=ACTIVE')
      if (res.ok) {
        const data = await res.json()
        setPartners(data.partners.map((p: any) => ({
          id: p.id,
          name: p.name,
          partnerNumber: p.partnerNumber,
        })))
      }
    } catch (error) {
      console.error('Error fetching partners:', error)
    }
  }

  const assignPartnerToProject = async (projectId: string, partnerId: string | null) => {
    try {
      setSavingPartnerAssignment(true)
      const res = await fetch(`/api/admin/clients/${id}/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referredByPartnerId: partnerId }),
      })
      if (res.ok) {
        showToast(partnerId ? 'Partner assigned to project' : 'Partner removed from project', 'success')
        fetchClient() // Refresh data
        setAssigningPartnerToProject(null)
      } else {
        showToast('Failed to update project', 'error')
      }
    } catch (error) {
      showToast('Failed to update project', 'error')
    } finally {
      setSavingPartnerAssignment(false)
    }
  }

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
          requiredAdminSignatures: contractForm.requiredAdminSignatures,
          clientSignatureRequired: contractForm.clientSignatureRequired,
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
          requiredAdminSignatures: 1,
          clientSignatureRequired: true,
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

  // Send contract for signature
  const handleSendContract = async (contractId: string) => {
    try {
      const res = await fetch(`/api/admin/contracts/${contractId}/send`, {
        method: 'POST',
      })

      const data = await res.json()
      if (res.ok) {
        showToast('Contract sent for signature!', 'success')
        fetchClient()
      } else {
        showToast(data.error || 'Failed to send contract', 'error')
      }
    } catch (error) {
      showToast('Failed to send contract', 'error')
    }
  }

  // Amendment handlers
  const handleCreateAmendment = async (data: {
    title: string
    description?: string
    additionalValue: number
    additionalMonthlyValue?: number
    effectiveDate?: string
  }) => {
    if (!amendmentContractId) return

    try {
      const res = await fetch('/api/admin/amendments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientContractId: amendmentContractId,
          ...data,
        }),
      })

      if (res.ok) {
        showToast('Amendment created!', 'success')
        setShowAmendmentModal(false)
        setAmendmentContractId(null)
        fetchClient()
      } else {
        const result = await res.json()
        throw new Error(result.error || 'Failed to create amendment')
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create amendment', 'error')
      throw error
    }
  }

  const handleUpdateAmendment = async (data: {
    title: string
    description?: string
    additionalValue: number
    additionalMonthlyValue?: number
    effectiveDate?: string
  }) => {
    if (!editingAmendment) return

    try {
      const res = await fetch(`/api/admin/amendments/${editingAmendment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        showToast('Amendment updated!', 'success')
        setEditingAmendment(null)
        fetchClient()
      } else {
        const result = await res.json()
        throw new Error(result.error || 'Failed to update amendment')
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update amendment', 'error')
      throw error
    }
  }

  const handleUploadAmendmentPdf = async (amendmentId: string, file: File) => {
    try {
      setUploadingAmendmentId(amendmentId)
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/admin/amendments/${amendmentId}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        showToast('PDF uploaded!', 'success')
        fetchClient()
      } else {
        const result = await res.json()
        showToast(result.error || 'Failed to upload PDF', 'error')
      }
    } catch (error) {
      showToast('Failed to upload PDF', 'error')
    } finally {
      setUploadingAmendmentId(null)
    }
  }

  const handleSendAmendment = async (amendmentId: string) => {
    try {
      const res = await fetch(`/api/admin/amendments/${amendmentId}/send`, {
        method: 'POST',
      })

      if (res.ok) {
        showToast('Amendment sent for signature!', 'success')
        fetchClient()
      } else {
        const result = await res.json()
        showToast(result.error || 'Failed to send amendment', 'error')
      }
    } catch (error) {
      showToast('Failed to send amendment', 'error')
    }
  }

  const handleDeleteAmendment = async (amendmentId: string) => {
    if (!confirm('Are you sure you want to delete this amendment?')) return

    try {
      const res = await fetch(`/api/admin/amendments/${amendmentId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        showToast('Amendment deleted', 'success')
        fetchClient()
      } else {
        const result = await res.json()
        showToast(result.error || 'Failed to delete amendment', 'error')
      }
    } catch (error) {
      showToast('Failed to delete amendment', 'error')
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
            {client.projects.map((project) => {
              const isExpanded = expandedProjects.has(project.id)
              const hasLongDescription = project.description && project.description.length > 150

              return (
                <div
                  key={project.id}
                  style={{
                    background: '#0a0a0a',
                    borderRadius: '10px',
                    border: '1px solid #27272a',
                    overflow: 'hidden',
                  }}
                >
                  {/* Project Header */}
                  <div style={{
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    borderBottom: project.description ? '1px solid #27272a' : 'none',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: '16px' }}>{project.name}</span>
                        <span style={{
                          padding: '4px 10px',
                          background: `${getStatusColor(project.status)}20`,
                          color: getStatusColor(project.status),
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                          {project.status}
                        </span>
                        {project.serviceProjectId && (
                          <span style={{
                            padding: '4px 10px',
                            background: '#8b5cf620',
                            color: '#8b5cf6',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 500,
                          }}>
                            On Portfolio
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>
                        {project.type.replace(/_/g, ' ')}
                        {project.startDate && ` | Started ${formatDate(project.startDate)}`}
                      </p>
                      {/* Attribution */}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {project.referredBy ? (
                          <Link
                            href={`/admin/partners/${project.referredBy.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              background: '#10b98115',
                              border: '1px solid #10b98130',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#10b981',
                              textDecoration: 'none',
                            }}
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Referred by {project.referredBy.name}
                          </Link>
                        ) : null}
                        {project.closedBy && (
                          <Link
                            href={`/admin/team/${project.closedBy.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              background: '#3b82f615',
                              border: '1px solid #3b82f630',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#3b82f6',
                              textDecoration: 'none',
                            }}
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Closed by {project.closedBy.name}
                          </Link>
                        )}
                        {/* Assign Partner Button/Dropdown */}
                        {assigningPartnerToProject === project.id ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <select
                              value={project.referredByPartnerId || ''}
                              onChange={(e) => assignPartnerToProject(project.id, e.target.value || null)}
                              disabled={savingPartnerAssignment}
                              style={{
                                padding: '3px 8px',
                                background: '#18181b',
                                border: '1px solid #3f3f46',
                                borderRadius: '4px',
                                fontSize: '11px',
                                color: 'white',
                              }}
                            >
                              <option value="">No partner</option>
                              {partners.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setAssigningPartnerToProject(null)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#71717a',
                                cursor: 'pointer',
                                padding: '2px',
                                fontSize: '12px',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAssigningPartnerToProject(project.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              background: 'transparent',
                              border: '1px dashed #3f3f46',
                              borderRadius: '4px',
                              fontSize: '11px',
                              color: '#71717a',
                              cursor: 'pointer',
                            }}
                          >
                            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {project.referredBy ? 'Change' : 'Assign'} Partner
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '16px', minWidth: '120px' }}>
                      {project.contractValue ? (
                        <>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '18px', color: '#fff' }}>
                            {formatCurrency(Number(project.contractValue))}
                          </p>
                          {project.referredBy && (
                            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #27272a' }}>
                              <p style={{ margin: 0, fontSize: '11px', color: '#ef4444' }}>
                                -{formatCurrency(Number(project.contractValue) * (project.referredBy.firstSaleRate / 100))}
                                <span style={{ color: '#71717a', marginLeft: '4px' }}>
                                  ({project.referredBy.firstSaleRate}% {project.referredBy.name.split(' ')[0]})
                                </span>
                              </p>
                              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                                {formatCurrency(Number(project.contractValue) * (1 - project.referredBy.firstSaleRate / 100))}
                                <span style={{ color: '#71717a', fontWeight: 400, marginLeft: '4px', fontSize: '11px' }}>net</span>
                              </p>
                            </div>
                          )}
                        </>
                      ) : null}
                      {project.monthlyRecurring ? (
                        <div style={{ marginTop: project.contractValue ? '8px' : 0 }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6', fontWeight: 500 }}>
                            +{formatCurrency(Number(project.monthlyRecurring))}/mo
                          </p>
                          {project.referredBy && (
                            <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#10b981' }}>
                              {formatCurrency(Number(project.monthlyRecurring) * (1 - project.referredBy.recurringRate / 100))}/mo net
                              <span style={{ color: '#71717a', marginLeft: '4px' }}>
                                (-{project.referredBy.recurringRate}%)
                              </span>
                            </p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Description (collapsible) */}
                  {project.description && (
                    <div style={{ padding: '14px 16px', background: '#0f0f10' }}>
                      <p style={{
                        margin: 0,
                        color: '#a1a1aa',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {isExpanded || !hasLongDescription
                          ? project.description
                          : `${project.description.substring(0, 150)}...`}
                      </p>
                      {hasLongDescription && (
                        <button
                          onClick={() => toggleProjectExpanded(project.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3b82f6',
                            fontSize: '13px',
                            cursor: 'pointer',
                            padding: '8px 0 0 0',
                            fontWeight: 500,
                          }}
                        >
                          {isExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Project Footer - Links & Actions */}
                  <div style={{
                    padding: '12px 16px',
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    borderTop: '1px solid #27272a',
                    background: '#0a0a0a',
                  }}>
                    {project.productionUrl && (
                      <a
                        href={project.productionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#3b82f6',
                          fontSize: '13px',
                          textDecoration: 'none',
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Live Site
                      </a>
                    )}
                    {project.repositoryUrl && (
                      <a
                        href={project.repositoryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: '#3b82f6',
                          fontSize: '13px',
                          textDecoration: 'none',
                        }}
                      >
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        Repository
                      </a>
                    )}
                    <div style={{ flex: 1 }} />
                    {!project.serviceProjectId && project.status === 'COMPLETED' && (
                      <button
                        onClick={() => handlePublishToPortfolio(project.id, project.name)}
                        disabled={publishingProject === project.id}
                        style={{
                          padding: '6px 12px',
                          background: '#8b5cf6',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        {publishingProject === project.id ? 'Publishing...' : 'Publish to Portfolio'}
                      </button>
                    )}
                    {project.serviceProjectId && (
                      <Link
                        href={`/admin/services?tab=projects`}
                        style={{
                          padding: '6px 12px',
                          background: '#27272a',
                          borderRadius: '6px',
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
              )
            })}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {client.contracts.map((contract) => (
              <div key={contract.id}>
                {/* Contract Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px',
                    background: '#0a0a0a',
                    borderRadius: contract.amendments?.length ? '8px 8px 0 0' : '8px',
                    border: '1px solid #27272a',
                    borderBottom: contract.amendments?.length ? 'none' : '1px solid #27272a',
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
                    </p>
                    {/* Signature Status */}
                    <div style={{ marginTop: '4px', fontSize: '12px' }}>
                      {(() => {
                        // Count admin signatures from signatureFields
                        const adminSignatures = contract.signatureFields?.filter(f =>
                          (f.assignedTo === 'ADMIN' || f.assignedTo === 'ADMIN_2') && f.isSigned
                        ) || []
                        // Also count legacy countersignature as 1 admin signature
                        const adminSignedCount = contract.countersignedAt
                          ? Math.max(adminSignatures.length, 1)
                          : adminSignatures.length

                        const clientSigned = !!contract.signedAt
                        const requiredAdmin = contract.requiredAdminSignatures ?? 1
                        const clientRequired = contract.clientSignatureRequired ?? true

                        const parts: React.ReactNode[] = []

                        // Admin signatures status
                        if (requiredAdmin > 0) {
                          const adminComplete = adminSignedCount >= requiredAdmin
                          parts.push(
                            <span key="admin" style={{ color: adminComplete ? '#10b981' : '#f59e0b' }}>
                              {adminSignedCount} of {requiredAdmin} admin signature{requiredAdmin > 1 ? 's' : ''}
                              {adminSignatures.length > 0 && (
                                <span style={{ color: '#71717a' }}>
                                  {' ('}
                                  {adminSignatures.map((f, i) => (
                                    <span key={f.id}>
                                      {i > 0 ? ', ' : ''}{f.signedByName}
                                    </span>
                                  ))}
                                  {')'}
                                </span>
                              )}
                            </span>
                          )
                        }

                        // Client signature status
                        if (clientRequired) {
                          parts.push(
                            <span key="client" style={{ color: clientSigned ? '#10b981' : '#f59e0b', marginLeft: parts.length > 0 ? '8px' : 0 }}>
                              {parts.length > 0 ? ' | ' : ''}
                              {clientSigned
                                ? `Client signed by ${contract.signedByName || 'N/A'}`
                                : 'Client signature pending'}
                            </span>
                          )
                        }

                        return parts.length > 0 ? parts : <span style={{ color: '#71717a' }}>No signatures required</span>
                      })()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                        href={contract.status === 'SIGNED' || contract.status === 'ACTIVE'
                          ? `/api/admin/contracts/${contract.id}/composed-pdf`
                          : contract.fileUrl}
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
                    {/* Send for Signature Button - Show when contract is DRAFT and has PDF */}
                    {contract.fileUrl && contract.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSendContract(contract.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#f59e0b20',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#f59e0b',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Send for Signature
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setAmendmentContractId(contract.id)
                        setShowAmendmentModal(true)
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#3b82f620',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#3b82f6',
                        fontSize: '13px',
                        cursor: 'pointer',
                      }}
                    >
                      + Amendment
                    </button>
                  </div>
                </div>

                {/* Sign as 47 Industries Card - Show when more admin signatures needed */}
                {contract.fileUrl && contract.status !== 'ACTIVE' && (() => {
                  const requiredAdmin = contract.requiredAdminSignatures ?? 1
                  // Count admin signatures from signatureFields + legacy countersignature
                  const adminSignatures = contract.signatureFields?.filter(f =>
                    (f.assignedTo === 'ADMIN' || f.assignedTo === 'ADMIN_2') && f.isSigned
                  ) || []
                  const adminSignedCount = contract.countersignedAt
                    ? Math.max(adminSignatures.length, 1)
                    : adminSignatures.length
                  const remainingAdmin = Math.max(0, requiredAdmin - adminSignedCount)

                  // Show if more admin signatures are needed
                  if (remainingAdmin <= 0) return null

                  return (
                    <div style={{
                      marginTop: '8px',
                      padding: '16px',
                      background: '#3b82f610',
                      border: '1px solid #3b82f630',
                      borderRadius: '8px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: '#3b82f6' }}>Sign as 47 Industries</p>
                          <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: '13px' }}>
                            {remainingAdmin > 1
                              ? `${remainingAdmin} admin signatures remaining`
                              : remainingAdmin === 1 && adminSignedCount > 0
                              ? '1 more admin signature needed'
                              : contract.signedAt
                              ? 'Client has signed. Add your signature to fully execute the contract.'
                              : contract.status === 'DRAFT'
                              ? 'Sign this contract before or after sending it to the client.'
                              : 'You can sign now or wait for the client to sign first.'}
                          </p>
                        </div>
                        <button
                          onClick={() => setCountersigningContractId(contract.id)}
                          style={{
                            padding: '10px 20px',
                            background: '#3b82f6',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Sign Contract
                        </button>
                      </div>
                    </div>
                  )
                })()}

                {/* Edit Signatures Card - Show when contract has been countersigned */}
                {contract.fileUrl && contract.countersignedAt && (
                  <div style={{
                    marginTop: '8px',
                    padding: '16px',
                    background: '#71717a10',
                    border: '1px solid #71717a30',
                    borderRadius: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: '#a1a1aa' }}>Edit Signatures</p>
                        <p style={{ margin: '4px 0 0 0', color: '#71717a', fontSize: '13px' }}>
                          Re-open the signing interface to adjust or re-place signatures
                        </p>
                      </div>
                      <button
                        onClick={() => setCountersigningContractId(contract.id)}
                        style={{
                          padding: '10px 20px',
                          background: '#27272a',
                          border: '1px solid #3f3f46',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit Signatures
                      </button>
                    </div>
                  </div>
                )}

                {/* Amendments Section */}
                {contract.amendments && contract.amendments.length > 0 && (
                  <div style={{
                    background: '#0f0f0f',
                    borderRadius: '0 0 8px 8px',
                    border: '1px solid #27272a',
                    borderTop: '1px dashed #27272a',
                    padding: '12px',
                  }}>
                    <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#71717a', fontWeight: 500, textTransform: 'uppercase' }}>
                      Amendments ({contract.amendments.length})
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {contract.amendments.map((amendment) => (
                        <div
                          key={amendment.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            background: '#18181b',
                            borderRadius: '6px',
                            border: '1px solid #27272a',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                              <span style={{ fontWeight: 500, fontSize: '14px' }}>{amendment.title}</span>
                              <span style={{
                                padding: '2px 6px',
                                background: amendment.status === 'ACTIVE' ? '#10b98120' :
                                           amendment.status === 'SIGNED' ? '#3b82f620' :
                                           amendment.status === 'SENT' ? '#f59e0b20' : '#71717a20',
                                color: amendment.status === 'ACTIVE' ? '#10b981' :
                                       amendment.status === 'SIGNED' ? '#3b82f6' :
                                       amendment.status === 'SENT' ? '#f59e0b' : '#71717a',
                                borderRadius: '4px',
                                fontSize: '11px',
                              }}>
                                {amendment.status}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '12px', color: '#71717a' }}>
                              {amendment.amendmentNumber}
                              {amendment.signedAt && ` | Signed by ${amendment.signedByName}`}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ margin: 0, fontWeight: 500, fontSize: '14px' }}>
                                +{formatCurrency(Number(amendment.additionalValue))}
                              </p>
                              {amendment.additionalMonthlyValue && (
                                <p style={{ margin: 0, fontSize: '11px', color: '#71717a' }}>
                                  +{formatCurrency(Number(amendment.additionalMonthlyValue))}/mo
                                </p>
                              )}
                            </div>
                            {amendment.fileUrl && (
                              <a
                                href={amendment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: '4px 10px',
                                  background: '#27272a',
                                  borderRadius: '4px',
                                  color: '#a1a1aa',
                                  fontSize: '12px',
                                  textDecoration: 'none',
                                }}
                              >
                                View
                              </a>
                            )}
                            {amendment.status === 'DRAFT' && (
                              <>
                                <button
                                  onClick={() => setEditingAmendment(amendment)}
                                  style={{
                                    padding: '4px 10px',
                                    background: '#27272a',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#a1a1aa',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Edit
                                </button>
                                <label style={{
                                  padding: '4px 10px',
                                  background: '#3b82f620',
                                  borderRadius: '4px',
                                  color: '#3b82f6',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                }}>
                                  {uploadingAmendmentId === amendment.id ? 'Uploading...' : (amendment.fileUrl ? 'Replace PDF' : 'Upload PDF')}
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleUploadAmendmentPdf(amendment.id, file)
                                      e.target.value = ''
                                    }}
                                    disabled={uploadingAmendmentId === amendment.id}
                                  />
                                </label>
                                {amendment.fileUrl && (
                                  <button
                                    onClick={() => handleSendAmendment(amendment.id)}
                                    style={{
                                      padding: '4px 10px',
                                      background: '#10b981',
                                      border: 'none',
                                      borderRadius: '4px',
                                      color: '#fff',
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Send
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteAmendment(amendment.id)}
                                  style={{
                                    padding: '4px 10px',
                                    background: '#ef444420',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: '#ef4444',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

              {/* Signature Requirements */}
              <div style={{
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                padding: '14px',
              }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#a1a1aa', fontWeight: 500 }}>
                  Signature Requirements
                </p>

                {/* Admin Signatures Required */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#71717a', marginBottom: '6px' }}>
                    Admin Signatures Required
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[0, 1, 2].map((num) => (
                      <button
                        key={num}
                        onClick={() => setContractForm({ ...contractForm, requiredAdminSignatures: num })}
                        style={{
                          flex: 1,
                          padding: '8px',
                          background: contractForm.requiredAdminSignatures === num ? '#3b82f6' : '#27272a',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Client Signature Required */}
                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                  }}>
                    <input
                      type="checkbox"
                      checked={contractForm.clientSignatureRequired}
                      onChange={(e) => setContractForm({ ...contractForm, clientSignatureRequired: e.target.checked })}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: '#3b82f6',
                      }}
                    />
                    <span style={{ fontSize: '13px', color: '#a1a1aa' }}>
                      Client signature required
                    </span>
                  </label>
                </div>
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
                    requiredAdminSignatures: 1,
                    clientSignatureRequired: true,
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

      {/* Amendment Create/Edit Modal */}
      {(showAmendmentModal || editingAmendment) && (
        <AmendmentFormModal
          amendment={editingAmendment}
          onSave={editingAmendment ? handleUpdateAmendment : handleCreateAmendment}
          onClose={() => {
            setShowAmendmentModal(false)
            setAmendmentContractId(null)
            setEditingAmendment(null)
          }}
        />
      )}

      {/* Contract Signing Modal */}
      {countersigningContractId && (() => {
        const contract = client.contracts.find(c => c.id === countersigningContractId)
        // Use originalFileUrl when editing (if it exists), otherwise use fileUrl
        const pdfUrl = contract?.originalFileUrl || contract?.fileUrl || ''
        return (
          <AdminContractSigningModal
            contractId={countersigningContractId}
            contractTitle={contract?.title || ''}
            contractFileUrl={pdfUrl}
            signatureType="admin"
            apiEndpoint={`/api/admin/contracts/${countersigningContractId}/sign-pdf`}
            clientId={client.id}
            onSuccess={() => {
              showToast('Contract signed!', 'success')
              setCountersigningContractId(null)
              fetchClient()
            }}
            onClose={() => setCountersigningContractId(null)}
          />
        )
      })()}
    </div>
  )
}
