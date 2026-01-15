'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Lead {
  id: string
  leadNumber: string
  businessName: string
  contactName: string
  email: string
  phone?: string
  website?: string
  description?: string
  status: string
  notes?: string
  clientId?: string
  projectId?: string
  closedBy?: string
  closedAt?: string
  createdAt: string
  updatedAt: string
  partner: {
    id: string
    name: string
    partnerNumber: string
    email: string
    firstSaleRate: number
    recurringRate: number
  }
  commissions: {
    id: string
    type: string
    amount: number
    status: string
    createdAt: string
  }[]
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchLead()
  }, [id])

  const fetchLead = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/partners/leads/${id}`)
      if (res.ok) {
        const data = await res.json()
        setLead(data.lead)
      } else if (res.status === 404) {
        showToast('Lead not found', 'error')
        router.push('/admin/partners/leads')
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      showToast('Failed to load lead', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/admin/partners/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        showToast('Status updated', 'success')
        fetchLead()
      }
    } catch (error) {
      showToast('Failed to update status', 'error')
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
      NEW: '#3b82f6',
      CONTACTED: '#8b5cf6',
      QUALIFIED: '#f59e0b',
      CONVERTED: '#10b981',
      LOST: '#ef4444',
      PENDING: '#f59e0b',
      APPROVED: '#3b82f6',
      PAID: '#10b981',
    }
    return colors[status] || '#6b7280'
  }

  if (loading) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#71717a' }}>Loading lead...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#71717a' }}>Lead not found</p>
      </div>
    )
  }

  return (
    <div style={{ color: '#fff', maxWidth: '900px' }}>
      {/* Breadcrumb */}
      <Link
        href="/admin/partners/leads"
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
        Back to Leads
      </Link>

      {/* Header */}
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
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{lead.businessName}</h1>
              <span style={{
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                background: `${getStatusColor(lead.status)}20`,
                color: getStatusColor(lead.status),
              }}>
                {lead.status}
              </span>
              {lead.clientId && (
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  background: '#10b98120',
                  color: '#10b981',
                }}>
                  Converted to Client
                </span>
              )}
            </div>

            <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>
              {lead.leadNumber} | Submitted {formatDate(lead.createdAt)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
              <>
                {lead.status !== 'QUALIFIED' && (
                  <button
                    onClick={() => handleUpdateStatus('QUALIFIED')}
                    style={{
                      padding: '8px 16px',
                      background: '#f59e0b',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    Mark Qualified
                  </button>
                )}
                <button
                  onClick={() => setShowConvertModal(true)}
                  style={{
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
                  Convert to Client
                </button>
                <button
                  onClick={() => handleUpdateStatus('LOST')}
                  style={{
                    padding: '8px 16px',
                    background: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Mark Lost
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lead Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        {/* Contact Info */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Contact Information</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Contact Name</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '14px' }}>{lead.contactName}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Email</p>
              <a href={`mailto:${lead.email}`} style={{ color: '#3b82f6', fontSize: '14px' }}>{lead.email}</a>
            </div>
            {lead.phone && (
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Phone</p>
                <a href={`tel:${lead.phone}`} style={{ color: '#3b82f6', fontSize: '14px' }}>{lead.phone}</a>
              </div>
            )}
            {lead.website && (
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Website</p>
                <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontSize: '14px' }}>
                  {lead.website}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Partner Info */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Referred By</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Partner</p>
              <Link href={`/admin/partners/${lead.partner.id}`} style={{ color: '#3b82f6', fontSize: '14px', textDecoration: 'none' }}>
                {lead.partner.name}
              </Link>
              <span style={{ color: '#71717a', fontSize: '13px', marginLeft: '8px' }}>{lead.partner.partnerNumber}</span>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>Commission Rates</p>
              <p style={{ margin: '2px 0 0 0', fontSize: '14px' }}>
                <span style={{ color: '#3b82f6' }}>{lead.partner.firstSaleRate}%</span> first sale,{' '}
                <span style={{ color: '#8b5cf6' }}>{lead.partner.recurringRate}%</span> recurring
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {lead.description && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>Description</h2>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {lead.description}
          </p>
        </div>
      )}

      {/* Notes */}
      {lead.notes && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>Notes</h2>
          <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {lead.notes}
          </p>
        </div>
      )}

      {/* Commissions */}
      {lead.commissions.length > 0 && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Commissions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {lead.commissions.map((commission) => (
              <div
                key={commission.id}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    padding: '2px 8px',
                    background: `${getStatusColor(commission.type === 'FIRST_SALE' ? '#3b82f6' : '#8b5cf6')}20`,
                    color: commission.type === 'FIRST_SALE' ? '#3b82f6' : '#8b5cf6',
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
                  <span style={{ color: '#71717a', fontSize: '13px' }}>{formatDate(commission.createdAt)}</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '16px', color: '#10b981' }}>
                  {formatCurrency(Number(commission.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && (
        <ConvertLeadModal
          lead={lead}
          onClose={() => setShowConvertModal(false)}
          onSuccess={() => {
            setShowConvertModal(false)
            showToast('Lead converted to client!', 'success')
            fetchLead()
          }}
        />
      )}
    </div>
  )
}

// Convert Lead Modal
function ConvertLeadModal({
  lead,
  onClose,
  onSuccess,
}: {
  lead: Lead
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    clientType: 'ACTIVE',
    projectName: '',
    projectType: 'WEB_DEVELOPMENT',
    contractValue: '',
    createCommission: true,
  })
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.contractValue) {
      showToast('Contract value is required', 'warning')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/partners/leads/${lead.id}`, {
        method: 'POST', // POST for conversion
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientType: formData.clientType,
          projectName: formData.projectName || `${lead.businessName} Project`,
          projectType: formData.projectType,
          contractValue: formData.contractValue,
          createCommission: formData.createCommission,
        }),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to convert lead', 'error')
      }
    } catch (error) {
      showToast('Failed to convert lead', 'error')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const commissionAmount = formData.contractValue
    ? Number(formData.contractValue) * (lead.partner.firstSaleRate / 100)
    : 0

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
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>Convert Lead to Client</h3>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Client Type */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Client Type
              </label>
              <select
                value={formData.clientType}
                onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
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
                <option value="PROSPECT">Prospect</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>

            {/* Project Name */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Project Name
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder={`${lead.businessName} Project`}
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

            {/* Project Type */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Project Type
              </label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
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
                <option value="WEB_DEVELOPMENT">Web Development</option>
                <option value="APP_DEVELOPMENT">App Development</option>
                <option value="CONSULTING">Consulting</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Contract Value */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '6px' }}>
                Contract Value *
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}>$</span>
                <input
                  type="number"
                  value={formData.contractValue}
                  onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                  placeholder="5000"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 26px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            {/* Commission Preview */}
            {formData.contractValue && (
              <div style={{
                background: '#10b98120',
                border: '1px solid #10b98140',
                borderRadius: '8px',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    id="createCommission"
                    checked={formData.createCommission}
                    onChange={(e) => setFormData({ ...formData, createCommission: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <label htmlFor="createCommission" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Create Commission
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa' }}>
                  Partner: {lead.partner.name} ({lead.partner.firstSaleRate}% first sale rate)
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                  Commission: {formatCurrency(commissionAmount)}
                </p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
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
              disabled={saving || !formData.contractValue}
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
                opacity: saving || !formData.contractValue ? 0.6 : 1,
              }}
            >
              {saving ? 'Converting...' : 'Convert to Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
