'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import ConversationThread from '@/components/admin/ConversationThread'
import InlineReplyBox from '@/components/admin/InlineReplyBox'
import QuoteModal from '@/components/admin/QuoteModal'

interface InquiryMessage {
  id: string
  message: string
  isFromAdmin: boolean
  senderName: string | null
  senderEmail: string | null
  createdAt: string
  isQuote: boolean
  quoteAmount: number | null
  quoteMonthly: number | null
}

interface ServiceInquiry {
  id: string
  inquiryNumber: string
  name: string
  email: string
  phone?: string
  company?: string
  website?: string
  serviceType: string
  budget?: string
  timeline?: string
  description: string
  attachments?: {
    formVersion?: number
    projectDetails?: {
      services?: string[]
      package?: string
      projectName?: string
      targetAudience?: string
      pages?: string
      screens?: string
      features?: string[]
      hasDesign?: string
      designNotes?: string
      referenceUrls?: string
      integrations?: string
      existingSystem?: string
      startDate?: string
    }
    selectedServices?: string[]
    selectedPackage?: string
  }
  status: string
  assignedTo?: string
  estimatedCost?: number
  proposalUrl?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  messages?: InquiryMessage[]
}

export default function InquiryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [inquiry, setInquiry] = useState<ServiceInquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { showToast } = useToast()

  // Form state
  const [status, setStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [proposalUrl, setProposalUrl] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  // Quote state
  const [showQuoteModal, setShowQuoteModal] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchInquiry()
  }, [params.id])

  const fetchInquiry = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/inquiries/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setInquiry(data)
        setStatus(data.status)
        setAssignedTo(data.assignedTo || '')
        setEstimatedCost(data.estimatedCost?.toString() || '')
        setProposalUrl(data.proposalUrl || '')
        setAdminNotes(data.adminNotes || '')
      } else {
        router.push('/admin/inquiries?tab=service-inquiries')
      }
    } catch (error) {
      console.error('Error fetching inquiry:', error)
      router.push('/admin/inquiries?tab=service-inquiries')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/inquiries/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          assignedTo: assignedTo || null,
          estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
          proposalUrl: proposalUrl || null,
          adminNotes: adminNotes || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setInquiry(data)
        showToast('Inquiry updated successfully!', 'success')
      } else {
        showToast('Failed to update inquiry', 'error')
      }
    } catch (error) {
      console.error('Error updating inquiry:', error)
      showToast('Failed to update inquiry', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('Mark this inquiry as declined?')) {
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/inquiries/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DECLINED' }),
      })

      if (res.ok) {
        setStatus('DECLINED')
        setInquiry(inquiry ? { ...inquiry, status: 'DECLINED' } : null)
        showToast('Inquiry marked as declined', 'success')
      } else {
        showToast('Failed to update inquiry', 'error')
      }
    } catch (error) {
      console.error('Error updating inquiry:', error)
      showToast('Failed to update inquiry', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this inquiry? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/inquiries/${params.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/admin/inquiries?tab=service-inquiries')
      } else {
        showToast('Failed to delete inquiry', 'error')
      }
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      showToast('Failed to delete inquiry', 'error')
    }
  }


  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      NEW: '#3b82f6',
      CONTACTED: '#8b5cf6',
      PROPOSAL_SENT: '#f59e0b',
      NEGOTIATING: '#f59e0b',
      ACCEPTED: '#10b981',
      DECLINED: '#ef4444',
      COMPLETED: '#10b981',
    }
    return colors[s] || '#6b7280'
  }

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      WEB_DEVELOPMENT: 'Web Development',
      APP_DEVELOPMENT: 'App Development',
      AI_SOLUTIONS: 'AI Solutions',
      CONSULTATION: 'Consultation',
      OTHER: 'Other',
    }
    return labels[type] || type
  }

  const getServiceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      WEB_DEVELOPMENT: '#3b82f6',
      APP_DEVELOPMENT: '#8b5cf6',
      AI_SOLUTIONS: '#10b981',
      CONSULTATION: '#f59e0b',
      OTHER: '#6b7280',
    }
    return colors[type] || '#6b7280'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Calculate suggested quote based on project details
  const getSuggestedQuote = () => {
    if (!inquiry?.attachments?.projectDetails) return null

    const pd = inquiry.attachments.projectDetails
    let basePrice = 0
    const services = pd.services || inquiry.attachments.selectedServices || []

    // Base prices per service
    if (services.includes('WEBSITE')) basePrice += 2500
    if (services.includes('WEB_APP')) basePrice += 8000
    if (services.includes('IOS_APP')) basePrice += 8000
    if (services.includes('ANDROID_APP')) basePrice += 7500
    if (services.includes('CROSS_PLATFORM')) basePrice += 12000
    if (services.includes('AI_AUTOMATION')) basePrice += 799 // Monthly

    // Adjust for complexity
    const features = pd.features || []
    basePrice += features.length * 500

    // Adjust for pages/screens
    if (pd.pages?.includes('20-50')) basePrice += 2000
    if (pd.pages?.includes('50+')) basePrice += 5000
    if (pd.screens?.includes('25-50')) basePrice += 3000
    if (pd.screens?.includes('50+')) basePrice += 6000

    // Adjust for design needs
    if (pd.hasDesign === 'No, need design help' || pd.hasDesign === 'Just an idea') {
      basePrice += 2000
    }

    return basePrice
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <p style={{ color: '#71717a' }}>Loading inquiry...</p>
      </div>
    )
  }

  if (!inquiry) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <p style={{ color: '#71717a' }}>Inquiry not found</p>
      </div>
    )
  }

  const statuses = ['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'ACCEPTED', 'DECLINED', 'COMPLETED']
  const suggestedQuote = getSuggestedQuote()
  const projectDetails = inquiry.attachments?.projectDetails

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <Link
            href="/admin/inquiries?tab=service-inquiries"
            style={{
              color: '#71717a',
              textDecoration: 'none',
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '8px',
            }}
          >
            ← Back to Service Inquiries
          </Link>
          <h1 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: 700,
            margin: 0,
          }}>Inquiry {inquiry.inquiryNumber}</h1>
          <p style={{ color: '#71717a', margin: '8px 0 0 0' }}>
            {formatDate(inquiry.createdAt)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            background: `${getServiceTypeColor(inquiry.serviceType)}20`,
            color: getServiceTypeColor(inquiry.serviceType),
          }}>
            {getServiceTypeLabel(inquiry.serviceType)}
          </span>
          <span style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            background: `${getStatusColor(inquiry.status)}20`,
            color: getStatusColor(inquiry.status),
          }}>
            {inquiry.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Suggested Quote Banner */}
      {suggestedQuote && suggestedQuote > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #3b82f620, #8b5cf620)',
          border: '1px solid #3b82f640',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>Suggested Quote (based on project details)</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
              ${suggestedQuote.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => {
              setQuoteAmount(suggestedQuote.toString())
              setShowQuoteModal(true)
            }}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Send Quote
          </button>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
        gap: '24px',
      }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Customer Info */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Customer Information
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: '16px',
            }}>
              <div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Name</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{inquiry.name}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Email</p>
                <a href={`mailto:${inquiry.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  {inquiry.email}
                </a>
              </div>
              {inquiry.phone && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Phone</p>
                  <p style={{ margin: 0 }}>{inquiry.phone}</p>
                </div>
              )}
              {inquiry.company && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Company</p>
                  <p style={{ margin: 0 }}>{inquiry.company}</p>
                </div>
              )}
              {inquiry.website && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Website</p>
                  <a href={inquiry.website} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    {inquiry.website}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Project Details - Structured View */}
          {projectDetails && (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
                Project Requirements
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {projectDetails.projectName && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Project Name</p>
                    <p style={{ margin: 0, fontWeight: 500 }}>{projectDetails.projectName}</p>
                  </div>
                )}

                {(projectDetails?.services || inquiry.attachments?.selectedServices || []).length > 0 && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Services Requested</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {(projectDetails.services || inquiry.attachments?.selectedServices || []).map((s: string) => (
                        <span key={s} style={{
                          padding: '4px 10px',
                          background: '#3b82f620',
                          color: '#3b82f6',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}>
                          {s.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {inquiry.attachments?.selectedPackage && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Selected Package</p>
                    <p style={{ margin: 0 }}>{inquiry.attachments.selectedPackage}</p>
                  </div>
                )}

                {projectDetails.targetAudience && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Target Audience</p>
                    <p style={{ margin: 0 }}>{projectDetails.targetAudience}</p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {projectDetails.pages && (
                    <div>
                      <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Pages</p>
                      <p style={{ margin: 0 }}>{projectDetails.pages}</p>
                    </div>
                  )}
                  {projectDetails.screens && (
                    <div>
                      <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Screens</p>
                      <p style={{ margin: 0 }}>{projectDetails.screens}</p>
                    </div>
                  )}
                </div>

                {projectDetails.features && projectDetails.features.length > 0 && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Features Needed</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {projectDetails.features.map((f: string) => (
                        <span key={f} style={{
                          padding: '4px 10px',
                          background: '#27272a',
                          borderRadius: '6px',
                          fontSize: '13px',
                        }}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {projectDetails.hasDesign && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Design Status</p>
                    <p style={{ margin: 0 }}>{projectDetails.hasDesign}</p>
                  </div>
                )}

                {projectDetails.designNotes && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Design Notes</p>
                    <p style={{ margin: 0, color: '#a1a1aa' }}>{projectDetails.designNotes}</p>
                  </div>
                )}

                {projectDetails.referenceUrls && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Reference URLs</p>
                    <p style={{ margin: 0, color: '#a1a1aa', whiteSpace: 'pre-wrap' }}>{projectDetails.referenceUrls}</p>
                  </div>
                )}

                {projectDetails.integrations && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Integrations</p>
                    <p style={{ margin: 0, color: '#a1a1aa' }}>{projectDetails.integrations}</p>
                  </div>
                )}

                {projectDetails.existingSystem && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Existing System</p>
                    <p style={{ margin: 0, color: '#a1a1aa' }}>{projectDetails.existingSystem}</p>
                  </div>
                )}

                {projectDetails.startDate && (
                  <div>
                    <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Preferred Start Date</p>
                    <p style={{ margin: 0 }}>{projectDetails.startDate}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Project Details */}
          {!inquiry.inquiryNumber.startsWith('CONTACT-') && (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
                Project Details
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '16px',
              }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Service Type</p>
                  <p style={{ margin: 0, fontWeight: 500 }}>{getServiceTypeLabel(inquiry.serviceType)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Budget</p>
                  <p style={{ margin: 0 }}>{inquiry.budget || 'Not specified'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Timeline</p>
                  <p style={{ margin: 0 }}>{inquiry.timeline || 'Flexible'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Conversation */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Conversation
            </h2>

            <ConversationThread
              messages={[
                {
                  id: 'initial',
                  message: inquiry.description,
                  isFromAdmin: false,
                  senderName: inquiry.name,
                  senderEmail: inquiry.email,
                  createdAt: inquiry.createdAt,
                  isQuote: false,
                  quoteAmount: null,
                  quoteMonthly: null,
                },
                ...(inquiry.messages || []),
              ]}
              inquiryType={inquiry.inquiryNumber.startsWith('CONTACT-') ? 'contact' : 'service'}
            />

            <InlineReplyBox
              recipientEmail={inquiry.email}
              recipientName={inquiry.name}
              referenceNumber={inquiry.inquiryNumber}
              inquiryType={inquiry.inquiryNumber.startsWith('CONTACT-') ? 'contact' : 'service'}
              inquiryId={inquiry.id}
              onReplySent={fetchInquiry}
            />
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Actions */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setShowQuoteModal(true)}
                style={{
                  padding: '12px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Send Quote
              </button>
              {inquiry.phone && (
                <a
                  href={`tel:${inquiry.phone}`}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    background: '#27272a',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  Call Customer
                </a>
              )}
              <div style={{ borderTop: '1px solid #27272a', margin: '8px 0' }} />
              {status !== 'DECLINED' && (
                <button
                  onClick={handleReject}
                  disabled={saving}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    color: '#f59e0b',
                    border: '1px solid #f59e0b',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  Reject Inquiry
                </button>
              )}
              <button
                onClick={handleDelete}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Delete Inquiry
              </button>
            </div>
          </div>

          {/* Update Inquiry */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Update Inquiry
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Assigned To
              </label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Team member name..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Estimated Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Proposal URL
              </label>
              <input
                type="url"
                value={proposalUrl}
                onChange={(e) => setProposalUrl(e.target.value)}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Admin Notes (internal only)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        inquiryType={inquiry.inquiryNumber.startsWith('CONTACT-') ? 'contact' : 'service'}
        recipientEmail={inquiry.email}
        recipientName={inquiry.name}
        referenceNumber={inquiry.inquiryNumber}
        inquiryId={inquiry.id}
        onQuoteSent={fetchInquiry}
      />
    </div>
  )
}
