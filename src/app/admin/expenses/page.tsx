'use client'

import { useState, useEffect } from 'react'
import ExpenseAccessDenied from '@/components/admin/ExpenseAccessDenied'
import ApprovalQueueTab from '@/components/admin/expenses/ApprovalQueueTab'
import TransactionsTab from '@/components/admin/expenses/TransactionsTab'
import ExpenseSettingsTab from '@/components/admin/expenses/ExpenseSettingsTab'

type TabType = 'bills' | 'approval' | 'transactions' | 'settings'

interface ExpensePermission {
  canAccess: boolean
  userId: string | null
  teamMemberId: string | null
  reason: string
}

interface Splitter {
  id: string
  name: string
  email: string | null
  profileImageUrl: string | null
}

interface BillSplit {
  id: string
  amount: number
  status: string
  paidDate: string | null
  teamMember: Splitter
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
  billSplits: BillSplit[]
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

  // Permission checking
  const [permissionLoading, setPermissionLoading] = useState(true)
  const [permission, setPermission] = useState<ExpensePermission | null>(null)

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('bills')
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0)
  const [unmatchedTransactionCount, setUnmatchedTransactionCount] = useState(0)

  const [bills, setBills] = useState<BillInstance[]>([])
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([])
  const [splitters, setSplitters] = useState<Splitter[]>([])
  const [currentPeriod, setCurrentPeriod] = useState(() => new Date().toISOString().slice(0, 7))

  // Modal state
  const [showAddBillModal, setShowAddBillModal] = useState(false)
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [showScanModal, setShowScanModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringBill | null>(null)
  const [editingBillAmount, setEditingBillAmount] = useState<string | null>(null)
  const [tempAmount, setTempAmount] = useState('')
  const [formData, setFormData] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanResults, setScanResults] = useState<any>(null)
  const [historyBill, setHistoryBill] = useState<RecurringBill | null>(null)
  const [billHistory, setBillHistory] = useState<BillInstance[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Check permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const res = await fetch('/api/admin/expense-permission')
        if (res.ok) {
          const data = await res.json()
          setPermission(data)
        } else {
          setPermission({
            canAccess: false,
            userId: null,
            teamMemberId: null,
            reason: 'Failed to check permission'
          })
        }
      } catch (err) {
        setPermission({
          canAccess: false,
          userId: null,
          teamMemberId: null,
          reason: 'Error checking permission'
        })
      } finally {
        setPermissionLoading(false)
      }
    }
    checkPermission()
  }, [])

  useEffect(() => {
    // Only fetch data if permission is granted
    if (permission?.canAccess) {
      fetchData()
      fetchBadgeCounts()
    }
  }, [currentPeriod, permission?.canAccess])

  const fetchBadgeCounts = async () => {
    try {
      // Fetch pending approval count
      const proposedRes = await fetch('/api/admin/proposed-bills?status=PENDING&limit=1')
      if (proposedRes.ok) {
        const data = await proposedRes.json()
        setPendingApprovalCount(data.pendingCount || 0)
      }

      // Fetch unmatched transaction count
      const txnRes = await fetch('/api/admin/financial-connections/transactions?matched=false&limit=1')
      if (txnRes.ok) {
        const data = await txnRes.json()
        setUnmatchedTransactionCount(data.unmatchedCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch badge counts:', err)
    }
  }

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
        setSplitters(data.splitters || [])
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

  const handleMarkSplitterPaid = async (billId: string, teamMemberId: string) => {
    try {
      const res = await fetch(`/api/admin/bill-instances/${billId}/bill-splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamMemberId, status: 'PAID' })
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

  const openHistoryModal = async (recurring: RecurringBill) => {
    setHistoryBill(recurring)
    setShowHistoryModal(true)
    setLoadingHistory(true)
    try {
      const res = await fetch(`/api/admin/recurring-bills/${recurring.id}/history`)
      if (res.ok) {
        const data = await res.json()
        setBillHistory(data.instances || [])
      }
    } catch (err) {
      setError('Failed to load history')
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleScanEmails = async (daysBack: number) => {
    setScanning(true)
    setScanResults(null)
    try {
      const res = await fetch(`/api/cron/scan-bills?daysBack=${daysBack}`)
      const data = await res.json()
      setScanResults(data)
      if (data.success) {
        setSuccess(`Scan complete: ${data.emailsFound} emails found, ${data.results.processed} processed, ${data.results.created} bills created`)
        fetchData() // Refresh the bills list
      } else {
        setError(data.error || 'Scan failed')
      }
    } catch (err) {
      setError('Failed to run scan')
    } finally {
      setScanning(false)
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

  // Calculate splitter totals
  const splitterTotals = splitters.map(s => {
    let pending = 0
    let paid = 0
    bills.forEach(b => {
      const split = b.billSplits?.find(sp => sp.teamMember.id === s.id)
      if (split) {
        if (split.status === 'PAID') {
          paid += Number(split.amount)
        } else {
          pending += Number(split.amount)
        }
      }
    })
    return { splitter: s, pending, paid }
  })

  // Show loading while checking permission
  if (permissionLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>
        Checking access...
      </div>
    )
  }

  // Show access denied if no permission
  if (!permission?.canAccess) {
    return <ExpenseAccessDenied reason={permission?.reason} />
  }

  const tabs = [
    { id: 'bills' as TabType, label: 'Bills', badge: null },
    { id: 'approval' as TabType, label: 'Approval Queue', badge: pendingApprovalCount },
    { id: 'transactions' as TabType, label: 'Transactions', badge: unmatchedTransactionCount },
    { id: 'settings' as TabType, label: 'Settings', badge: null }
  ]

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>Expenses</h1>
        <p style={{ color: '#71717a', fontSize: '14px' }}>Track and manage shared bills</p>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #27272a', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: activeTab === tab.id ? '#18181b' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              color: activeTab === tab.id ? '#ffffff' : '#71717a',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s'
            }}
          >
            {tab.label}
            {tab.badge !== null && tab.badge > 0 && (
              <span style={{
                background: tab.id === 'approval' ? '#f59e0b' : '#3b82f6',
                color: '#000',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                minWidth: '20px',
                textAlign: 'center'
              }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Messages */}
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

      {/* Tab Content */}
      {activeTab === 'approval' && (
        <ApprovalQueueTab onCountChange={setPendingApprovalCount} />
      )}

      {activeTab === 'transactions' && (
        <TransactionsTab onCountChange={setUnmatchedTransactionCount} />
      )}

      {activeTab === 'settings' && (
        <ExpenseSettingsTab />
      )}

      {activeTab === 'bills' && (loading ? (
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

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowScanModal(true)} style={{
                padding: '12px 20px', borderRadius: '8px', border: '1px solid #3f3f46', background: 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 500
              }}>Scan Emails</button>
              <button onClick={() => { setFormData({ vendorType: 'OTHER' }); setShowAddBillModal(true) }} style={{
                padding: '12px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 500
              }}>+ Add Bill</button>
            </div>
          </div>

          {/* Splitter Summary */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {splitterTotals.map(st => (
              <div key={st.splitter.id} style={{
                background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: '12px', minWidth: '180px'
              }}>
                {st.splitter.profileImageUrl ? (
                  <img
                    src={st.splitter.profileImageUrl}
                    alt={st.splitter.name}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', background: st.pending > 0 ? '#f59e0b' : '#10b981',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px'
                  }}>
                    {(st.splitter.name || st.splitter.email || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>{st.splitter.name || st.splitter.email}</div>
                  <div style={{ fontSize: '12px', color: st.pending > 0 ? '#f59e0b' : '#10b981' }}>
                    {st.pending > 0 ? `Owes ${formatCurrency(st.pending)}` : 'All paid'}
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
                  const splitCount = bill.billSplits?.length || splitters.length || 1
                  const perPerson = Number(bill.amount) / splitCount

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

                      {/* Bill Splits - Always visible */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {bill.billSplits?.map(split => (
                          <button
                            key={split.id}
                            onClick={() => split.status !== 'PAID' && handleMarkSplitterPaid(bill.id, split.teamMember.id)}
                            disabled={split.status === 'PAID'}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '6px 12px', borderRadius: '20px',
                              border: split.status === 'PAID' ? '1px solid rgba(16,185,129,0.3)' : '1px solid #3f3f46',
                              background: split.status === 'PAID' ? 'rgba(16,185,129,0.1)' : 'transparent',
                              color: split.status === 'PAID' ? '#10b981' : '#fff',
                              cursor: split.status === 'PAID' ? 'default' : 'pointer',
                              fontSize: '13px'
                            }}
                            title={split.status === 'PAID' ? 'Paid' : 'Click to mark as paid'}
                          >
                            {split.teamMember.profileImageUrl ? (
                              <img
                                src={split.teamMember.profileImageUrl}
                                alt={split.teamMember.name}
                                style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                            ) : (
                              <span style={{
                                width: '20px', height: '20px', borderRadius: '50%',
                                background: split.status === 'PAID' ? '#10b981' : '#3b82f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '10px', fontWeight: 600
                              }}>
                                {split.status === 'PAID' ? 'OK' : (split.teamMember.name || split.teamMember.email || '?').charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span>{split.teamMember.name?.split(' ')[0] || split.teamMember.email?.split('@')[0]}</span>
                            <span style={{ color: '#71717a' }}>{formatCurrency(Number(split.amount))}</span>
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
                      <button onClick={() => openHistoryModal(r)} style={{
                        padding: '4px 10px', borderRadius: '4px', border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', cursor: 'pointer', fontSize: '12px'
                      }}>History</button>
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
      ))}

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

      {/* Scan Emails Modal */}
      {showScanModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#18181b', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '450px', border: '1px solid #27272a' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Scan Emails for Bills</h2>
            <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '20px' }}>
              Scan your Gmail for bill notifications and payment confirmations. This will update variable bill amounts and mark paid bills.
            </p>

            {scanning ? (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Scanning emails...</div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>This may take a minute for deep scans</div>
              </div>
            ) : scanResults ? (
              <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: scanResults.success ? '#10b981' : '#ef4444' }}>
                  {scanResults.success ? 'Scan Complete' : 'Scan Failed'}
                </div>
                {scanResults.success && (
                  <div style={{ fontSize: '13px', color: '#a1a1aa' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>Days scanned: <span style={{ color: '#fff' }}>{scanResults.daysBack}</span></div>
                      <div>Emails found: <span style={{ color: '#fff' }}>{scanResults.emailsFound}</span></div>
                      <div>Processed: <span style={{ color: '#fff' }}>{scanResults.results.processed}</span></div>
                      <div>Bills created: <span style={{ color: '#10b981' }}>{scanResults.results.created}</span></div>
                      <div>Marked paid: <span style={{ color: '#3b82f6' }}>{scanResults.results.paid}</span></div>
                      <div>Skipped: <span style={{ color: '#71717a' }}>{scanResults.results.skipped}</span></div>
                    </div>
                  </div>
                )}
                {!scanResults.success && (
                  <div style={{ fontSize: '13px', color: '#ef4444' }}>{scanResults.error || scanResults.message}</div>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
                <button
                  onClick={() => handleScanEmails(1)}
                  style={{ padding: '16px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Quick Scan (1 day)</div>
                  <div style={{ fontSize: '12px', color: '#71717a' }}>Check for new bills from the last 24 hours</div>
                </button>
                <button
                  onClick={() => handleScanEmails(7)}
                  style={{ padding: '16px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#27272a', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Week Scan (7 days)</div>
                  <div style={{ fontSize: '12px', color: '#71717a' }}>Check the past week for missed bills</div>
                </button>
                <button
                  onClick={() => handleScanEmails(30)}
                  style={{ padding: '16px', borderRadius: '8px', border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.1)', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Deep Scan (30 days)</div>
                  <div style={{ fontSize: '12px', color: '#71717a' }}>Full month scan to catch all bills</div>
                </button>
                <button
                  onClick={() => handleScanEmails(60)}
                  style={{ padding: '16px', borderRadius: '8px', border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.1)', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Extended Scan (60 days)</div>
                  <div style={{ fontSize: '12px', color: '#71717a' }}>Two month scan for initial setup</div>
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              {scanResults && (
                <button onClick={() => setScanResults(null)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3f3f46', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
                  Scan Again
                </button>
              )}
              <button onClick={() => { setShowScanModal(false); setScanResults(null) }} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                {scanResults ? 'Done' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bill History Modal */}
      {showHistoryModal && historyBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#18181b', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '550px', border: '1px solid #27272a', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{historyBill.name} History</h2>
              <p style={{ fontSize: '13px', color: '#71717a' }}>
                {historyBill.vendor} • {historyBill.amountType === 'FIXED' ? formatCurrency(historyBill.fixedAmount || 0) + '/mo' : 'Variable'} • Due {historyBill.dueDay}th
              </p>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#71717a' }}>Loading history...</div>
              ) : billHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#71717a' }}>No bill history yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {billHistory.map((instance, idx) => {
                    const isLatest = idx === 0
                    const prevInstance = billHistory[idx + 1]
                    const amountChange = prevInstance ? Number(instance.amount) - Number(prevInstance.amount) : 0
                    const changePercent = prevInstance && Number(prevInstance.amount) > 0
                      ? ((amountChange / Number(prevInstance.amount)) * 100).toFixed(1)
                      : null

                    return (
                      <div key={instance.id} style={{
                        background: isLatest ? 'rgba(59,130,246,0.1)' : '#0a0a0a',
                        border: isLatest ? '1px solid rgba(59,130,246,0.3)' : '1px solid #27272a',
                        borderRadius: '8px', padding: '12px 16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600 }}>
                              {instance.period?.includes('Q')
                                ? instance.period
                                : new Date(instance.period + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                            {isLatest && (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#3b82f6', color: '#fff' }}>Current</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px', fontWeight: 700 }}>
                              {Number(instance.amount) > 0 ? formatCurrency(Number(instance.amount)) : 'Pending'}
                            </span>
                            {changePercent && Number(changePercent) !== 0 && (
                              <span style={{
                                fontSize: '11px', padding: '2px 6px', borderRadius: '4px',
                                background: amountChange > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                                color: amountChange > 0 ? '#ef4444' : '#10b981'
                              }}>
                                {amountChange > 0 ? '+' : ''}{changePercent}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#71717a' }}>
                          <span>Due: {instance.dueDate ? formatDate(instance.dueDate) : '-'}</span>
                          <span style={{
                            color: instance.status === 'PAID' ? '#10b981' : '#f59e0b'
                          }}>
                            {instance.status === 'PAID' ? `Paid ${instance.paidDate ? formatDate(instance.paidDate) : ''}` : 'Pending'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Stats summary */}
            {billHistory.length > 1 && (
              <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: '#71717a', fontSize: '11px', marginBottom: '2px' }}>Average</div>
                    <div style={{ fontWeight: 600 }}>
                      {formatCurrency(billHistory.reduce((sum, b) => sum + Number(b.amount), 0) / billHistory.length)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#71717a', fontSize: '11px', marginBottom: '2px' }}>Highest</div>
                    <div style={{ fontWeight: 600, color: '#ef4444' }}>
                      {formatCurrency(Math.max(...billHistory.map(b => Number(b.amount))))}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#71717a', fontSize: '11px', marginBottom: '2px' }}>Lowest</div>
                    <div style={{ fontWeight: 600, color: '#10b981' }}>
                      {formatCurrency(Math.min(...billHistory.filter(b => Number(b.amount) > 0).map(b => Number(b.amount))) || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => { setShowHistoryModal(false); setHistoryBill(null); setBillHistory([]) }} style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 500, alignSelf: 'flex-end'
            }}>Close</button>
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
