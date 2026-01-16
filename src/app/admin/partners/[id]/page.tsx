'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useToast } from '@/components/ui/Toast'

// Dynamically import the signing modal to avoid SSR issues with signature_pad
const ContractSigningModal = dynamic(
  () => import('@/components/contracts/ContractSigningModal'),
  { ssr: false }
)

interface ReferredProject {
  id: string
  name: string
  type?: string
  status: string
  contractValue?: number
  monthlyRecurring?: number
  createdAt: string
  client: { id: string; name: string }
}

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
  stripeConnectId?: string
  stripeConnectStatus?: string
  zelleEmail?: string
  zellePhone?: string
  venmoUsername?: string
  cashAppTag?: string
  mailingAddress?: string
  createdAt: string
  updatedAt: string
  user?: { id: string; email: string; name?: string }
  contract?: {
    id: string
    title: string
    description?: string
    fileUrl?: string
    fileName?: string
    status: string
    signedAt?: string
    signedByName?: string
    signedByEmail?: string
    signedByIp?: string
    signatureUrl?: string
    // Countersignature fields
    countersignedAt?: string
    countersignedByName?: string
    countersignedByEmail?: string
    countersignedByIp?: string
    countersignatureUrl?: string
    createdAt?: string
  }
  leads: Lead[]
  commissions: Commission[]
  payouts: Payout[]
  referredProjects: ReferredProject[]
}

interface Lead {
  id: string
  leadNumber: string
  businessName: string
  contactName: string
  email: string
  phone?: string
  status: string
  createdAt: string
  closedAt?: string
  _count?: { commissions: number }
}

interface Commission {
  id: string
  type: string
  baseAmount: number
  rate: number
  amount: number
  status: string
  createdAt: string
  lead: { businessName: string; leadNumber: string }
  payout?: { payoutNumber: string; status: string }
}

interface Payout {
  id: string
  payoutNumber: string
  amount: number
  method?: string
  reference?: string
  status: string
  paidAt?: string
  createdAt: string
  _count?: { commissions: number }
}

