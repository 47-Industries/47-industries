'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

// ============ TYPES ============
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
  attachments?: any
  status: string
  assignedTo?: string
  estimatedCost?: number
  proposalUrl?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
}

// ============ 3D PRINT REQUESTS TAB ============
function PrintRequestsTab() {
  const [requests, setRequests] = useState<CustomRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/custom-requests?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests)
      }
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRequests()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      REVIEWING: '#3b82f6',
      QUOTED: '#8b5cf6',
      APPROVED: '#10b981',
      IN_PRODUCTION: '#f59e0b',
      COMPLETED: '#10b981',
      CANCELLED: '#ef4444',
    }
    return colors[status] || '#6b7280'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const statuses = [
    { value: 'all', label: 'All Requests' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'REVIEWING', label: 'Reviewing' },
    { value: 'QUOTED', label: 'Quoted' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'IN_PRODUCTION', label: 'In Production' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ]

  return (
    <div>
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
            placeholder="Search by request #, name, email, or material..."
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
      </div>

      {/* Requests List */}
      {loading ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <svg className="w-12 h-12 mx-auto mb-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px',
          }}>No requests yet</h3>
          <p style={{ color: '#71717a', margin: 0 }}>
            Custom 3D printing requests will appear here
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map((request) => (
            <div
              key={request.id}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '18px' }}>{request.requestNumber}</span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: `${getStatusColor(request.status)}20`,
                      color: getStatusColor(request.status),
                    }}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ color: '#a1a1aa', margin: 0, fontSize: '14px' }}>
                    Submitted {formatDate(request.createdAt)}
                  </p>
                </div>
                <Link
                  href={`/admin/custom-requests/${request.id}`}
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
                {/* Customer */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Customer
                  </p>
                  <p style={{ margin: '0 0 2px 0', fontWeight: 500 }}>{request.name}</p>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>{request.email}</p>
                </div>

                {/* Material & Specs */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Specifications
                  </p>
                  <p style={{ margin: '0 0 2px 0' }}>{request.material}</p>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                    {request.finish} • {request.color}
                  </p>
                </div>

                {/* Quantity & File */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Quantity & File
                  </p>
                  <p style={{ margin: '0 0 2px 0' }}>Qty: {request.quantity}</p>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                    {request.fileName} ({formatFileSize(request.fileSize)})
                  </p>
                </div>

                {/* Quote */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Quote
                  </p>
                  {request.estimatedPrice ? (
                    <>
                      <p style={{ margin: '0 0 2px 0', fontWeight: 600, color: '#10b981' }}>
                        ${Number(request.estimatedPrice).toFixed(2)}
                      </p>
                      <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                        {request.estimatedDays} days
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: 0, color: '#71717a', fontStyle: 'italic' }}>Not quoted</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ SERVICE INQUIRIES TAB ============
function ServiceInquiriesTab() {
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const { showToast } = useToast()

  // Quote modal state
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [quoteInquiry, setQuoteInquiry] = useState<ServiceInquiry | null>(null)
  const [quoteAmount, setQuoteAmount] = useState('')
  const [quoteMonthly, setQuoteMonthly] = useState('')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [quoteValidDays, setQuoteValidDays] = useState('14')
  const [sendingQuote, setSendingQuote] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter, typeFilter])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (typeFilter !== 'all') params.append('serviceType', typeFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/inquiries?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInquiries(data.inquiries)
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInquiries()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: '#3b82f6',
      CONTACTED: '#8b5cf6',
      PROPOSAL_SENT: '#f59e0b',
      NEGOTIATING: '#f59e0b',
      ACCEPTED: '#10b981',
      DECLINED: '#ef4444',
      COMPLETED: '#10b981',
    }
    return colors[status] || '#6b7280'
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const handleQuickAction = async (inquiryId: string, action: 'reject' | 'delete') => {
    if (action === 'delete') {
      if (!confirm('Are you sure you want to delete this inquiry? This cannot be undone.')) {
        return
      }
      try {
        setDeleting(inquiryId)
        const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          setInquiries(inquiries.filter(i => i.id !== inquiryId))
        } else {
          showToast('Failed to delete inquiry', 'error')
        }
      } catch (error) {
        console.error('Error deleting inquiry:', error)
        showToast('Failed to delete inquiry', 'error')
      } finally {
        setDeleting(null)
        setActionMenuOpen(null)
      }
    } else if (action === 'reject') {
      if (!confirm('Mark this inquiry as declined?')) {
        return
      }
      try {
        const res = await fetch(`/api/admin/inquiries/${inquiryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'DECLINED' }),
        })
        if (res.ok) {
          setInquiries(inquiries.map(i =>
            i.id === inquiryId ? { ...i, status: 'DECLINED' } : i
          ))
        } else {
          showToast('Failed to update inquiry', 'error')
        }
      } catch (error) {
        console.error('Error updating inquiry:', error)
        showToast('Failed to update inquiry', 'error')
      } finally {
        setActionMenuOpen(null)
      }
    }
  }

  const openQuoteModal = (inquiry: ServiceInquiry) => {
    setQuoteInquiry(inquiry)
    setQuoteAmount('')
    setQuoteMonthly('')
    setQuoteNotes('')
    setQuoteValidDays('14')
    setShowQuoteModal(true)
    setActionMenuOpen(null)
  }

  const handleSendQuote = async () => {
    if (!quoteInquiry) return
    if (!quoteAmount && !quoteMonthly) {
      showToast('Please enter at least one quote amount', 'warning')
      return
    }

    try {
      setSendingQuote(true)
      const res = await fetch('/api/admin/inquiries/send-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId: quoteInquiry.id,
          to: quoteInquiry.email,
          name: quoteInquiry.name,
          inquiryNumber: quoteInquiry.inquiryNumber,
          oneTimeAmount: quoteAmount ? parseFloat(quoteAmount) : null,
          monthlyAmount: quoteMonthly ? parseFloat(quoteMonthly) : null,
          notes: quoteNotes,
          validDays: parseInt(quoteValidDays),
        }),
      })

      if (res.ok) {
        showToast('Quote sent successfully!', 'success')
        setShowQuoteModal(false)
        // Update inquiry status in the list
        setInquiries(inquiries.map(i =>
          i.id === quoteInquiry.id ? { ...i, status: 'QUOTED' } : i
        ))
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to send quote', 'error')
      }
    } catch (error) {
      console.error('Error sending quote:', error)
      showToast('Failed to send quote', 'error')
    } finally {
      setSendingQuote(false)
    }
  }

  const statuses = [
    { value: 'all', label: 'All Status' },
    { value: 'NEW', label: 'New' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'PROPOSAL_SENT', label: 'Proposal Sent' },
    { value: 'NEGOTIATING', label: 'Negotiating' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'DECLINED', label: 'Declined' },
    { value: 'COMPLETED', label: 'Completed' },
  ]

  const serviceTypes = [
    { value: 'all', label: 'All Services' },
    { value: 'WEB_DEVELOPMENT', label: 'Web Development' },
    { value: 'APP_DEVELOPMENT', label: 'App Development' },
    { value: 'AI_SOLUTIONS', label: 'AI Solutions' },
    { value: 'CONSULTATION', label: 'Consultation' },
    { value: 'OTHER', label: 'Other' },
  ]

  return (
    <div>
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
            placeholder="Search by inquiry #, name, email, or company..."
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
          {serviceTypes.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
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
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <svg className="w-12 h-12 mx-auto mb-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px',
          }}>No inquiries yet</h3>
          <p style={{ color: '#71717a', margin: 0 }}>
            Service inquiries from the contact form will appear here
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
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
                    <span style={{ fontWeight: 600, fontSize: '18px' }}>{inquiry.inquiryNumber}</span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: `${getServiceTypeColor(inquiry.serviceType)}20`,
                      color: getServiceTypeColor(inquiry.serviceType),
                    }}>
                      {getServiceTypeLabel(inquiry.serviceType)}
                    </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: `${getStatusColor(inquiry.status)}20`,
                      color: getStatusColor(inquiry.status),
                    }}>
                      {inquiry.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ color: '#a1a1aa', margin: 0, fontSize: '14px' }}>
                    Submitted {formatDate(inquiry.createdAt)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Link
                    href={`/admin/inquiries/${inquiry.id}`}
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

                  {/* Quick Actions Menu */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setActionMenuOpen(actionMenuOpen === inquiry.id ? null : inquiry.id)}
                      style={{
                        padding: '8px 12px',
                        background: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#a1a1aa',
                        cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      ...
                    </button>
                    {actionMenuOpen === inquiry.id && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        marginTop: '4px',
                        background: '#18181b',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        minWidth: '150px',
                        zIndex: 10,
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      }}>
                        {/* Send Quote */}
                        <button
                          onClick={() => openQuoteModal(inquiry)}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            background: 'transparent',
                            border: 'none',
                            color: '#10b981',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#27272a'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Send Quote
                        </button>
                        {inquiry.status !== 'DECLINED' && (
                          <button
                            onClick={() => handleQuickAction(inquiry.id, 'reject')}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              background: 'transparent',
                              border: 'none',
                              color: '#f59e0b',
                              cursor: 'pointer',
                              fontSize: '14px',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#27272a'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleQuickAction(inquiry.id, 'delete')}
                          disabled={deleting === inquiry.id}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: deleting === inquiry.id ? 'wait' : 'pointer',
                            fontSize: '14px',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: deleting === inquiry.id ? 0.5 : 1,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#27272a'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {deleting === inquiry.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                gap: '16px',
              }}>
                {/* Customer */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Customer
                  </p>
                  <p style={{ margin: '0 0 2px 0', fontWeight: 500 }}>{inquiry.name}</p>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>{inquiry.email}</p>
                  {inquiry.company && (
                    <p style={{ margin: '2px 0 0 0', color: '#71717a', fontSize: '14px' }}>{inquiry.company}</p>
                  )}
                </div>

                {/* Budget & Timeline */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Budget & Timeline
                  </p>
                  <p style={{ margin: '0 0 2px 0' }}>{inquiry.budget || 'Not specified'}</p>
                  <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                    {inquiry.timeline || 'Flexible'}
                  </p>
                </div>

                {/* Description Preview */}
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Description
                  </p>
                  <p style={{
                    margin: 0,
                    color: '#a1a1aa',
                    fontSize: '14px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {inquiry.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quote Modal */}
      {showQuoteModal && quoteInquiry && (
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
            maxWidth: '500px',
            border: '1px solid #27272a',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Send Quote</h2>
                <p style={{ margin: '4px 0 0 0', color: '#71717a', fontSize: '14px' }}>
                  {quoteInquiry.inquiryNumber}
                </p>
              </div>
              <button
                onClick={() => setShowQuoteModal(false)}
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
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ margin: '0 0 4px 0', color: '#a1a1aa', fontSize: '14px' }}>Sending to</p>
                <p style={{ margin: 0, fontWeight: 500 }}>{quoteInquiry.name}</p>
                <p style={{ margin: 0, color: '#71717a', fontSize: '14px' }}>{quoteInquiry.email}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                    One-Time Amount
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#71717a',
                    }}>$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 28px',
                        background: '#0a0a0a',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                    Monthly Amount
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#71717a',
                    }}>$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={quoteMonthly}
                      onChange={(e) => setQuoteMonthly(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 28px',
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

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Valid For (Days)
                </label>
                <select
                  value={quoteValidDays}
                  onChange={(e) => setQuoteValidDays(e.target.value)}
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
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#a1a1aa' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  placeholder="Include any details about scope, timeline, or payment terms..."
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
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
                onClick={() => setShowQuoteModal(false)}
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
                onClick={handleSendQuote}
                disabled={sendingQuote || (!quoteAmount && !quoteMonthly)}
                style={{
                  padding: '10px 20px',
                  background: sendingQuote || (!quoteAmount && !quoteMonthly) ? '#1e40af' : '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: sendingQuote || (!quoteAmount && !quoteMonthly) ? 'not-allowed' : 'pointer',
                  opacity: sendingQuote || (!quoteAmount && !quoteMonthly) ? 0.6 : 1,
                }}
              >
                {sendingQuote ? 'Sending...' : 'Send Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============ CONTACT FORMS TAB ============
function ContactFormsTab() {
  const [inquiries, setInquiries] = useState<ServiceInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchInquiries()
  }, [statusFilter])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('inquiryType', 'contact')
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/inquiries?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInquiries(data.inquiries)
      }
    } catch (error) {
      console.error('Error fetching contact forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInquiries()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: '#3b82f6',
      CONTACTED: '#8b5cf6',
      PROPOSAL_SENT: '#f59e0b',
      NEGOTIATING: '#f59e0b',
      ACCEPTED: '#10b981',
      DECLINED: '#ef4444',
      COMPLETED: '#10b981',
    }
    return colors[status] || '#6b7280'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      {/* Filters */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or reference number..."
            style={{
              flex: 1,
              padding: '10px 14px',
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            minWidth: '150px',
          }}
        >
          <option value="all">All Statuses</option>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="PROPOSAL_SENT">Proposal Sent</option>
          <option value="ACCEPTED">Accepted</option>
          <option value="DECLINED">Declined</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Contact Forms List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
          Loading contact forms...
        </div>
      ) : inquiries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#a1a1aa' }}>
          No contact forms found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {inquiries.map((inquiry) => (
            <Link
              key={inquiry.id}
              href={`/admin/inquiries/${inquiry.id}`}
              style={{
                display: 'block',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px',
                textDecoration: 'none',
                color: '#fff',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
                    {inquiry.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#71717a' }}>
                    {inquiry.inquiryNumber}
                  </p>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    background: `${getStatusColor(inquiry.status)}20`,
                    color: getStatusColor(inquiry.status),
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {inquiry.status.replace('_', ' ')}
                </span>
              </div>

              <p style={{ margin: '0 0 12px 0', color: '#a1a1aa', fontSize: '14px', lineHeight: 1.5 }}>
                {inquiry.description?.substring(0, 120)}...
              </p>

              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#71717a' }}>
                <span>{inquiry.email}</span>
                {inquiry.phone && <span>{inquiry.phone}</span>}
                <span style={{ marginLeft: 'auto' }}>{formatDate(inquiry.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

// ============ MAIN PAGE ============
export default function InquiriesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  const activeTab = (
    tabParam === 'service-inquiries' ? 'service-inquiries' :
    tabParam === 'contact-forms' ? 'contact-forms' :
    'print-requests'
  ) as 'print-requests' | 'service-inquiries' | 'contact-forms'

  const tabs = [
    { id: 'print-requests' as const, label: '3D Print Requests' },
    { id: 'service-inquiries' as const, label: 'Service Inquiries' },
    { id: 'contact-forms' as const, label: 'Contact Forms' },
  ]

  const handleTabChange = (tabId: 'print-requests' | 'service-inquiries' | 'contact-forms') => {
    router.push(`/admin/inquiries?tab=${tabId}`)
  }

  return (
    <div style={{ color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px', margin: 0 }}>
          Inquiries
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '14px', margin: '4px 0 0 0' }}>
          Manage 3D printing requests and service inquiries
        </p>
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
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#a1a1aa',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'print-requests' && <PrintRequestsTab />}
      {activeTab === 'service-inquiries' && <ServiceInquiriesTab />}
      {activeTab === 'contact-forms' && <ContactFormsTab />}
    </div>
  )
}
