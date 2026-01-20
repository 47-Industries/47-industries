'use client'

import { useState, useEffect } from 'react'

interface ProposedBill {
  id: string
  source: string
  emailSubject: string | null
  emailFrom: string
  emailDate: string | null
  vendor: string | null
  vendorType: string | null
  amount: number | null
  dueDate: string | null
  isPaid: boolean
  confidence: number
  status: string
  matchedRecurringBillId: string | null
  createdAt: string
}

interface ApprovalQueueTabProps {
  onCountChange: (count: number) => void
}

export default function ApprovalQueueTab({ onCountChange }: ApprovalQueueTabProps) {
  const [loading, setLoading] = useState(true)
  const [proposedBills, setProposedBills] = useState<ProposedBill[]>([])
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProposedBills()
  }, [statusFilter])

  const fetchProposedBills = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/proposed-bills?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setProposedBills(data.proposedBills || [])
        onCountChange(data.pendingCount || 0)
      }
    } catch (err) {
      setError('Failed to fetch proposed bills')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string, enableAutoApprove: boolean = false) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/proposed-bills/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableAutoApprove })
      })
      if (res.ok) {
        fetchProposedBills()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to approve')
      }
    } catch (err) {
      setError('Failed to approve bill')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (id: string, reason?: string) => {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/proposed-bills/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (res.ok) {
        fetchProposedBills()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to reject')
      }
    } catch (err) {
      setError('Failed to reject bill')
    } finally {
      setProcessing(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return
    setProcessing('bulk')
    try {
      const res = await fetch('/api/admin/proposed-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-approve', ids: Array.from(selectedIds) })
      })
      if (res.ok) {
        setSelectedIds(new Set())
        fetchProposedBills()
      }
    } catch (err) {
      setError('Failed to approve bills')
    } finally {
      setProcessing(null)
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) return
    setProcessing('bulk')
    try {
      const res = await fetch('/api/admin/proposed-bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-reject', ids: Array.from(selectedIds), reason: 'Bulk rejected' })
      })
      if (res.ok) {
        setSelectedIds(new Set())
        fetchProposedBills()
      }
    } catch (err) {
      setError('Failed to reject bills')
    } finally {
      setProcessing(null)
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (selectedIds.size === proposedBills.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(proposedBills.map(b => b.id)))
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#10b981'
    if (confidence >= 50) return '#f59e0b'
    return '#ef4444'
  }

  return (
    <div>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>x</button>
        </div>
      )}

      {/* Filter and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: statusFilter === status ? 'none' : '1px solid #3f3f46',
                background: statusFilter === status ? '#3b82f6' : 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {statusFilter === 'PENDING' && selectedIds.size > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleBulkApprove}
              disabled={processing === 'bulk'}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                opacity: processing === 'bulk' ? 0.5 : 1
              }}
            >
              Approve {selectedIds.size}
            </button>
            <button
              onClick={handleBulkReject}
              disabled={processing === 'bulk'}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#ef4444',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                opacity: processing === 'bulk' ? 0.5 : 1
              }}
            >
              Reject {selectedIds.size}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>Loading...</div>
      ) : proposedBills.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>
          No {statusFilter.toLowerCase()} bills to review
        </div>
      ) : (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 100px 80px 140px', gap: '12px', padding: '12px 16px', background: '#0a0a0a', fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>
            {statusFilter === 'PENDING' && (
              <div>
                <input
                  type="checkbox"
                  checked={selectedIds.size === proposedBills.length}
                  onChange={selectAll}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            )}
            {statusFilter !== 'PENDING' && <div></div>}
            <div>Email / Vendor</div>
            <div>Amount</div>
            <div>Due Date</div>
            <div>Source</div>
            <div>Confidence</div>
            <div>Actions</div>
          </div>

          {/* Rows */}
          {proposedBills.map(bill => (
            <div key={bill.id}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 120px 100px 100px 80px 140px',
                  gap: '12px',
                  padding: '14px 16px',
                  borderTop: '1px solid #27272a',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}
              >
                {statusFilter === 'PENDING' && (
                  <div onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(bill.id)}
                      onChange={() => toggleSelect(bill.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                )}
                {statusFilter !== 'PENDING' && <div></div>}

                <div>
                  <div style={{ fontWeight: 500, marginBottom: '2px' }}>{bill.vendor || 'Unknown Vendor'}</div>
                  <div style={{ fontSize: '12px', color: '#71717a', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {bill.emailSubject || bill.emailFrom}
                  </div>
                </div>

                <div style={{ fontWeight: 600 }}>{formatCurrency(bill.amount)}</div>

                <div style={{ fontSize: '13px', color: '#a1a1aa' }}>{formatDate(bill.dueDate)}</div>

                <div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: bill.source === 'GMAIL' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                    color: bill.source === 'GMAIL' ? '#ef4444' : '#3b82f6',
                    fontSize: '11px',
                    fontWeight: 500
                  }}>
                    {bill.source}
                  </span>
                </div>

                <div>
                  <span style={{
                    color: getConfidenceColor(bill.confidence),
                    fontWeight: 600,
                    fontSize: '13px'
                  }}>
                    {bill.confidence}%
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                  {bill.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleApprove(bill.id, false)}
                        disabled={processing === bill.id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          background: '#10b981',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                          opacity: processing === bill.id ? 0.5 : 1
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(bill.id)}
                        disabled={processing === bill.id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: '1px solid #ef4444',
                          background: 'transparent',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '12px',
                          opacity: processing === bill.id ? 0.5 : 1
                        }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: bill.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: bill.status === 'APPROVED' ? '#10b981' : '#ef4444',
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      {bill.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === bill.id && (
                <div style={{ padding: '16px', background: '#0a0a0a', borderTop: '1px solid #27272a' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>From</div>
                      <div style={{ fontSize: '13px' }}>{bill.emailFrom}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Email Date</div>
                      <div style={{ fontSize: '13px' }}>{formatDate(bill.emailDate)}</div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Subject</div>
                      <div style={{ fontSize: '13px' }}>{bill.emailSubject || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Vendor Type</div>
                      <div style={{ fontSize: '13px' }}>{bill.vendorType || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Is Payment</div>
                      <div style={{ fontSize: '13px' }}>{bill.isPaid ? 'Yes (Payment Confirmation)' : 'No (Bill Notification)'}</div>
                    </div>
                  </div>

                  {/* Auto-Approve Option */}
                  {bill.status === 'PENDING' && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #27272a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '2px' }}>
                            Enable Auto-Approve for Future Bills
                          </div>
                          <div style={{ fontSize: '12px', color: '#71717a' }}>
                            Future bills from this vendor will be automatically approved
                          </div>
                        </div>
                        <button
                          onClick={() => handleApprove(bill.id, true)}
                          disabled={processing === bill.id}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#3b82f6',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                            opacity: processing === bill.id ? 0.5 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Approve + Auto-Approve
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
