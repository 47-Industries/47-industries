'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Founder {
  id: string
  name: string | null
  email: string
  image?: string
}

interface FounderBalance {
  founder: Founder
  pendingAmount: number
  pendingCount: number
  paidAmount: number
  paidCount: number
  owesFor: string[]
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
  founderCount: number
  perPersonAmount: number
  recurringBill?: { id: string; name: string; paymentMethod: string | null }
  founderPayments?: FounderPayment[]
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

interface ExpensesSummary {
  period: string
  founderCount: number
  bills: {
    pending: BillInstance[]
    paid: BillInstance[]
    overdue: BillInstance[]
    all: BillInstance[]
  }
  founderBalances: FounderBalance[]
  totalOutstanding: number
  totals: {
    pending: number
    paid: number
    overdue: number
    monthlyTotal: number
  }
  upcomingBills: BillInstance[]
  upcomingCount: number
}

const VENDOR_TYPES = [
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'OTHER', label: 'Other' }
]

const FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'ANNUAL', label: 'Annual' }
]

export default function ExpensesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<'monthly' | 'balances' | 'recurring'>('monthly')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Data state
  const [summary, setSummary] = useState<ExpensesSummary | null>(null)
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([])
  const [currentPeriod, setCurrentPeriod] = useState(() => new Date().toISOString().slice(0, 7))

  // Modal state
  const [showBillModal, setShowBillModal] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState<BillInstance | null>(null)
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringBill | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const successMsg = searchParams.get('success')
    const errorMsg = searchParams.get('error')
    if (successMsg) setSuccess(successMsg)
    if (errorMsg) setError(errorMsg)
  }, [searchParams])

  useEffect(() => {
    fetchData()
  }, [activeTab, currentPeriod])

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      if (activeTab === 'monthly' || activeTab === 'balances') {
        const res = await fetch(`/api/admin/expenses-summary-v2?period=${currentPeriod}`)
        if (res.ok) {
          const data = await res.json()
          setSummary(data)
        } else {
          setError('Failed to fetch expenses summary')
        }
      }

      if (activeTab === 'recurring') {
        const res = await fetch('/api/admin/recurring-bills')
        if (res.ok) {
          const data = await res.json()
          setRecurringBills(data.recurringBills || [])
        }
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
    if (direction === 'prev') {
      date.setMonth(date.getMonth() - 1)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    setCurrentPeriod(date.toISOString().slice(0, 7))
  }

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  const openBillModal = () => {
    setFormData({ vendorType: 'OTHER' })
    setShowBillModal(true)
  }

  const openRecurringModal = (recurring?: RecurringBill) => {
    if (recurring) {
      setSelectedRecurring(recurring)
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
      setSelectedRecurring(null)
      setFormData({ amountType: 'VARIABLE', frequency: 'MONTHLY', vendorType: 'OTHER' })
    }
    setShowRecurringModal(true)
  }

  const openDetailModal = async (bill: BillInstance) => {
    try {
      const res = await fetch(`/api/admin/bill-instances/${bill.id}/founder-payments`)
      if (res.ok) {
        const data = await res.json()
        setSelectedBill({ ...bill, founderPayments: data.payments })
        setShowDetailModal(true)
      }
    } catch (err) {
      setError('Failed to load bill details')
    }
  }

  const handleCreateBill = async () => {
    if (!formData.vendor || !formData.amount) {
      setError('Vendor and amount are required')
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
        setShowBillModal(false)
        setSuccess('Bill created and split among founders')
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create bill')
      }
    } catch (err) {
      setError('Failed to create bill')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveRecurring = async () => {
    if (!formData.name || !formData.vendor || !formData.dueDay) {
      setError('Name, vendor, and due day are required')
      return
    }

    if (formData.amountType === 'FIXED' && !formData.fixedAmount) {
      setError('Fixed amount is required for fixed bills')
      return
    }

    setSubmitting(true)
    try {
      const data = {
        name: formData.name,
        vendor: formData.vendor,
        amountType: formData.amountType,
        fixedAmount: formData.amountType === 'FIXED' ? parseFloat(formData.fixedAmount) : null,
        frequency: formData.frequency,
        dueDay: parseInt(formData.dueDay),
        emailPatterns: formData.emailPatterns ? formData.emailPatterns.split(',').map((p: string) => p.trim().toLowerCase()) : [],
        paymentMethod: formData.paymentMethod || null,
        vendorType: formData.vendorType
      }

      const url = selectedRecurring
        ? `/api/admin/recurring-bills/${selectedRecurring.id}`
        : '/api/admin/recurring-bills'

      const res = await fetch(url, {
        method: selectedRecurring ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (res.ok) {
        setShowRecurringModal(false)
        setSelectedRecurring(null)
        setSuccess(selectedRecurring ? 'Recurring bill updated' : 'Recurring bill created')
        fetchData()
      } else {
        const result = await res.json()
        setError(result.error || 'Failed to save recurring bill')
      }
    } catch (err) {
      setError('Failed to save recurring bill')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm('Delete this recurring bill? Existing instances will not be affected.')) return

    try {
      const res = await fetch(`/api/admin/recurring-bills/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Recurring bill deleted')
        fetchData()
      } else {
        setError('Failed to delete recurring bill')
      }
    } catch (err) {
      setError('Failed to delete recurring bill')
    }
  }

  const handleMarkFounderPaid = async (billId: string, userId: string) => {
    try {
      const res = await fetch(`/api/admin/bill-instances/${billId}/founder-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: 'PAID' })
      })

      if (res.ok) {
        fetchData()
        if (selectedBill) {
          openDetailModal(selectedBill)
        }
      } else {
        setError('Failed to update payment')
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
        setShowDetailModal(false)
        setSelectedBill(null)
        setSuccess('Bill marked as paid')
        fetchData()
      } else {
        setError('Failed to update bill')
      }
    } catch (err) {
      setError('Failed to update bill')
    }
  }

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Delete this bill? This cannot be undone.')) return

    try {
      const res = await fetch(`/api/admin/bill-instances/${billId}`, { method: 'DELETE' })
      if (res.ok) {
        setShowDetailModal(false)
        setSelectedBill(null)
        setSuccess('Bill deleted')
        fetchData()
      } else {
        setError('Failed to delete bill')
      }
    } catch (err) {
      setError('Failed to delete bill')
    }
  }

  const getVendorTypeLabel = (value: string) => VENDOR_TYPES.find(t => t.value === value)?.label || value

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '8px' }}>Expenses</h1>
        <p style={{ color: '#a1a1aa' }}>Track bills and expenses split among founders</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #27272a',
        paddingBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {[
          { key: 'monthly', label: 'Monthly Bills' },
          { key: 'balances', label: 'Outstanding Balances' },
          { key: 'recurring', label: 'Recurring Bills' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.key ? '#3b82f6' : '#27272a',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {error}
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          color: '#10b981',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {success}
          <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>Loading...</div>
      ) : (
        <>
          {/* Monthly Bills Tab */}
          {activeTab === 'monthly' && summary && (
            <div>
              {/* Period Navigator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <button onClick={() => navigatePeriod('prev')} style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid #3f3f46',
                  background: 'transparent', color: '#fff', cursor: 'pointer'
                }}>← Previous</button>
                <h2 style={{ fontSize: '24px', fontWeight: 600 }}>{formatPeriod(currentPeriod)}</h2>
                <button onClick={() => navigatePeriod('next')} style={{
                  padding: '8px 16px', borderRadius: '8px', border: '1px solid #3f3f46',
                  background: 'transparent', color: '#fff', cursor: 'pointer'
                }}>Next →</button>
              </div>

              {/* Summary Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '4px' }}>Monthly Total</div>
                  <div style={{ fontSize: '28px', fontWeight: 700 }}>{formatCurrency(summary.totals.monthlyTotal)}</div>
                </div>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '4px' }}>Pending</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(summary.totals.pending)}</div>
                </div>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '4px' }}>Paid</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#10b981' }}>{formatCurrency(summary.totals.paid)}</div>
                </div>
                <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '4px' }}>Founders</div>
                  <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>{summary.founderCount}</div>
                </div>
              </div>

              {/* Add Bill Button */}
              <div style={{ marginBottom: '24px' }}>
                <button onClick={openBillModal} style={{
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500
                }}>
                  + Add Bill
                </button>
              </div>

              {/* Bills Table */}
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
                {summary.bills.all.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#71717a' }}>
                    No bills for {formatPeriod(currentPeriod)}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(39, 39, 42, 0.5)' }}>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Vendor</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>Total</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>Per Person</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Due Date</th>
                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.bills.all.map(bill => {
                        const days = getDaysUntilDue(bill.dueDate)
                        const isOverdue = bill.status === 'PENDING' && days !== null && days < 0
                        return (
                          <tr
                            key={bill.id}
                            onClick={() => openDetailModal(bill)}
                            style={{ borderTop: '1px solid #27272a', cursor: 'pointer' }}
                          >
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontSize: '14px', fontWeight: 500 }}>{bill.vendor}</div>
                              <div style={{ fontSize: '12px', color: '#71717a' }}>{getVendorTypeLabel(bill.vendorType)}</div>
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>
                              {formatCurrency(Number(bill.amount))}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#3b82f6' }}>
                              {formatCurrency(bill.perPersonAmount)}
                            </td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: isOverdue ? '#ef4444' : '#a1a1aa' }}>
                              {formatDate(bill.dueDate)}
                              {days !== null && bill.status === 'PENDING' && (
                                <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                  ({days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`})
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                                background: bill.status === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                color: bill.status === 'PAID' ? '#10b981' : isOverdue ? '#ef4444' : '#f59e0b'
                              }}>
                                {bill.status === 'PAID' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Upcoming Bills */}
              {summary.upcomingBills.length > 0 && (
                <>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, marginTop: '32px', marginBottom: '16px' }}>Due in Next 7 Days</h3>
                  <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {summary.upcomingBills.map(bill => (
                          <tr key={bill.id} onClick={() => openDetailModal(bill)} style={{ borderTop: '1px solid #27272a', cursor: 'pointer' }}>
                            <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{bill.vendor}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right' }}>{formatCurrency(Number(bill.amount))}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#f59e0b' }}>{formatDate(bill.dueDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Balances Tab */}
          {activeTab === 'balances' && summary && (
            <div>
              {/* Outstanding Total */}
              <div style={{
                background: '#18181b', border: '1px solid #27272a', borderRadius: '16px',
                padding: '32px', textAlign: 'center', marginBottom: '32px'
              }}>
                <div style={{ fontSize: '14px', color: '#71717a', marginBottom: '8px' }}>Total Outstanding</div>
                <div style={{ fontSize: '48px', fontWeight: 700, color: summary.totalOutstanding > 0 ? '#ef4444' : '#10b981' }}>
                  {formatCurrency(summary.totalOutstanding)}
                </div>
                <div style={{ fontSize: '14px', color: '#71717a', marginTop: '8px' }}>
                  Split among {summary.founderCount} founder{summary.founderCount !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Founder Balances */}
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Outstanding Balances</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {summary.founderBalances.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#71717a', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a' }}>
                    No founders configured
                  </div>
                ) : summary.founderBalances.map(balance => (
                  <div key={balance.founder.id} style={{
                    background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                        }}>
                          {(balance.founder.name || balance.founder.email || '?').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '16px' }}>{balance.founder.name || balance.founder.email}</span>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: '999px', fontSize: '14px', fontWeight: 600,
                        background: balance.pendingAmount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: balance.pendingAmount > 0 ? '#ef4444' : '#10b981'
                      }}>
                        {balance.pendingAmount > 0 ? formatCurrency(balance.pendingAmount) : 'All caught up'}
                      </span>
                    </div>
                    {balance.owesFor.length > 0 && (
                      <div style={{ fontSize: '13px', color: '#71717a' }}>
                        Pending: {balance.owesFor.join(', ')}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>Pending</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#ef4444' }}>{formatCurrency(balance.pendingAmount)}</div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>{balance.pendingCount} bills</div>
                      </div>
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>Paid</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#10b981' }}>{formatCurrency(balance.paidAmount)}</div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>{balance.paidCount} bills</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Bills Tab */}
          {activeTab === 'recurring' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <button onClick={() => openRecurringModal()} style={{
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500
                }}>
                  + Add Recurring Bill
                </button>
                <p style={{ color: '#71717a', fontSize: '14px', marginTop: '12px' }}>
                  Define bills you expect each month. The system will auto-generate instances and match incoming emails.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
                {recurringBills.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#71717a', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a' }}>
                    No recurring bills defined yet
                  </div>
                ) : recurringBills.map(recurring => (
                  <div key={recurring.id} style={{
                    background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px',
                    opacity: recurring.active ? 1 : 0.6
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{recurring.name}</div>
                        <div style={{ fontSize: '14px', color: '#71717a' }}>{recurring.vendor}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>
                          {recurring.amountType === 'FIXED' ? formatCurrency(recurring.fixedAmount || 0) : 'Variable'}
                        </div>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                          background: recurring.active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(113, 113, 122, 0.2)',
                          color: recurring.active ? '#10b981' : '#71717a'
                        }}>
                          {recurring.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '12px' }}>
                      <span>Due: {recurring.dueDay}th</span>
                      <span style={{ margin: '0 8px' }}>•</span>
                      <span>{recurring.frequency}</span>
                      {recurring.paymentMethod && (
                        <>
                          <span style={{ margin: '0 8px' }}>•</span>
                          <span>{recurring.paymentMethod}</span>
                        </>
                      )}
                    </div>
                    {recurring.emailPatterns && recurring.emailPatterns.length > 0 && (
                      <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '12px' }}>
                        Email patterns: {recurring.emailPatterns.join(', ')}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => openRecurringModal(recurring)} style={{
                        padding: '6px 12px', borderRadius: '6px', border: '1px solid #3f3f46',
                        background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '13px'
                      }}>Edit</button>
                      <button onClick={() => handleDeleteRecurring(recurring.id)} style={{
                        padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)',
                        background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '13px'
                      }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Bill Modal */}
      {showBillModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'
        }}>
          <div style={{
            background: '#18181b', borderRadius: '16px', padding: '24px',
            width: '100%', maxWidth: '500px', border: '1px solid #27272a'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Add Bill</h2>
            <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '24px' }}>
              This bill will be split equally among all founders.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Vendor</label>
              <input type="text" value={formData.vendor || ''} onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., Duke Energy" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Type</label>
              <select value={formData.vendorType || ''} onChange={e => setFormData({ ...formData, vendorType: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Amount</label>
              <input type="number" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="0.00" step="0.01" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Due Date</label>
              <input type="date" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowBillModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3f3f46', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button onClick={handleCreateBill} disabled={submitting}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500, opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Creating...' : 'Create Bill'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recurring Bill Modal */}
      {showRecurringModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{
            background: '#18181b', borderRadius: '16px', padding: '24px',
            width: '100%', maxWidth: '500px', border: '1px solid #27272a', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>
              {selectedRecurring ? 'Edit Recurring Bill' : 'Add Recurring Bill'}
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Name</label>
              <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., Electric Bill" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Vendor</label>
              <input type="text" value={formData.vendor || ''} onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., Duke Energy" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Type</label>
              <select value={formData.vendorType || ''} onChange={e => setFormData({ ...formData, vendorType: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Amount Type</label>
              <select value={formData.amountType || 'VARIABLE'} onChange={e => setFormData({ ...formData, amountType: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="FIXED">Fixed (same every month)</option>
                <option value="VARIABLE">Variable (from email)</option>
              </select>
            </div>
            {formData.amountType === 'FIXED' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Fixed Amount</label>
                <input type="number" value={formData.fixedAmount || ''} onChange={e => setFormData({ ...formData, fixedAmount: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                  placeholder="0.00" step="0.01" />
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Frequency</label>
              <select value={formData.frequency || 'MONTHLY'} onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}>
                {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Due Day (1-28)</label>
              <input type="number" value={formData.dueDay || ''} onChange={e => setFormData({ ...formData, dueDay: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="15" min="1" max="28" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Payment Method</label>
              <input type="text" value={formData.paymentMethod || ''} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., Zelle, Autopay" />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Email Patterns (comma-separated)</label>
              <input type="text" value={formData.emailPatterns || ''} onChange={e => setFormData({ ...formData, emailPatterns: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., duke, energy" />
              <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>Used to auto-match incoming emails</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => { setShowRecurringModal(false); setSelectedRecurring(null); }}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3f3f46', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button onClick={handleSaveRecurring} disabled={submitting}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500, opacity: submitting ? 0.5 : 1 }}>
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Detail Modal */}
      {showDetailModal && selectedBill && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'
        }}>
          <div style={{
            background: '#18181b', borderRadius: '16px', padding: '24px',
            width: '100%', maxWidth: '500px', border: '1px solid #27272a', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>{selectedBill.vendor}</h2>
            <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '24px' }}>{getVendorTypeLabel(selectedBill.vendorType)}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>Total Amount</div>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>{formatCurrency(Number(selectedBill.amount))}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>Per Person</div>
                <div style={{ fontSize: '20px', fontWeight: 600, color: '#3b82f6' }}>{formatCurrency(selectedBill.perPersonAmount)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>Due Date</div>
                <div style={{ fontSize: '16px' }}>{formatDate(selectedBill.dueDate)}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>Status</div>
                <span style={{
                  padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                  background: selectedBill.status === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: selectedBill.status === 'PAID' ? '#10b981' : '#f59e0b'
                }}>
                  {selectedBill.status}
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Founder Payments</h3>
            {selectedBill.founderPayments && selectedBill.founderPayments.length > 0 ? (
              <div style={{ marginBottom: '24px' }}>
                {selectedBill.founderPayments.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px', borderRadius: '8px', background: '#0a0a0a', marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px'
                      }}>
                        {(p.user.name || p.user.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{p.user.name || p.user.email}</div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>{formatCurrency(Number(p.amount))}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => p.status !== 'PAID' && handleMarkFounderPaid(selectedBill.id, p.user.id)}
                      disabled={p.status === 'PAID'}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', border: 'none',
                        background: p.status === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: p.status === 'PAID' ? '#10b981' : '#3b82f6',
                        cursor: p.status === 'PAID' ? 'default' : 'pointer', fontSize: '13px'
                      }}
                    >
                      {p.status === 'PAID' ? 'Paid' : 'Mark Paid'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#71717a', marginBottom: '24px' }}>No payment splits</p>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {selectedBill.status !== 'PAID' && (
                <button onClick={() => handleMarkBillPaid(selectedBill.id)}
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #10b981', background: 'transparent', color: '#10b981', cursor: 'pointer', fontSize: '14px' }}>
                  Mark All Paid
                </button>
              )}
              <button onClick={() => handleDeleteBill(selectedBill.id)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>
                Delete
              </button>
              <button onClick={() => { setShowDetailModal(false); setSelectedBill(null); }}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
