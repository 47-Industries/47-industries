'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🖨️</div>
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
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
    </div>
  )
}

// ============ MAIN PAGE ============
export default function InquiriesPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  const activeTab = (tabParam === 'service-inquiries' ? 'service-inquiries' : 'print-requests') as 'print-requests' | 'service-inquiries'

  const tabs = [
    { id: 'print-requests' as const, label: '3D Print Requests' },
    { id: 'service-inquiries' as const, label: 'Service Inquiries' },
  ]

  const handleTabChange = (tabId: 'print-requests' | 'service-inquiries') => {
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
    </div>
  )
}
