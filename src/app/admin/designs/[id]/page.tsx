'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faPaintBrush,
  faCheck,
  faClock,
  faSpinner,
  faArchive,
  faSave,
  faUpload,
  faFileCode,
  faImage,
  faHistory,
} from '@fortawesome/free-solid-svg-icons'

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
    id: string
    name: string
    slug: string
    images: string[]
  }
  variant?: {
    id: string
    name: string
    sku: string | null
    options: any
  }
  order?: {
    id: string
    orderNumber: string
    status: string
    customerName: string
  }
}

interface RelatedOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  items: {
    quantity: number
    price: number
    total: number
  }[]
}

export default function AdminDesignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [design, setDesign] = useState<CustomerDesign | null>(null)
  const [relatedOrders, setRelatedOrders] = useState<RelatedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Form state
  const [status, setStatus] = useState<string>('')
  const [designNotes, setDesignNotes] = useState('')
  const [gcodePath, setGcodePath] = useState('')
  const [designFile, setDesignFile] = useState('')
  const [previewImage, setPreviewImage] = useState('')

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchDesign()
  }, [resolvedParams.id])

  const fetchDesign = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/designs/${resolvedParams.id}`)
      if (res.ok) {
        const data = await res.json()
        setDesign(data.design)
        setRelatedOrders(data.relatedOrders)
        // Initialize form state
        setStatus(data.design.status)
        setDesignNotes(data.design.designNotes || '')
        setGcodePath(data.design.gcodePath || '')
        setDesignFile(data.design.designFile || '')
        setPreviewImage(data.design.previewImage || '')
      }
    } catch (error) {
      console.error('Error fetching design:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/designs/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          designNotes,
          gcodePath,
          designFile,
          previewImage,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setDesign(data.design)
        alert('Design updated successfully')
      } else {
        alert('Failed to update design')
      }
    } catch (error) {
      console.error('Error saving design:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this design?')) return

    try {
      const res = await fetch(`/api/admin/designs/${resolvedParams.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/admin/designs')
      } else {
        alert('Failed to archive design')
      }
    } catch (error) {
      console.error('Error archiving design:', error)
    }
  }

  const getStatusColor = (s: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      IN_PROGRESS: '#3b82f6',
      COMPLETED: '#10b981',
      ARCHIVED: '#6b7280',
    }
    return colors[s] || '#6b7280'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: '#71717a' }}>Loading design...</p>
      </div>
    )
  }

  if (!design) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: '#71717a' }}>Design not found</p>
        <Link href="/admin/designs" style={{ color: '#3b82f6' }}>Back to Designs</Link>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <Link
          href="/admin/designs"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#a1a1aa',
            textDecoration: 'none',
            marginBottom: '16px',
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Designs
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 700, margin: 0 }}>
                {design.designName}
              </h1>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 500,
                background: `${getStatusColor(design.status)}20`,
                color: getStatusColor(design.status),
              }}>
                {design.status.replace('_', ' ')}
              </span>
            </div>
            <p style={{ color: '#a1a1aa', margin: 0 }}>
              Created {formatDate(design.createdAt)}
              {design.completedAt && ` - Completed ${formatDate(design.completedAt)}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
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
              <FontAwesomeIcon icon={faSave} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleArchive}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'transparent',
                color: '#ef4444',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FontAwesomeIcon icon={faArchive} />
              Archive
            </button>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
        gap: '24px',
      }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Status & Files */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', margin: '0 0 20px 0' }}>
              Design Status & Files
            </h2>

            {/* Status Selector */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {/* G-code Path */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faFileCode} style={{ marginRight: '8px' }} />
                G-code File Path
              </label>
              <input
                type="text"
                value={gcodePath}
                onChange={(e) => setGcodePath(e.target.value)}
                placeholder="/path/to/file.gcode or R2 URL"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Design File */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faUpload} style={{ marginRight: '8px' }} />
                Design File Path (STL, SVG, etc.)
              </label>
              <input
                type="text"
                value={designFile}
                onChange={(e) => setDesignFile(e.target.value)}
                placeholder="/path/to/design.stl or R2 URL"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Preview Image */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faImage} style={{ marginRight: '8px' }} />
                Preview Image URL
              </label>
              <input
                type="text"
                value={previewImage}
                onChange={(e) => setPreviewImage(e.target.value)}
                placeholder="https://... preview image URL"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Design Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                Design Notes
              </label>
              <textarea
                value={designNotes}
                onChange={(e) => setDesignNotes(e.target.value)}
                placeholder="Notes about the design, slicing settings, issues, etc."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#09090b',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Customization Data */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px', margin: '0 0 20px 0' }}>
              Customization Data
            </h2>
            <pre style={{
              background: '#09090b',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '13px',
              color: '#a1a1aa',
            }}>
              {JSON.stringify(design.customization, null, 2)}
            </pre>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Customer Info */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Customer
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Email</p>
                <p style={{ margin: 0 }}>{design.customerEmail}</p>
              </div>
              {design.source && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Source</p>
                  <p style={{ margin: 0, textTransform: 'capitalize' }}>{design.source}</p>
                </div>
              )}
              {design.sourceCustomerId && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Customer ID</p>
                  <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px' }}>{design.sourceCustomerId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0' }}>
              Product
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Product</p>
                <p style={{ margin: 0 }}>{design.product?.name || 'Unknown'}</p>
              </div>
              {design.variant && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Variant</p>
                  <p style={{ margin: 0 }}>{design.variant.name}</p>
                  {design.variant.sku && (
                    <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>SKU: {design.variant.sku}</p>
                  )}
                </div>
              )}
              {design.order && (
                <div>
                  <p style={{ fontSize: '12px', color: '#71717a', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Original Order</p>
                  <Link
                    href={`/admin/orders/${design.order.id}`}
                    style={{ color: '#3b82f6', textDecoration: 'none' }}
                  >
                    {design.order.orderNumber}
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Order History */}
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FontAwesomeIcon icon={faHistory} />
              Order History
            </h3>
            {relatedOrders.length === 0 ? (
              <p style={{ color: '#71717a', margin: 0, fontSize: '14px' }}>No orders yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {relatedOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    style={{
                      display: 'block',
                      padding: '12px',
                      background: '#09090b',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      color: 'inherit',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500 }}>{order.orderNumber}</span>
                      <span style={{ color: '#10b981', fontWeight: 500 }}>
                        ${Number(order.total).toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>
                      {formatDate(order.createdAt)} - {order.status}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
