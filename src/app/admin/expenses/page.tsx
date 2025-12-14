'use client'

import { useState, useEffect } from 'react'

interface Founder {
  id: string
  name: string | null
  email: string
}

interface FounderPayment {
  id: string
  amount: number
  status: string
  paidDate: string | null
  user: Founder
}

interface BillInstance {
  id: string
  vendor: string
  vendorType: string
  amount: number
  dueDate: string | null
  period: string | null
  status: string
  paidDate: string | null
  paidVia: string | null
  founderPayments: FounderPayment[]
  recurringBill?: { id: string; name: string; amountType: string }
}

interface RecurringBill {
  id: string
  name: string
  vendor: string
  amountType: 'FIXED' | 'VARIABLE'
  fixedAmount: number | null
  frequency: string
  dueDay: number
  emailPatterns: string[]
  paymentMethod: string | null
  vendorType: string
  active: boolean
}

const VENDOR_TYPES = [
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'OTHER', label: 'Other' }
]

export default function ExpensesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [bills, setBills] = useState<BillInstance[]>([])
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([])
  const [founders, setFounders] = useState<Founder[]>([])
  const [currentPeriod, setCurrentPeriod] = useState(() => new Date().toISOString().slice(0, 7))

  // Modal state
  const [showAddBillModal, setShowAddBillModal] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringBill | null>(null)
  const [editingBillAmount, setEditingBillAmount] = useState<string | null>(null)
  const [tempAmount, setTempAmount] = useState('')
  const [formData, setFormData] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [currentPeriod])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [billsRes, recurringRes] = await Promise.all([
        fetch(`/api/admin/expenses-summary-v2?period=${currentPeriod}`),
        fetch('/api/admin/recurring-bills')
      ])

      if (billsRes.ok) {
        const data = await billsRes.json()
        setBills(data.bills?.all || [])
        setFounders(data.founderBalances?.map((b: any) => b.founder) || [])
      }

      if (recurringRes.ok) {
        const data = await recurringRes.json()
        setRecurringBills(data.recurringBills || [])
      }
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const [year, month] = currentPeriod.split('-').map(Number)
    const date = new Date(year, month - 1)
    date.setMonth(date.getMonth() + (direction === 'prev' ? -1 : 1))
    setCurrentPeriod(date.toISOString().slice(0, 7))
  }

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null
    return Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  const handleMarkFounderPaid = async (billId: string, founderId: string) => {
    try {
      const res = await fetch(`/api/admin/bill-instances/${billId}/founder-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: founderId, status: 'PAID' })
      })
      if (res.ok) {
        setSuccess('Payment marked as paid')
        fetchData()
      }
    } catch (err) {
      setError('Failed to update payment')
    }
  }

  const handleMarkBillPaid = async (billId: string) => {
    try {
      const res = await fetch(`/api/admin/bill-instances/${billId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', paidDate: new Date().toISOString() })
      })
      if (res.ok) {
        setSuccess('Bill marked as paid')
        fetchData()
      }
    } catch (err) {
      setError('Failed to update bill')
    }
  }

  const handleUpdateBillAmount = async (billId: string, amount: number) => {
    try {
      const res = await fetch(`/api/admin/bill-instances/${billId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
      if (res.ok) {
        setSuccess('Amount updated')
        setEditingBillAmount(null)
        fetchData()
      }
    } catch (err) {
      setError('Failed to update amount')
    }
  }

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Delete this bill?')) return
    try {
      const res = await fetch(`/api/admin/bill-instances/${billId}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Bill deleted')
        fetchData()
      }
    } catch (err) {
      setError('Failed to delete bill')
    }
  }

  const handleCreateBill = async () => {
    if (!formData.vendor || !formData.amount) {
      setError('Vendor and amount required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/bill-instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: formData.vendor,
          vendorType: formData.vendorType || 'OTHER',
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate || undefined
        })
      })
      if (res.ok) {
        setShowAddBillModal(false)
        setFormData({})
        setSuccess('Bill created')
        fetchData()
      }
    } catch (err) {
      setError('Failed to create bill')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveRecurring = async () => {
    if (!formData.name || !formData.vendor || !formData.dueDay) {
      setError('Name, vendor, and due day required')
      return
    }
    setSubmitting(true)
    try {
      const data = {
        name: formData.name,
        vendor: formData.vendor,
        amountType: formData.amountType || 'VARIABLE',
        fixedAmount: formData.amountType === 'FIXED' ? parseFloat(formData.fixedAmount) : null,
        frequency: formData.frequency || 'MONTHLY',
        dueDay: parseInt(formData.dueDay),
        emailPatterns: formData.emailPatterns ? formData.emailPatterns.split(',').map((p: string) => p.trim().toLowerCase()) : [],
        paymentMethod: formData.paymentMethod || null,
        vendorType: formData.vendorType || 'OTHER'
      }

      const url = editingRecurring ? `/api/admin/recurring-bills/${editingRecurring.id}` : '/api/admin/recurring-bills'
      const res = await fetch(url, {
        method: editingRecurring ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        setShowRecurringModal(false)
        setEditingRecurring(null)
        setFormData({})
        setSuccess(editingRecurring ? 'Updated' : 'Created')
        fetchData()
      }
    } catch (err) {
      setError('Failed to save')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm('Delete this recurring bill?')) return
    try {
      await fetch(`/api/admin/recurring-bills/${id}`, { method: 'DELETE' })
      setSuccess('Deleted')
      fetchData()
    } catch (err) {
      setError('Failed to delete')
    }
  }

  const openRecurringModal = (recurring?: RecurringBill) => {
    if (recurring) {
      setEditingRecurring(recurring)
      setFormData({
        name: recurring.name,
        vendor: recurring.vendor,
        amountType: recurring.amountType,
        fixedAmount: recurring.fixedAmount?.toString() || '',
        frequency: recurring.frequency,
        dueDay: recurring.dueDay.toString(),
        emailPatterns: (recurring.emailPatterns || []).join(', '),
        paymentMethod: recurring.paymentMethod || '',
        vendorType: recurring.vendorType
      })
    } else {
      setEditingRecurring(null)
      setFormData({ amountType: 'VARIABLE', frequency: 'MONTHLY', vendorType: 'OTHER' })
    }
    setShowRecurringModal(true)
  }

  // Calculate totals
  const totalAmount = bills.reduce((sum, b) => sum + Number(b.amount), 0)
  const paidAmount = bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + Number(b.amount), 0)
  const pendingAmount = totalAmount - paidAmount

  // Calculate founder totals
  const founderTotals = founders.map(f => {
    let pending = 0
    let paid = 0
    bills.forEach(b => {
      const payment = b.founderPayments?.find(p => p.user.id === f.id)
      if (payment) {
        if (payment.status === 'PAID') {
          paid += Number(payment.amount)
        } else {
          pending += Number(payment.amount)
        }
      }
    })
    return { founder: f, pending, paid }
  })

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>Expenses</h1>
        <p style={{ color: '#71717a', fontSize: '14px' }}>Track and manage shared bills</p>
      </div>

      {/* Messages */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>Loading...</div>
      ) : (
        <>
          {/* Period Navigator + Summary */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 16px' }}>
              <button onClick={() => navigatePeriod('prev')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>←</button>
              <span style={{ fontWeight: 600, minWidth: '140px', textAlign: 'center' }}>{formatPeriod(currentPeriod)}</span>
              <button onClick={() => navigatePeriod('next')} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>→</button>
            </div>

            <div style={{ display: 'flex', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 20px', minWidth: '120px' }}>
                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase' }}>Total</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(totalAmount)}</div>
              </div>
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 20px', minWidth: '120px' }}>
                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase' }}>Pending</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(pendingAmount)}</div>
              </div>
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 20px', minWidth: '120px' }}>
                <div style={{ fontSize: '11px', color: '#71717a', textTransform: 'uppercase' }}>Paid</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#10b981' }}>{formatCurrency(paidAmount)}</div>
              </div>
            </div>

            <button onClick={() => { setFormData({ vendorType: 'OTHER' }); setShowAddBillModal(true) }} style={{
              padding: '12px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 500
            }}>+ Add Bill</button>
          </div>

          {/* Founder Summary */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {founderTotals.map(ft => (
              <div key={ft.founder.id} style={{
                background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%', background: ft.pending > 0 ? '#f59e0b' : '#10b981',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px'
                }}>
                  {(ft.founder.name || ft.founder.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{ft.founder.name || ft.founder.email}</div>
                  <div style={{ fontSize: '12px', color: ft.pending > 0 ? '#f59e0b' : '#10b981' }}>
                    {ft.pending > 0 ? `Owes ${formatCurrency(ft.pending)}` : 'All paid'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bills List */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Bills for {formatPeriod(currentPeriod)}</h2>
              <span style={{ fontSize: '13px', color: '#71717a' }}>{bills.length} bills</span>
            </div>

            {bills.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: '#71717a' }}>
                No bills for this period. Add one or wait for email scanning.
              </div>
            ) : (
              <div>
                {bills.map(bill => {
                  const days = getDaysUntilDue(bill.dueDate)
                  const isOverdue = bill.status === 'PENDING' && days !== null && days < 0
                  const isVariable = bill.amount === 0 || (bill.recurringBill?.amountType === 'VARIABLE' && bill.amount === 0)
                  const perPerson = founders.length > 0 ? Number(bill.amount) / founders.length : Number(bill.amount)

                  return (
                    <div key={bill.id} style={{ borderBottom: '1px solid #27272a', padding: '16px 20px' }}>
                      {/* Bill Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 600 }}>{bill.vendor}</div>
                          <div style={{ fontSize: '12px', color: '#71717a' }}>
                            {VENDOR_TYPES.find(t => t.value === bill.vendorType)?.label || bill.vendorType}
                            {bill.dueDate && (
                              <span style={{ marginLeft: '8px', color: isOverdue ? '#ef4444' : '#a1a1aa' }}>
                                Due {formatDate(bill.dueDate)}
                                {days !== null && bill.status === 'PENDING' && (
                                  <span> ({days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`})</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {editingBillAmount === bill.id ? (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <input
                                type="number"
                                value={tempAmount}
                                onChange={e => setTempAmount(e.target.value)}
                                style={{ width: '100px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px' }}
                                autoFocus
                              />
                              <button onClick={() => handleUpdateBillAmount(bill.id, parseFloat(tempAmount))} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Save</button>
                              <button onClick={() => setEditingBillAmount(null)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #3f3f46', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
                            </div>
                          ) : (
                            <div
                              onClick={() => { setEditingBillAmount(bill.id); setTempAmount(bill.amount.toString()) }}
                              style={{ cursor: 'pointer' }}
                              title="Click to edit amount"
                            >
                              <div style={{ fontSize: '20px', fontWeight: 700, color: isVariable ? '#f59e0b' : '#fff' }}>
                                {isVariable ? 'Awaiting Amount' : formatCurrency(Number(bill.amount))}
                              </div>
                              <div style={{ fontSize: '12px', color: '#3b82f6' }}>
                                {!isVariable && `${formatCurrency(perPerson)} each`}
                              </div>
                            </div>
                          )}
                          <span style={{
                            padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                            background: bill.status === 'PAID' ? 'rgba(16,185,129,0.2)' : isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                            color: bill.status === 'PAID' ? '#10b981' : isOverdue ? '#ef4444' : '#f59e0b'
                          }}>
                            {bill.status === 'PAID' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      {/* Founder Payments - Always visible */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {bill.founderPayments?.map(p => (
                          <button
                            key={p.id}
                            onClick={() => p.status !== 'PAID' && handleMarkFounderPaid(bill.id, p.user.id)}
                            disabled={p.status === 'PAID'}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '6px 12px', borderRadius: '20px',
                              border: p.status === 'PAID' ? '1px solid rgba(16,185,129,0.3)' : '1px solid #3f3f46',
                              background: p.status === 'PAID' ? 'rgba(16,185,129,0.1)' : 'transparent',
                              color: p.status === 'PAID' ? '#10b981' : '#fff',
                              cursor: p.status === 'PAID' ? 'default' : 'pointer',
                              fontSize: '13px'
                            }}
                            title={p.status === 'PAID' ? 'Paid' : 'Click to mark as paid'}
                          >
                            <span style={{
                              width: '20px', height: '20px', borderRadius: '50%',
                              background: p.status === 'PAID' ? '#10b981' : '#3b82f6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 600
                            }}>
                              {p.status === 'PAID' ? '✓' : (p.user.name || p.user.email || '?').charAt(0).toUpperCase()}
                            </span>
                            <span>{p.user.name?.split(' ')[0] || p.user.email?.split('@')[0]}</span>
                            <span style={{ color: '#71717a' }}>{formatCurrency(Number(p.amount))}</span>
                          </button>
                        ))}

                        {bill.status !== 'PAID' && (
                          <button
                            onClick={() => handleMarkBillPaid(bill.id)}
                            style={{
                              padding: '6px 12px', borderRadius: '20px',
                              border: '1px solid rgba(16,185,129,0.3)',
                              background: 'transparent', color: '#10b981',
                              cursor: 'pointer', fontSize: '13px'
                            }}
                          >
                            Mark All Paid
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteBill(bill.id)}
                          style={{
                            padding: '6px 12px', borderRadius: '20px',
                            border: '1px solid rgba(239,68,68,0.3)',
                            background: 'transparent', color: '#ef4444',
                            cursor: 'pointer', fontSize: '13px', marginLeft: 'auto'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Recurring Bills Section */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Recurring Bills</h2>
                <p style={{ fontSize: '12px', color: '#71717a', margin: '4px 0 0 0' }}>These generate monthly instances automatically</p>
              </div>
              <button onClick={() => openRecurringModal()} style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#27272a', color: '#fff', cursor: 'pointer', fontSize: '13px'
              }}>+ Add Recurring</button>
            </div>

            {recurringBills.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>No recurring bills defined</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: '#27272a' }}>
                {recurringBills.map(r => (
                  <div key={r.id} style={{ background: '#18181b', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontWeight: 600, color: r.amountType === 'FIXED' ? '#fff' : '#f59e0b' }}>
                        {r.amountType === 'FIXED' ? formatCurrency(r.fixedAmount || 0) : 'Variable'}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px' }}>
                      {r.vendor} • Due {r.dueDay}th • {r.frequency}
                    </div>
                    {r.emailPatterns?.length > 0 && (
                      <div style={{ fontSize: '11px', color: '#52525b', marginBottom: '8px' }}>
                        Patterns: {r.emailPatterns.join(', ')}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openRecurringModal(r)} style={{
                        padding: '4px 10px', borderRadius: '4px', border: '1px solid #3f3f46', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px'
                      }}>Edit</button>
                      <button onClick={() => handleDeleteRecurring(r.id)} style={{
                        padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '12px'
                      }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Bill Modal */}
      {showAddBillModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#18181b', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px', border: '1px solid #27272a' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>Add One-Time Bill</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Vendor</label>
              <input type="text" value={formData.vendor || ''} onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., Duke Energy" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Type</label>
              <select value={formData.vendorType || 'OTHER'} onChange={e => setFormData({ ...formData, vendorType: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Amount</label>
              <input type="number" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="0.00" step="0.01" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Due Date</label>
              <input type="date" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddBillModal(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3f3f46', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreateBill} disabled={submitting} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 500, opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Bill Modal */}
      {showRecurringModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px', overflowY: 'auto' }}>
          <div style={{ background: '#18181b', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '450px', border: '1px solid #27272a', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px' }}>{editingRecurring ? 'Edit' : 'Add'} Recurring Bill</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Name</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., Electric Bill" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Vendor</label>
              <input type="text" value={formData.vendor || ''} onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., Duke Energy" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Type</label>
                <select value={formData.vendorType || 'OTHER'} onChange={e => setFormData({ ...formData, vendorType: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                  {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Frequency</label>
                <select value={formData.frequency || 'MONTHLY'} onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Amount Type</label>
                <select value={formData.amountType || 'VARIABLE'} onChange={e => setFormData({ ...formData, amountType: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                  <option value="FIXED">Fixed</option>
                  <option value="VARIABLE">Variable</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Due Day</label>
                <input type="number" value={formData.dueDay || ''} onChange={e => setFormData({ ...formData, dueDay: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="15" min="1" max="28" />
              </div>
            </div>
            {formData.amountType === 'FIXED' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Fixed Amount</label>
                <input type="number" value={formData.fixedAmount || ''} onChange={e => setFormData({ ...formData, fixedAmount: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="0.00" step="0.01" />
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Payment Method</label>
              <input type="text" value={formData.paymentMethod || ''} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., Autopay, Zelle" />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Email Patterns (comma-separated)</label>
              <input type="text" value={formData.emailPatterns || ''} onChange={e => setFormData({ ...formData, emailPatterns: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., duke, energy" />
              <p style={{ fontSize: '11px', color: '#52525b', marginTop: '4px' }}>Used to auto-match emails for amount detection</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowRecurringModal(false); setEditingRecurring(null) }} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3f3f46', background: 'transparent', color: '#fff', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveRecurring} disabled={submitting} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 500, opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