export default function PartnerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'leads' | 'commissions' | 'payouts'>('overview')
  const [showCreatePayoutModal, setShowCreatePayoutModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showLinkUserModal, setShowLinkUserModal] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
  const [showPaymentMethodsModal, setShowPaymentMethodsModal] = useState(false)
  const [savingContract, setSavingContract] = useState(false)
  const [savingPaymentMethods, setSavingPaymentMethods] = useState(false)
  const [uploadingContract, setUploadingContract] = useState(false)
  const [sendingContract, setSendingContract] = useState(false)
  const [showCountersignModal, setShowCountersignModal] = useState(false)
  const [countersigning, setCountersigning] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [contractForm, setContractForm] = useState({
    title: '',
    description: '',
    fileUrl: '',
    status: 'DRAFT',
  })
  const [paymentMethodsForm, setPaymentMethodsForm] = useState({
    zelleEmail: '',
    zellePhone: '',
    venmoUsername: '',
    cashAppTag: '',
    mailingAddress: '',
  })
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchPartner()
  }, [id])

  const fetchPartner = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/partners/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPartner(data.partner)
      } else if (res.status === 404) {
        showToast('Partner not found', 'error')
        router.push('/admin/partners')
      }
    } catch (error) {
      console.error('Error fetching partner:', error)
      showToast('Failed to load partner', 'error')
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: '#10b981',
      INACTIVE: '#6b7280',
      PENDING: '#f59e0b',
      NEW: '#3b82f6',
      CONTACTED: '#8b5cf6',
      QUALIFIED: '#f59e0b',
      CONVERTED: '#10b981',
      LOST: '#ef4444',
      APPROVED: '#10b981',
      PAID: '#10b981',
      FIRST_SALE: '#3b82f6',
      RECURRING: '#8b5cf6',
      // Contract statuses
      DRAFT: '#6b7280',
      SENT: '#f59e0b',
      SIGNED: '#10b981',
    }
    return colors[status] || '#6b7280'
  }

  const getContractStatusText = (status: string) => {
    const texts: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Awaiting Signature',
      SIGNED: 'Signed',
      ACTIVE: 'Active',
    }
    return texts[status] || status
  }

  const handleSendForSignature = async () => {
    if (!partner?.contract) return

    if (!confirm('Send this contract to ' + partner.name + ' for signature? They will receive an email with a link to sign.')) {
      return
    }

    setSendingContract(true)
    try {
      const res = await fetch(`/api/admin/partners/${id}/contract/send`, {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Contract sent for signature!', 'success')
        fetchPartner()
      } else {
        showToast(data.error || 'Failed to send contract', 'error')
      }
    } catch (error) {
      showToast('Failed to send contract', 'error')
    } finally {
      setSendingContract(false)
    }
  }

  const handleCountersign = async (data: { signedByName: string; signatureDataUrl: string }) => {
    if (!partner?.contract) return

    setCountersigning(true)
    try {
      const res = await fetch(`/api/admin/partners/${id}/contract/countersign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (res.ok) {
        showToast(result.message || 'Contract countersigned!', 'success')
        setShowCountersignModal(false)
        fetchPartner()
      } else {
        throw new Error(result.error || 'Failed to countersign')
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to countersign', 'error')
    } finally {
      setCountersigning(false)
    }
  }

  const getTotalEarned = () => {
    if (!partner) return 0
    return partner.commissions.reduce((sum, c) => sum + Number(c.amount), 0)
  }

  const getPendingAmount = () => {
    if (!partner) return 0
    return partner.commissions
      .filter(c => c.status === 'PENDING' || c.status === 'APPROVED')
      .reduce((sum, c) => sum + Number(c.amount), 0)
  }

  const getTotalPaid = () => {
    if (!partner) return 0
    return partner.payouts
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0)
  }

  const getPayableCommissions = () => {
    if (!partner) return []
    return partner.commissions.filter(c => c.status === 'APPROVED' && !c.payout)
  }

  if (loading) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#71717a' }}>Loading partner...</p>
      </div>
    )
  }

  if (!partner) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#71717a' }}>Partner not found</p>
      </div>
    )
  }

  return (
    <div style={{ color: '#fff', maxWidth: '1100px' }}>
      {/* Back Link */}
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

      {/* Partner Header */}
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
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{partner.name}</h1>
              <span style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: `${getStatusColor(partner.status)}20`,
                color: getStatusColor(partner.status),
              }}>
                {partner.status}
              </span>
              {partner.user && (
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: '#3b82f620',
                  color: '#3b82f6',
                }}>
                  Portal Access
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: '#a1a1aa' }}>
              <span>{partner.email}</span>
              {partner.phone && <span>{partner.phone}</span>}
              {partner.company && <span>{partner.company}</span>}
            </div>

            <p style={{ margin: '8px 0 0 0', color: '#71717a', fontSize: '13px' }}>
              {partner.partnerNumber} | Partner since {formatDate(partner.createdAt)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowEditModal(true)}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            {getPayableCommissions().length > 0 && (
              <button
                onClick={() => setShowCreatePayoutModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Create Payout
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '16px',
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #27272a',
        }}>
          <div>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
              First Sale Rate
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
              {partner.firstSaleRate}%
            </p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
              Recurring Rate
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#8b5cf6' }}>
              {partner.recurringRate}%
            </p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
              Total Earned
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
              {formatCurrency(getTotalEarned())}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
              Pending
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
              {formatCurrency(getPendingAmount())}
            </p>
          </div>
          <div>
            <p style={{ margin: 0, color: '#71717a', fontSize: '12px', textTransform: 'uppercase' }}>
              Paid Out
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700 }}>
              {formatCurrency(getTotalPaid())}
            </p>
          </div>
        </div>
      </div>

      {/* Portal Access */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Partner Portal Access</h2>
            {partner.user ? (
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
          {partner.user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: '#a1a1aa' }}>
                {partner.user.email}
                {partner.user.name && ` (${partner.user.name})`}
              </span>
              <button
                onClick={async () => {
                  if (!confirm('Unlink this user from the partner? They will lose portal access.')) return
                  try {
                    const res = await fetch(`/api/admin/partners/${id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userId: null }),
                    })
                    if (res.ok) {
                      showToast('User unlinked', 'success')
                      fetchPartner()
                    }
                  } catch (error) {
                    showToast('Failed to unlink user', 'error')
                  }
                }}
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
        {!partner.user && (
          <p style={{ margin: '10px 0 0 0', color: '#71717a', fontSize: '13px' }}>
            Link a user account to give this partner access to their dashboard at /account/partner
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '20px',
        borderBottom: '1px solid #27272a',
        paddingBottom: '1px',
      }}>
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'projects', label: `Referred Projects (${partner.referredProjects?.length || 0})` },
          { key: 'leads', label: `Leads (${partner.leads.length})` },
          { key: 'commissions', label: `Commissions (${partner.commissions.length})` },
          { key: 'payouts', label: `Payouts (${partner.payouts.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.key ? '#27272a' : 'transparent',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              color: activeTab === tab.key ? 'white' : '#71717a',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Contract Section */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Contract</h2>
              {partner.contract && (
                <button
                  onClick={() => {
                    setContractForm({
                      title: partner?.contract?.title || '',
                      description: partner?.contract?.description || '',
                      fileUrl: partner?.contract?.fileUrl || '',
                      status: partner?.contract?.status || 'DRAFT',
                    })
                    setShowContractModal(true)
                  }}
                  style={{
                    padding: '6px 14px',
                    background: '#27272a',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Edit Details
                </button>
              )}
            </div>

            {/* File Upload Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={async (e) => {
                e.preventDefault()
                setIsDragging(false)
                const file = e.dataTransfer.files[0]
                if (!file) return
                if (file.type !== 'application/pdf') {
                  showToast('Please upload a PDF file', 'error')
                  return
                }

                setUploadingContract(true)
                try {
                  const formData = new FormData()
                  formData.append('file', file)

                  const res = await fetch(`/api/admin/partners/${id}/contract/upload`, {
                    method: 'POST',
                    body: formData,
                  })
                  const data = await res.json()
                  if (res.ok) {
                    showToast('Contract uploaded successfully!', 'success')
                    fetchPartner()
                  } else {
                    showToast(data.error || 'Failed to upload contract', 'error')
                  }
                } catch (error) {
                  showToast('Failed to upload contract', 'error')
                } finally {
                  setUploadingContract(false)
                }
              }}
              style={{
                background: isDragging ? '#3b82f610' : '#0a0a0a',
                border: `2px dashed ${isDragging ? '#3b82f6' : '#27272a'}`,
                borderRadius: '8px',
                padding: partner.contract?.fileUrl ? '0' : '32px 20px',
                textAlign: 'center',
                cursor: uploadingContract ? 'wait' : 'pointer',
                transition: 'all 0.2s',
                marginBottom: partner.contract && !partner.contract.fileUrl ? '16px' : '0',
              }}
              onClick={() => {
                if (uploadingContract || partner.contract?.fileUrl) return
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.pdf'
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (!file) return

                  setUploadingContract(true)
                  try {
                    const formData = new FormData()
                    formData.append('file', file)

                    const res = await fetch(`/api/admin/partners/${id}/contract/upload`, {
                      method: 'POST',
                      body: formData,
                    })
                    const data = await res.json()
                    if (res.ok) {
                      showToast('Contract uploaded successfully!', 'success')
                      fetchPartner()
                    } else {
                      showToast(data.error || 'Failed to upload contract', 'error')
                    }
                  } catch (error) {
                    showToast('Failed to upload contract', 'error')
                  } finally {
                    setUploadingContract(false)
                  }
                }
                input.click()
              }}
            >
              {partner.contract?.fileUrl ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                }}>
                  <svg width="40" height="40" fill="none" viewBox="0 0 24 24" style={{ color: '#ef4444', flexShrink: 0 }}>
                    <path fill="currentColor" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                    <path stroke="#fff" strokeWidth="1.5" d="M14 2v6h6"/>
                    <text x="7" y="17" fill="#fff" fontSize="6" fontWeight="bold">PDF</text>
                  </svg>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '15px' }}>
                        {partner.contract.fileName || 'Partner Agreement.pdf'}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        background: `${getStatusColor(partner.contract.status)}20`,
                        color: getStatusColor(partner.contract.status),
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {getContractStatusText(partner.contract.status)}
                      </span>
                    </div>
                    {partner.contract.signedAt && partner.contract.signedByName && (
                      <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>
                        Signed by {partner.contract.signedByName} on {formatDate(partner.contract.signedAt)}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Send for Signature Button - Only show when DRAFT */}
                    {partner.contract.status === 'DRAFT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSendForSignature()
                        }}
                        disabled={sendingContract}
                        style={{
                          padding: '8px 16px',
                          background: '#f59e0b',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'black',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: sendingContract ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: sendingContract ? 0.7 : 1,
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        {sendingContract ? 'Sending...' : 'Send for Signature'}
                      </button>
                    )}
                    {/* Resend Button - Show when SENT */}
                    {partner.contract.status === 'SENT' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleSendForSignature()
                        }}
                        disabled={sendingContract}
                        style={{
                          padding: '8px 16px',
                          background: '#27272a',
                          border: '1px solid #f59e0b',
                          borderRadius: '6px',
                          color: '#f59e0b',
                          fontSize: '13px',
                          fontWeight: 500,
                          cursor: sendingContract ? 'wait' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: sendingContract ? 0.7 : 1,
                        }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {sendingContract ? 'Sending...' : 'Resend Email'}
                      </button>
                    )}
                    <a
                      href={partner.contract.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '8px 16px',
                        background: '#3b82f6',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: 500,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </a>
                    <a
                      href={partner.contract.fileUrl}
                      download
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '8px 16px',
                        background: '#27272a',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!confirm('Remove this contract file? This cannot be undone.')) return
                        try {
                          const res = await fetch(`/api/admin/partners/${id}/contract`, {
                            method: 'DELETE',
                          })
                          if (res.ok) {
                            showToast('Contract removed', 'success')
                            fetchPartner()
                          }
                        } catch (error) {
                          showToast('Failed to remove contract', 'error')
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#27272a',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {uploadingContract ? (
                    <div style={{ color: '#71717a', fontSize: '14px' }}>
                      Uploading contract...
                    </div>
                  ) : (
                    <>
                      <svg width="40" height="40" fill="none" stroke="#71717a" viewBox="0 0 24 24" style={{ margin: '0 auto 12px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                        <span style={{ color: '#3b82f6', fontWeight: 500 }}>Click to upload</span> or drag and drop
                      </p>
                      <p style={{ margin: '6px 0 0 0', color: '#71717a', fontSize: '12px' }}>
                        PDF files only
                      </p>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Signatures Section - Show when contract has any signatures */}
            {partner.contract && (partner.contract.signatureUrl || partner.contract.countersignatureUrl) && (
              <div style={{
                marginTop: '16px',
                background: partner.contract.status === 'ACTIVE' ? '#10b98110' : '#3b82f610',
                border: `1px solid ${partner.contract.status === 'ACTIVE' ? '#10b98130' : '#3b82f630'}`,
                borderRadius: '8px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <svg width="20" height="20" fill="none" stroke={partner.contract.status === 'ACTIVE' ? '#10b981' : '#3b82f6'} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span style={{ color: partner.contract.status === 'ACTIVE' ? '#10b981' : '#3b82f6', fontWeight: 600 }}>
                    {partner.contract.status === 'ACTIVE' ? 'Contract Fully Executed' : 'Contract Signatures'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Partner Signature */}
                  {partner.contract.signatureUrl && (
                    <div>
                      <p style={{ margin: '0 0 8px 0', color: '#a1a1aa', fontSize: '12px', textTransform: 'uppercase' }}>Partner Signature</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid #27272a',
                        }}>
                          <img
                            src={partner.contract.signatureUrl}
                            alt="Partner signature"
                            style={{ height: '50px', width: 'auto' }}
                          />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 500 }}>{partner.contract.signedByName}</p>
                          {partner.contract.signedAt && (
                            <p style={{ margin: '2px 0 0 0', color: '#71717a', fontSize: '13px' }}>
                              {formatDate(partner.contract.signedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Admin Countersignature */}
                  {partner.contract.countersignatureUrl && (
                    <div>
                      <p style={{ margin: '0 0 8px 0', color: '#a1a1aa', fontSize: '12px', textTransform: 'uppercase' }}>47 Industries Signature</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          background: 'white',
                          borderRadius: '8px',
                          padding: '12px',
                          border: '1px solid #27272a',
                        }}>
                          <img
                            src={partner.contract.countersignatureUrl}
                            alt="Company signature"
                            style={{ height: '50px', width: 'auto' }}
                          />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 500 }}>{partner.contract.countersignedByName}</p>
                          {partner.contract.countersignedAt && (
                            <p style={{ margin: '2px 0 0 0', color: '#71717a', fontSize: '13px' }}>
                              {formatDate(partner.contract.countersignedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Countersign Button - Show when contract is SENT or SIGNED but not countersigned */}
            {partner.contract &&
             partner.contract.fileUrl &&
             (partner.contract.status === 'SENT' || partner.contract.status === 'SIGNED') &&
             !partner.contract.countersignedAt && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: '#3b82f610',
                border: '1px solid #3b82f630',
                borderRadius: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: '#3b82f6' }}>Admin Signature Required</p>
                    <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: '13px' }}>
                      {partner.contract.signedAt
                        ? 'Partner has signed. Add your countersignature to fully execute the contract.'
                        : 'You can countersign now or wait for the partner to sign first.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCountersignModal(true)}
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
                    Countersign
                  </button>
                </div>
              </div>
            )}

            {/* Contract Details (shown below file if exists but no file URL) */}
            {partner.contract && !partner.contract.fileUrl && (
              <div style={{
                background: '#0a0a0a',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #27272a',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{partner.contract.title}</span>
                  <span style={{
                    padding: '2px 8px',
                    background: `${getStatusColor(partner.contract.status)}20`,
                    color: getStatusColor(partner.contract.status),
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}>
                    {getContractStatusText(partner.contract.status)}
                  </span>
                </div>
                {partner.contract.description && (
                  <p style={{ margin: '8px 0 0 0', color: '#a1a1aa', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                    {partner.contract.description}
                  </p>
                )}
                {partner.contract.signedAt && partner.contract.signedByName && (
                  <p style={{ margin: '8px 0 0 0', color: '#71717a', fontSize: '13px' }}>
                    Signed by {partner.contract.signedByName} on {formatDate(partner.contract.signedAt)}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Payment Methods</h2>
              <button
                onClick={() => setShowEditModal(true)}
                style={{
                  padding: '6px 14px',
                  background: '#27272a',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Edit Payment Methods
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {partner.stripeConnectId && (
                <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '14px', border: '1px solid #27272a' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Stripe Connect</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: partner.stripeConnectStatus === 'CONNECTED' ? '#10b981' : '#f59e0b' }}>
                    {partner.stripeConnectStatus || 'Pending'}
                  </p>
                </div>
              )}
              {partner.zelleEmail && (
                <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '14px', border: '1px solid #27272a' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Zelle</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{partner.zelleEmail}</p>
                </div>
              )}
              {partner.venmoUsername && (
                <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '14px', border: '1px solid #27272a' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Venmo</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>@{partner.venmoUsername}</p>
                </div>
              )}
              {partner.cashAppTag && (
                <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '14px', border: '1px solid #27272a' }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Cash App</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>${partner.cashAppTag}</p>
                </div>
              )}
              {!partner.stripeConnectId && !partner.zelleEmail && !partner.venmoUsername && !partner.cashAppTag && (
                <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No payment methods configured</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {partner.leads.slice(0, 3).map((lead) => (
                <div key={lead.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#0a0a0a',
                  borderRadius: '8px',
                  border: '1px solid #27272a',
                }}>
                  <div>
                    <span style={{ fontWeight: 500 }}>{lead.businessName}</span>
                    <span style={{ color: '#71717a', fontSize: '13px', marginLeft: '10px' }}>{lead.leadNumber}</span>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    background: `${getStatusColor(lead.status)}20`,
                    color: getStatusColor(lead.status),
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}>
                    {lead.status}
                  </span>
                </div>
              ))}
              {partner.leads.length === 0 && (
                <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No leads yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Referred Projects</h2>
            <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>
              Projects where this partner is credited as the referral source
            </p>
          </div>
          {(!partner.referredProjects || partner.referredProjects.length === 0) ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              background: '#0a0a0a',
              borderRadius: '8px',
              border: '1px solid #27272a',
            }}>
              <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>
                No projects assigned to this partner yet
              </p>
              <p style={{ color: '#52525b', margin: '8px 0 0 0', fontSize: '13px' }}>
                Assign a partner to projects from the Client detail page
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {partner.referredProjects.map((project) => (
                <div
                  key={project.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#0a0a0a',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{project.name}</span>
                      <span style={{
                        padding: '2px 8px',
                        background: `${getStatusColor(project.status)}20`,
                        color: getStatusColor(project.status),
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {project.status}
                      </span>
                      {project.type && (
                        <span style={{ color: '#71717a', fontSize: '12px' }}>
                          {project.type}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '13px' }}>
                      Client: {project.client.name}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#71717a', fontSize: '12px' }}>
                      {formatDate(project.createdAt)}
                      {project.contractValue && ` | Value: ${formatCurrency(Number(project.contractValue))}`}
                      {project.monthlyRecurring && ` | MRR: ${formatCurrency(Number(project.monthlyRecurring))}/mo`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    {project.contractValue && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#71717a' }}>First Sale Commission</p>
                        <p style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#3b82f6' }}>
                          {formatCurrency(Number(project.contractValue) * (partner.firstSaleRate / 100))}
                        </p>
                      </div>
                    )}
                    <Link
                      href={`/admin/clients/${project.client.id}`}
                      style={{
                        padding: '6px 12px',
                        background: '#27272a',
                        borderRadius: '6px',
                        color: '#a1a1aa',
                        fontSize: '13px',
                        textDecoration: 'none',
                      }}
                    >
                      View Client
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {partner.referredProjects && partner.referredProjects.length > 0 && (
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: '#10b98110',
              border: '1px solid #10b98130',
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>Total Potential First Sale Commission</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 700, color: '#10b981' }}>
                    {formatCurrency(
                      partner.referredProjects.reduce((sum, p) => {
                        return sum + (Number(p.contractValue || 0) * (partner.firstSaleRate / 100))
                      }, 0)
                    )}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>Total Contract Value</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: 700 }}>
                    {formatCurrency(
                      partner.referredProjects.reduce((sum, p) => sum + Number(p.contractValue || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'leads' && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Partner Leads</h2>
          {partner.leads.length === 0 ? (
            <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No leads submitted</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {partner.leads.map((lead) => (
                <div
                  key={lead.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#0a0a0a',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{lead.businessName}</span>
                      <span style={{ color: '#71717a', fontSize: '13px' }}>{lead.leadNumber}</span>
                      <span style={{
                        padding: '2px 8px',
                        background: `${getStatusColor(lead.status)}20`,
                        color: getStatusColor(lead.status),
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {lead.status}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '13px' }}>
                      {lead.contactName} | {lead.email}
                      {lead.phone && ` | ${lead.phone}`}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#71717a', fontSize: '12px' }}>
                      Submitted {formatDate(lead.createdAt)}
                      {lead.closedAt && ` | Closed ${formatDate(lead.closedAt)}`}
                    </p>
                  </div>
                  <Link
                    href={`/admin/partners/leads/${lead.id}`}
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
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'commissions' && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Commissions</h2>
          {partner.commissions.length === 0 ? (
            <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No commissions earned</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {partner.commissions.map((commission) => (
                <div
                  key={commission.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#0a0a0a',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{commission.lead.businessName}</span>
                      <span style={{
                        padding: '2px 8px',
                        background: `${getStatusColor(commission.type)}20`,
                        color: getStatusColor(commission.type),
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
                      {commission.rate}% of {formatCurrency(Number(commission.baseAmount))}
                    </p>
                    <p style={{ margin: '4px 0 0 0', color: '#71717a', fontSize: '12px' }}>
                      {formatDate(commission.createdAt)}
                      {commission.payout && ` | Payout: ${commission.payout.payoutNumber}`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '18px', color: '#10b981' }}>
                      {formatCurrency(Number(commission.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'payouts' && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Payouts</h2>
            {getPayableCommissions().length > 0 && (
              <button
                onClick={() => setShowCreatePayoutModal(true)}
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
                Create Payout ({formatCurrency(getPayableCommissions().reduce((sum, c) => sum + Number(c.amount), 0))})
              </button>
            )}
          </div>
          {partner.payouts.length === 0 ? (
            <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No payouts yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {partner.payouts.map((payout) => (
                <div
                  key={payout.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#0a0a0a',
                    borderRadius: '8px',
                    border: '1px solid #27272a',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{payout.payoutNumber}</span>
                      <span style={{
                        padding: '2px 8px',
                        background: `${getStatusColor(payout.status)}20`,
                        color: getStatusColor(payout.status),
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {payout.status}
                      </span>
                      {payout.method && (
                        <span style={{ color: '#71717a', fontSize: '12px' }}>
                          via {payout.method}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>
                      Created {formatDate(payout.createdAt)}
                      {payout.paidAt && ` | Paid ${formatDate(payout.paidAt)}`}
                      {payout.reference && ` | Ref: ${payout.reference}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: '18px' }}>
                      {formatCurrency(Number(payout.amount))}
                    </p>
                    {payout.status === 'PENDING' && (
                      <button
                        onClick={async () => {
                          if (!confirm('Mark this payout as paid?')) return
                          try {
                            const res = await fetch(`/api/admin/partners/payouts/${payout.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: 'PAID' }),
                            })
                            if (res.ok) {
                              showToast('Payout marked as paid', 'success')
                              fetchPartner()
                            }
                          } catch (error) {
                            showToast('Failed to update payout', 'error')
                          }
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#10b981',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Payout Modal */}
      {showCreatePayoutModal && (
        <CreatePayoutModal
          partner={partner}
          payableCommissions={getPayableCommissions()}
          onClose={() => setShowCreatePayoutModal(false)}
          onSuccess={() => {
            setShowCreatePayoutModal(false)
            showToast('Payout created successfully', 'success')
            fetchPartner()
          }}
        />
      )}

      {/* Link User Modal */}
      {showLinkUserModal && (
        <LinkUserModal
          partnerId={id}
          partnerEmail={partner.email}
          onClose={() => setShowLinkUserModal(false)}
          onSuccess={() => {
            setShowLinkUserModal(false)
            showToast('User linked successfully', 'success')
            fetchPartner()
          }}
        />
      )}

      {/* Edit Partner Modal */}
      {showEditModal && (
        <EditPartnerModal
          partner={partner}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            showToast('Partner updated successfully', 'success')
            fetchPartner()
          }}
        />
      )}

      {/* Contract Modal */}
      {showContractModal && (
        <ContractModal
          partnerId={id}
          existingContract={partner?.contract}
          formData={contractForm}
          setFormData={setContractForm}
          saving={savingContract}
          onClose={() => setShowContractModal(false)}
          onSuccess={() => {
            setShowContractModal(false)
            showToast('Contract saved successfully', 'success')
            fetchPartner()
          }}
          setSaving={setSavingContract}
        />
      )}

      {/* Countersign Modal */}
      {showCountersignModal && partner?.contract?.fileUrl && (
        <ContractSigningModal
          contractTitle={`Countersign: ${partner.contract.title}`}
          contractFileUrl={partner.contract.fileUrl}
          onSign={handleCountersign}
          onClose={() => setShowCountersignModal(false)}
        />
      )}
    </div>
  )
}

// Create Payout Modal
function CreatePayoutModal({
  partner,
  payableCommissions,
  onClose,
  onSuccess,
}: {
  partner: Partner
  payableCommissions: Commission[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [method, setMethod] = useState('')
  const [reference, setReference] = useState('')
  const { showToast } = useToast()

  const totalAmount = payableCommissions.reduce((sum, c) => sum + Number(c.amount), 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch('/api/admin/partners/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: partner.id,
          commissionIds: payableCommissions.map(c => c.id),
          method: method || undefined,
          notes: reference || undefined,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to create payout', 'error')
      }
    } catch (error) {
      showToast('Failed to create payout', 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Create Payout</h3>

        <div style={{
          background: '#10b98120',
          border: '1px solid #10b98140',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#a1a1aa' }}>
            Payout to {partner.name}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '28px', fontWeight: 700, color: '#10b981' }}>
            {formatCurrency(totalAmount)}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#71717a' }}>
            {payableCommissions.length} commission{payableCommissions.length !== 1 ? 's' : ''} included
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
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
              <option value="">Select method...</option>
              <option value="CASH">Cash</option>
              <option value="CHECK">Check</option>
              <option value="ZELLE">Zelle</option>
              <option value="VENMO">Venmo</option>
              <option value="STRIPE_CONNECT">Stripe Connect</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
              Reference / Notes
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Check number, transaction ID, etc."
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

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                background: '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Creating...' : 'Create Payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Link User Modal
function LinkUserModal({
  partnerId,
  partnerEmail,
  onClose,
  onSuccess,
}: {
  partnerId: string
  partnerEmail: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [searchQuery, setSearchQuery] = useState(partnerEmail)
  const [searchResults, setSearchResults] = useState<Array<{
    id: string
    email: string
    name?: string
    partner?: { id: string; name: string }
  }>>([])
  const [searching, setSearching] = useState(false)
  const [linking, setLinking] = useState(false)
  const [showInviteOption, setShowInviteOption] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([])
        setShowInviteOption(false)
        return
      }

      setSearching(true)
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.users || [])
          const isEmail = searchQuery.includes('@') && searchQuery.includes('.')
          const hasExactMatch = data.users?.some((u: { email: string }) => u.email.toLowerCase() === searchQuery.toLowerCase())
          setShowInviteOption(isEmail && !hasExactMatch)
        }
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setSearching(false)
      }
    }

    const debounce = setTimeout(searchUsers, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  const handleLinkUser = async (userId: string) => {
    try {
      setLinking(true)
      const res = await fetch(`/api/admin/partners/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to link user', 'error')
      }
    } catch (error) {
      showToast('Failed to link user', 'error')
    } finally {
      setLinking(false)
    }
  }

  const handleSendInvite = async () => {
    if (!searchQuery.includes('@')) return
    try {
      setLinking(true)
      // Create user with invite and link to partner
      const res = await fetch(`/api/admin/partners/${partnerId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchQuery.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || 'Invitation sent!', 'success')
        onSuccess()
      } else {
        showToast(data.error || 'Failed to send invitation', 'error')
      }
    } catch (error) {
      showToast('Failed to send invitation', 'error')
    } finally {
      setLinking(false)
    }
  }

  return (
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

        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
          {searching && (
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a', fontSize: '12px' }}>
              Searching...
            </div>
          )}
        </div>

        {searchResults.length > 0 && (
          <div style={{
            marginTop: '12px',
            background: '#0a0a0a',
            border: '1px solid #27272a',
            borderRadius: '8px',
            maxHeight: '200px',
            overflow: 'auto',
          }}>
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleLinkUser(user.id)}
                disabled={!!user.partner || linking}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #27272a',
                  color: user.partner ? '#71717a' : 'white',
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: user.partner ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 500 }}>{user.email}</div>
                  {user.name && <div style={{ fontSize: '12px', color: '#71717a' }}>{user.name}</div>}
                </div>
                {user.partner ? (
                  <span style={{ fontSize: '11px', color: '#f59e0b', background: '#f59e0b20', padding: '2px 6px', borderRadius: '4px' }}>
                    Partner: {user.partner.name}
                  </span>
                ) : (
                  <span style={{ fontSize: '12px', color: '#3b82f6' }}>Select</span>
                )}
              </button>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
          <div style={{
            marginTop: '12px',
            padding: '16px',
            background: '#0a0a0a',
            border: '1px solid #27272a',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 8px 0', color: '#71717a', fontSize: '14px' }}>
              No users found matching "{searchQuery}"
            </p>
            {showInviteOption && (
              <button
                onClick={handleSendInvite}
                disabled={linking}
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
                {linking ? 'Sending...' : `Send Invitation to ${searchQuery}`}
              </button>
            )}
          </div>
        )}

        <div style={{ marginTop: '16px' }}>
          <button
            onClick={onClose}
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
  )
}

// Edit Partner Modal
function EditPartnerModal({
  partner,
  onClose,
  onSuccess,
}: {
  partner: Partner
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: partner.name,
    email: partner.email,
    phone: partner.phone || '',
    company: partner.company || '',
    firstSaleRate: String(partner.firstSaleRate),
    recurringRate: String(partner.recurringRate),
    status: partner.status,
    zelleEmail: partner.zelleEmail || '',
    venmoUsername: partner.venmoUsername || '',
    cashAppTag: partner.cashAppTag || '',
  })
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/partners/${partner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          firstSaleRate: parseFloat(formData.firstSaleRate),
          recurringRate: parseFloat(formData.recurringRate),
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to update partner', 'error')
      }
    } catch (error) {
      showToast('Failed to update partner', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
      overflow: 'auto',
    }}>
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '550px',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #27272a',
          position: 'sticky',
          top: 0,
          background: '#18181b',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Edit Partner</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '20px' }}>
            {/* Basic Info */}
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
              Partner Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {/* Commission Rates */}
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
              Commission Rates
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  First Sale Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.firstSaleRate}
                  onChange={(e) => setFormData({ ...formData, firstSaleRate: e.target.value })}
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
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Recurring Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.recurringRate}
                  onChange={(e) => setFormData({ ...formData, recurringRate: e.target.value })}
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
              </div>
            </div>

            {/* Payment Methods */}
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#a1a1aa' }}>
              Payment Methods
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Zelle Email
                </label>
                <input
                  type="email"
                  value={formData.zelleEmail}
                  onChange={(e) => setFormData({ ...formData, zelleEmail: e.target.value })}
                  placeholder="zelle@email.com"
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
                  Venmo Username
                </label>
                <input
                  type="text"
                  value={formData.venmoUsername}
                  onChange={(e) => setFormData({ ...formData, venmoUsername: e.target.value })}
                  placeholder="username"
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
                  Cash App Tag
                </label>
                <input
                  type="text"
                  value={formData.cashAppTag}
                  onChange={(e) => setFormData({ ...formData, cashAppTag: e.target.value })}
                  placeholder="cashtag"
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
              disabled={saving}
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
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Contract Modal
function ContractModal({
  partnerId,
  existingContract,
  formData,
  setFormData,
  saving,
  setSaving,
  onClose,
  onSuccess,
}: {
  partnerId: string
  existingContract?: {
    id: string
    title: string
    description?: string
    fileUrl?: string
    status: string
    signedAt?: string
  }
  formData: {
    title: string
    description: string
    fileUrl: string
    status: string
  }
  setFormData: (data: { title: string; description: string; fileUrl: string; status: string }) => void
  saving: boolean
  setSaving: (saving: boolean) => void
  onClose: () => void
  onSuccess: () => void
}) {
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      showToast('Please enter a contract title', 'error')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/partners/${partnerId}/contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          fileUrl: formData.fileUrl || null,
          status: formData.status,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to save contract', 'error')
      }
    } catch (error) {
      showToast('Failed to save contract', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '20px',
    }}>
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '500px',
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
          {existingContract ? 'Edit Contract' : 'Add Contract'}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
              Contract Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Partner Referral Agreement"
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

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
              Description / Terms
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter contract terms, commission rates, duration, etc."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
              File URL (optional)
            </label>
            <input
              type="url"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              placeholder="https://example.com/contract.pdf"
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
            <p style={{ margin: '4px 0 0 0', color: '#71717a', fontSize: '12px' }}>
              Link to PDF or document stored externally
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="SIGNED">Signed</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
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
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
