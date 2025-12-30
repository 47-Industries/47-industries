'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFile } from '@fortawesome/free-solid-svg-icons'
import { useToast } from '@/components/ui/Toast'
import ConversationThread from '@/components/admin/ConversationThread'
import InlineReplyBox from '@/components/admin/InlineReplyBox'
import QuoteModal from '@/components/admin/QuoteModal'

interface Message {
  id: string
  message: string
  isFromAdmin: boolean
  senderName: string | null
  senderEmail: string | null
  createdAt: string
  isQuote: boolean
  quoteAmount: number | null
}

interface CustomRequest {
  id: string
  requestNumber: string
  name: string
  email: string
  phone?: string
  company?: string
  fileUrl: string
  fileName: string
  fileSize: number
  material: string
  finish: string
  color: string
  quantity: number
  dimensions?: string
  scale?: number
  notes?: string
  deadline?: string
  estimatedPrice?: number
  estimatedDays?: number
  quoteNotes?: string
  quotedAt?: string
  quotedBy?: string
  status: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  messages?: Message[]
}

export default function CustomRequestDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { showToast } = useToast()
  const [request, setRequest] = useState<CustomRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showQuoteModal, setShowQuoteModal] = useState(false)

  // Form state
  const [status, setStatus] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [estimatedDays, setEstimatedDays] = useState('')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchRequest()
  }, [params.id])

  const fetchRequest = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/custom-requests/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setRequest(data)
        setStatus(data.status)
        setEstimatedPrice(data.estimatedPrice?.toString() || '')
        setEstimatedDays(data.estimatedDays?.toString() || '')
        setQuoteNotes(data.quoteNotes || '')
        setAdminNotes(data.adminNotes || '')
      } else {
        router.push('/admin/custom-requests')
      }
    } catch (error) {
      console.error('Error fetching request:', error)
      router.push('/admin/custom-requests')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/custom-requests/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : null,
          estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
          quoteNotes: quoteNotes || null,
          adminNotes: adminNotes || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setRequest(data)
        showToast('Request updated successfully!', 'success')
      } else {
        showToast('Failed to update request', 'error')
      }
    } catch (error) {
      console.error('Error updating request:', error)
      showToast('Failed to update request', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/custom-requests/${params.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/admin/custom-requests')
      } else {
        showToast('Failed to delete request', 'error')
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      showToast('Failed to delete request', 'error')
    }
  }

  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      REVIEWING: '#3b82f6',
      QUOTED: '#8b5cf6',
      APPROVED: '#10b981',
      IN_PRODUCTION: '#f59e0b',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
    }
    return colors[s] || '#6b7280'
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <p style={{ color: '#71717a' }}>Loading request...</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
      }}>
        <p style={{ color: '#71717a' }}>Request not found</p>
      </div>
    )
  }

  const statuses = ['PENDING', 'REVIEWING', 'QUOTED', 'APPROVED', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED']

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
            href="/admin/custom-requests"
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
            ← Back to Requests
          </Link>
          <h1 style={{
            fontSize: isMobile ? '24px' : '32px',
            fontWeight: 700,
            margin: 0,
          }}>Request {request.requestNumber}</h1>
          <p style={{ color: '#71717a', margin: '8px 0 0 0' }}>
            {formatDate(request.createdAt)}
          </p>
        </div>
        <span style={{
          display: 'inline-block',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 500,
          background: `${getStatusColor(request.status)}20`,
          color: getStatusColor(request.status),
        }}>
          {request.status.replace('_', ' ')}
        </span>
      </div>

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
                <p style={{ margin: 0, fontWeight: 500 }}>{request.name}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Email</p>
                <a href={`mailto:${request.email}`} style={{ color: '#3b82f6', textDecoration: 'none' }}>
                  {request.email}
                </a>
              </div>
              {request.phone && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Phone</p>
                  <p style={{ margin: 0 }}>{request.phone}</p>
                </div>
              )}
              {request.company && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Company</p>
                  <p style={{ margin: 0 }}>{request.company}</p>
                </div>
              )}
            </div>
          </div>

          {/* Print Specifications */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Print Specifications
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '16px',
            }}>
              <div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Material</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{request.material}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Finish</p>
                <p style={{ margin: 0 }}>{request.finish}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Color</p>
                <p style={{ margin: 0 }}>{request.color}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Quantity</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{request.quantity}</p>
              </div>
              {request.dimensions && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Dimensions</p>
                  <p style={{ margin: 0 }}>{request.dimensions}</p>
                </div>
              )}
              {request.scale && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Scale</p>
                  <p style={{ margin: 0 }}>{request.scale}x</p>
                </div>
              )}
              {request.deadline && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Deadline</p>
                  <p style={{ margin: 0 }}>{new Date(request.deadline).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* File */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Uploaded File
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              background: '#09090b',
              borderRadius: '12px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
              }}>
                <FontAwesomeIcon icon={faFile} style={{ color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>{request.fileName}</p>
                <p style={{ margin: 0, color: '#71717a', fontSize: '14px' }}>{formatFileSize(request.fileSize)}</p>
              </div>
              <a
                href={request.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                Download
              </a>
            </div>
          </div>

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
                ...(request.notes ? [{
                  id: 'initial',
                  message: `${request.notes}\n\n--- Specifications ---\nMaterial: ${request.material}\nFinish: ${request.finish}\nColor: ${request.color}\nQuantity: ${request.quantity}`,
                  isFromAdmin: false,
                  senderName: request.name,
                  senderEmail: request.email,
                  createdAt: request.createdAt,
                  isQuote: false,
                  quoteAmount: null,
                }] : []),
                ...(request.messages || []),
              ]}
              inquiryType="custom"
            />

            <InlineReplyBox
              recipientEmail={request.email}
              recipientName={request.name}
              referenceNumber={request.requestNumber}
              inquiryType="custom"
              inquiryId={request.id}
              onReplySent={fetchRequest}
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
              {request.phone && (
                <a
                  href={`tel:${request.phone}`}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 500,
                    textAlign: 'center',
                    textDecoration: 'none',
                  }}
                >
                  Call Customer
                </a>
              )}
              <a
                href={`mailto:${request.email}`}
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Email Customer
              </a>
              <button
                onClick={handleDelete}
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Delete Request
              </button>
            </div>
          </div>

          {/* Update Request */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Update Request
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
                Estimated Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={estimatedPrice}
                onChange={(e) => setEstimatedPrice(e.target.value)}
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
                Estimated Days
              </label>
              <input
                type="number"
                value={estimatedDays}
                onChange={(e) => setEstimatedDays(e.target.value)}
                placeholder="Number of days"
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
                Quote Notes (visible to customer)
              </label>
              <textarea
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Notes about the quote for the customer..."
                rows={3}
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                Admin Notes (internal only)
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal notes..."
                rows={3}
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
                marginBottom: '12px',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

            <button
              onClick={handleDelete}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Delete Request
            </button>
          </div>

          {/* Quote Info */}
          {request.quotedAt && (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: '24px',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
                Quote History
              </h2>
              <div style={{ fontSize: '14px' }}>
                <p style={{ margin: '0 0 8px 0' }}>
                  <span style={{ color: '#71717a' }}>Quoted by:</span> {request.quotedBy}
                </p>
                <p style={{ margin: '0 0 8px 0' }}>
                  <span style={{ color: '#71717a' }}>Quoted on:</span> {formatDate(request.quotedAt)}
                </p>
                {request.estimatedPrice && (
                  <p style={{ margin: '0 0 8px 0' }}>
                    <span style={{ color: '#71717a' }}>Price:</span>{' '}
                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                      ${Number(request.estimatedPrice).toFixed(2)}
                    </span>
                  </p>
                )}
                {request.estimatedDays && (
                  <p style={{ margin: 0 }}>
                    <span style={{ color: '#71717a' }}>Estimated time:</span> {request.estimatedDays} days
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <QuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        inquiryType="custom"
        recipientEmail={request.email}
        recipientName={request.name}
        referenceNumber={request.requestNumber}
        inquiryId={request.id}
        quantity={request.quantity}
        onQuoteSent={fetchRequest}
      />
    </div>
  )
}
