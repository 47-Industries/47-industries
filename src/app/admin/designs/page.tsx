'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaintBrush, faCheck, faClock, faSpinner, faArchive } from '@fortawesome/free-solid-svg-icons'

interface CustomerDesign {
  id: string
  customerEmail: string
  source: string | null
  sourceCustomerId: string | null
  productId: string
  variantId: string | null
  designName: string
  designNotes: string | null
  gcodePath: string | null
  designFile: string | null
  previewImage: string | null
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'
  customization: any
  originalOrderId: string | null
  createdAt: string
  updatedAt: string
  completedAt: string | null
  product?: {
    name: string
    slug: string
  }
  variant?: {
    name: string
    sku: string | null
  }
  order?: {
    orderNumber: string
  }
}

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<CustomerDesign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchDesigns()
  }, [statusFilter, sourceFilter])

  const fetchDesigns = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (sourceFilter !== 'all') params.append('source', sourceFilter)
      if (searchQuery) params.append('search', searchQuery)

      const res = await fetch(`/api/admin/designs?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDesigns(data.designs)
      }
    } catch (error) {
      console.error('Error fetching designs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDesigns()
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      IN_PROGRESS: '#3b82f6',
      COMPLETED: '#10b981',
      ARCHIVED: '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return faClock
      case 'IN_PROGRESS':
        return faSpinner
      case 'COMPLETED':
        return faCheck
      case 'ARCHIVED':
        return faArchive
      default:
        return faClock
    }
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
    { value: 'all', label: 'All Designs' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'ARCHIVED', label: 'Archived' },
  ]

  const sources = [
    { value: 'all', label: 'All Sources' },
    { value: 'bookfade', label: 'BookFade' },
    { value: '47industries', label: 'Direct' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: isMobile ? '28px' : '36px',
          fontWeight: 700,
          marginBottom: '8px',
          margin: 0
        }}>Customer Designs</h1>
        <p style={{
          color: '#a1a1aa',
          margin: 0,
          fontSize: isMobile ? '14px' : '16px'
        }}>Manage custom design files for reorders and production</p>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {statuses.slice(1).map((s) => {
          const count = designs.filter(d => d.status === s.value).length
          return (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              style={{
                background: statusFilter === s.value ? `${getStatusColor(s.value)}20` : '#18181b',
                border: statusFilter === s.value ? `2px solid ${getStatusColor(s.value)}` : '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={getStatusIcon(s.value)} style={{ color: getStatusColor(s.value) }} />
                <span style={{ color: getStatusColor(s.value), fontWeight: 500 }}>{s.label}</span>
              </div>
              <p style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{count}</p>
            </button>
          )
        })}
      </div>

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
            placeholder="Search by email, design name, or customer ID..."
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

      {/* Designs List */}
      {loading ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#71717a', margin: 0 }}>Loading designs...</p>
        </div>
      ) : designs.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: '#71717a' }}>
            <FontAwesomeIcon icon={faPaintBrush} />
          </div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '8px',
          }}>No designs yet</h3>
          <p style={{ color: '#71717a', margin: 0 }}>
            Customer design files will appear here when custom orders are placed
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {designs.map((design) => (
            <div
              key={design.id}
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
                    <span style={{ fontWeight: 600, fontSize: '18px' }}>{design.designName}</span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: `${getStatusColor(design.status)}20`,
                      color: getStatusColor(design.status),
                    }}>
                      <FontAwesomeIcon icon={getStatusIcon(design.status)} />
                      {design.status.replace('_', ' ')}
                    </span>
                    {design.source && (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: '#3b82f620',
                        color: '#3b82f6',
                        textTransform: 'capitalize',
                      }}>
                        {design.source}
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#a1a1aa', margin: 0, fontSize: '14px' }}>
                    Created {formatDate(design.createdAt)}
                    {design.completedAt && ` - Completed ${formatDate(design.completedAt)}`}
                  </p>
                </div>
                <Link
                  href={`/admin/designs/${design.id}`}
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
                  Manage Design
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
                  <p style={{ margin: '0 0 2px 0' }}>{design.customerEmail}</p>
                  {design.sourceCustomerId && (
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                      ID: {design.sourceCustomerId}
                    </p>
                  )}
                </div>

                {/* Product */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Product
                  </p>
                  <p style={{ margin: '0 0 2px 0' }}>{design.product?.name || 'Unknown'}</p>
                  {design.variant && (
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                      {design.variant.name}
                    </p>
                  )}
                </div>

                {/* Customization Preview */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Customization
                  </p>
                  {design.customization?.businessName ? (
                    <p style={{ margin: '0 0 2px 0' }}>{design.customization.businessName}</p>
                  ) : design.customization?.logoType ? (
                    <p style={{ margin: '0 0 2px 0' }}>{design.customization.logoType}</p>
                  ) : (
                    <p style={{ margin: 0, color: '#71717a', fontStyle: 'italic' }}>No customization data</p>
                  )}
                  {design.customization?.color && (
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px' }}>
                      Color: {design.customization.color}
                    </p>
                  )}
                </div>

                {/* Files */}
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>
                    Files
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {design.gcodePath ? (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        background: '#10b98120',
                        color: '#10b981',
                      }}>
                        G-code Ready
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        background: '#f59e0b20',
                        color: '#f59e0b',
                      }}>
                        Needs Slicing
                      </span>
                    )}
                    {design.designFile && (
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        background: '#3b82f620',
                        color: '#3b82f6',
                      }}>
                        STL Uploaded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
