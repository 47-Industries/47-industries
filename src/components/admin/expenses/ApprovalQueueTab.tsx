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

interface BankTransaction {
  id: string
  stripeTransactionId: string
  amount: number
  description: string | null
  merchantName: string | null
  transactedAt: string
  status: string
  financialAccount: {
    institutionName: string
    accountLast4: string | null
  }
}

// Unified item for display
interface ApprovalItem {
  id: string
  type: 'email' | 'bank'
  vendor: string
  description: string
  amount: number | null
  date: string
  source: string
  confidence?: number
  status: string
  original: ProposedBill | BankTransaction
}

interface ApprovalQueueTabProps {
  onCountChange: (count: number) => void
}

export default function ApprovalQueueTab({ onCountChange }: ApprovalQueueTabProps) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<ApprovalItem[]>([])
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'email' | 'bank'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchItems()
  }, [statusFilter])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/proposed-bills?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()

        // Transform email bills
        const emailItems: ApprovalItem[] = (data.proposedBills || []).map((bill: ProposedBill) => ({
          id: `email-${bill.id}`,
          type: 'email' as const,
          vendor: bill.vendor || 'Unknown Vendor',
          description: bill.emailSubject || bill.emailFrom,
          amount: bill.amount,
          date: bill.emailDate || bill.createdAt,
          source: bill.source,
          confidence: bill.confidence,
          status: bill.status,
          original: bill
        }))

        // Transform bank transactions
        const bankItems: ApprovalItem[] = (data.bankTransactions || []).map((txn: BankTransaction) => ({
          id: `bank-${txn.id}`,
          type: 'bank' as const,
          vendor: txn.merchantName || txn.description || 'Bank Transaction',
          description: txn.description || '',
          amount: Math.abs(txn.amount),
          date: txn.transactedAt,
          source: `${txn.financialAccount.institutionName}${txn.financialAccount.accountLast4 ? ` ****${txn.financialAccount.accountLast4}` : ''}`,
          status: 'PENDING',
          original: txn
        }))

        // Combine and sort by date
        const allItems = [...emailItems, ...bankItems].sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )

        setItems(allItems)
        onCountChange(data.pendingCount || 0)
      }
    } catch (err) {
      setError('Failed to fetch items')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (item: ApprovalItem, enableAutoApprove: boolean = false) => {
    setProcessing(item.id)
    setError('')
    setSuccess('')

    try {
      let res: Response

      if (item.type === 'email') {
        const billId = item.id.replace('email-', '')
        res = await fetch(`/api/admin/proposed-bills/${billId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enableAutoApprove })
        })
      } else {
        const txnId = item.id.replace('bank-', '')
        res = await fetch(`/api/admin/financial-connections/transactions/${txnId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        })
      }

      if (res.ok) {
        setSuccess('Expense approved')
        fetchItems()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to approve')
      }
    } catch (err) {
      setError('Failed to approve')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (item: ApprovalItem, reason?: string) => {
    if (item.type === 'bank') {
      // For bank transactions, we just ignore/skip them - no reject action needed
      setError('Bank transactions can only be approved or skipped')
      return
    }

    setProcessing(item.id)
    try {
      const billId = item.id.replace('email-', '')
      const res = await fetch(`/api/admin/proposed-bills/${billId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (res.ok) {
        fetchItems()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to reject')
      }
    } catch (err) {
      setError('Failed to reject')
    } finally {
      setProcessing(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return
    setProcessing('bulk')
    setError('')

    let approved = 0
    let failed = 0

    for (const id of selectedIds) {
      const item = items.find(i => i.id === id)
      if (!item) continue

      try {
        let res: Response
        if (item.type === 'email') {
          const billId = id.replace('email-', '')
          res = await fetch(`/api/admin/proposed-bills/${billId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
        } else {
          const txnId = id.replace('bank-', '')
          res = await fetch(`/api/admin/financial-connections/transactions/${txnId}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          })
        }

        if (res.ok) approved++
        else failed++
      } catch {
        failed++
      }
    }

    setSelectedIds(new Set())
    setSuccess(`Approved ${approved} items${failed > 0 ? `, ${failed} failed` : ''}`)
    fetchItems()
    setProcessing(null)
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
    const filtered = filteredItems
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)))
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

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return '#71717a'
    if (confidence >= 80) return '#10b981'
    if (confidence >= 50) return '#f59e0b'
    return '#ef4444'
  }

  // Filter items by source
  const filteredItems = items.filter(item => {
    if (sourceFilter === 'all') return true
    return item.type === sourceFilter
  })

  const pendingItems = filteredItems.filter(i => i.status === 'PENDING')

  return (
    <div>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>x</button>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>x</button>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Source Filter */}
          <div style={{ display: 'flex', gap: '4px', background: '#18181b', borderRadius: '6px', padding: '4px' }}>
            {(['all', 'email', 'bank'] as const).map(source => (
              <button
                key={source}
                onClick={() => setSourceFilter(source)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: sourceFilter === source ? '#3b82f6' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {source === 'all' ? 'All Sources' : source === 'email' ? 'Email Bills' : 'Bank Transactions'}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', gap: '4px', background: '#18181b', borderRadius: '6px', padding: '4px' }}>
            {(['PENDING', 'APPROVED', 'ALL'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  background: statusFilter === status ? '#3b82f6' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {statusFilter === 'PENDING' && selectedIds.size > 0 && (
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
            Approve {selectedIds.size} Selected
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>Loading...</div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>
          No {statusFilter.toLowerCase()} items to review
        </div>
      ) : (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px 100px 160px', gap: '12px', padding: '12px 16px', background: '#0a0a0a', fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>
            {statusFilter === 'PENDING' && (
              <div>
                <input
                  type="checkbox"
                  checked={selectedIds.size === pendingItems.length && pendingItems.length > 0}
                  onChange={selectAll}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            )}
            {statusFilter !== 'PENDING' && <div></div>}
            <div>Vendor / Description</div>
            <div>Amount</div>
            <div>Date</div>
            <div>Source</div>
            <div>Actions</div>
          </div>

          {/* Rows */}
          {filteredItems.map(item => (
            <div key={item.id}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 100px 100px 100px 160px',
                  gap: '12px',
                  padding: '14px 16px',
                  borderTop: '1px solid #27272a',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              >
                {statusFilter === 'PENDING' && item.status === 'PENDING' && (
                  <div onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                )}
                {(statusFilter !== 'PENDING' || item.status !== 'PENDING') && <div></div>}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      background: item.type === 'email' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                      color: item.type === 'email' ? '#ef4444' : '#3b82f6',
                      fontSize: '10px',
                      fontWeight: 600
                    }}>
                      {item.type === 'email' ? 'EMAIL' : 'BANK'}
                    </span>
                    <span style={{ fontWeight: 500 }}>{item.vendor}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#71717a', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description}
                  </div>
                </div>

                <div style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</div>

                <div style={{ fontSize: '13px', color: '#a1a1aa' }}>{formatDate(item.date)}</div>

                <div style={{ fontSize: '12px', color: '#71717a' }}>{item.source}</div>

                <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                  {item.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleApprove(item, false)}
                        disabled={processing === item.id}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '4px',
                          border: 'none',
                          background: '#10b981',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                          opacity: processing === item.id ? 0.5 : 1
                        }}
                      >
                        Approve
                      </button>
                      {item.type === 'email' && (
                        <button
                          onClick={() => handleReject(item)}
                          disabled={processing === item.id}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid #ef4444',
                            background: 'transparent',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px',
                            opacity: processing === item.id ? 0.5 : 1
                          }}
                        >
                          Reject
                        </button>
                      )}
                    </>
                  ) : (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: item.status === 'APPROVED' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: item.status === 'APPROVED' ? '#10b981' : '#ef4444',
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      {item.status}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === item.id && (
                <div style={{ padding: '16px', background: '#0a0a0a', borderTop: '1px solid #27272a' }}>
                  {item.type === 'email' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>From</div>
                        <div style={{ fontSize: '13px' }}>{(item.original as ProposedBill).emailFrom}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Confidence</div>
                        <div style={{ fontSize: '13px', color: getConfidenceColor(item.confidence) }}>
                          {item.confidence}%
                        </div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Subject</div>
                        <div style={{ fontSize: '13px' }}>{(item.original as ProposedBill).emailSubject || '-'}</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Bank Account</div>
                        <div style={{ fontSize: '13px' }}>{item.source}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Transaction ID</div>
                        <div style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                          {(item.original as BankTransaction).stripeTransactionId.slice(0, 20)}...
                        </div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Description</div>
                        <div style={{ fontSize: '13px' }}>{(item.original as BankTransaction).description || '-'}</div>
                      </div>
                    </div>
                  )}

                  {/* Auto-Approve Option for Email Bills */}
                  {item.status === 'PENDING' && item.type === 'email' && (
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
                          onClick={() => handleApprove(item, true)}
                          disabled={processing === item.id}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#3b82f6',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 500,
                            opacity: processing === item.id ? 0.5 : 1
                          }}
                        >
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
