'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

// Types
interface Founder {
  id: string
  name: string
  email: string
  image?: string
  pendingAmount?: number
  pendingCount?: number
  paidAmount?: number
  paidCount?: number
}

interface BillPayment {
  id: string
  amount: number
  status: string
  paidDate: string | null
  user: Founder
}

interface Bill {
  id: string
  vendor: string
  vendorType: string
  amount: number
  dueDate: string | null
  status: string
  emailSubject: string | null
  createdAt: string
  payments: BillPayment[]
  founderCount: number
  perPersonAmount: number
}

interface SyncStatus {
  configured: boolean
  accountEmail: string | null
  lastSync: string | null
  authUrl: string | null
}

interface FounderSummary {
  founder: { id: string; name: string; email: string; image?: string }
  pending: { count: number; amount: number }
  paid: { count: number; amount: number }
  totalOwed: number
  totalPaid: number
}

interface GlobalTotals {
  totalPending: number
  totalPaid: number
  upcomingBillsCount: number
  overdueBillsCount: number
  founderCount: number
}

const VENDOR_TYPES = [
  { value: 'UTILITY', label: 'Utility (Electric, Water, Gas)' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'BANK_ALERT', label: 'Bank Alert' },
  { value: 'OTHER', label: 'Other' }
]

export default function ExpensesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<'summary' | 'bills' | 'founders'>('summary')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Data state
  const [summary, setSummary] = useState<FounderSummary[]>([])
  const [globalTotals, setGlobalTotals] = useState<GlobalTotals | null>(null)
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([])
  const [overdueBills, setOverdueBills] = useState<Bill[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [founders, setFounders] = useState<Founder[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)

  // Check permissions
  const userPermissions = (session?.user as any)?.permissions || []
  const hasAccess = session?.user?.role === 'SUPER_ADMIN' || userPermissions.includes('expenses')
  const isFounder = (session?.user as any)?.isFounder || false

  useEffect(() => {
    if (session && !hasAccess) {
      router.push('/admin')
    }
  }, [session, hasAccess, router])

  useEffect(() => {
    const successMsg = searchParams.get('success')
    const errorMsg = searchParams.get('error')
    if (successMsg) setSuccess(successMsg)
    if (errorMsg) setError(errorMsg)
  }, [searchParams])

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    setError('')

    try {
      if (activeTab === 'summary') {
        const res = await fetch('/api/admin/expenses-summary')
        if (res.ok) {
          const data = await res.json()
          setSummary(data.summary || [])
          setGlobalTotals(data.globalTotals || null)
          setUpcomingBills(data.upcomingBills || [])
          setOverdueBills(data.overdueBills || [])
        }
      }

      if (activeTab === 'bills') {
        const [billsRes, syncRes] = await Promise.all([
          fetch('/api/admin/bills'),
          fetch('/api/admin/bills/sync')
        ])
        if (billsRes.ok) {
          const data = await billsRes.json()
          setBills(data.bills || [])
          setFounders(data.founders || [])
        }
        if (syncRes.ok) {
          const data = await syncRes.json()
          setSyncStatus(data)
        }
      }

      if (activeTab === 'founders') {
        const res = await fetch('/api/admin/founders')
        if (res.ok) {
          const data = await res.json()
          setFounders(data.founders || [])
        }
      }
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const syncBills = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/bills/sync', { method: 'POST' })
      const data = await res.json()

      if (data.needsAuth && data.authUrl) {
        window.location.href = data.authUrl
        return
      }

      if (res.ok) {
        setSuccess(`Synced: ${data.created || 0} new bills found`)
        fetchData()
      } else {
        setError(data.error || 'Failed to sync')
      }
    } catch (err) {
      setError('Failed to sync bills')
    } finally {
      setSyncing(false)
    }
  }

  const openModal = () => {
    setFormData({})
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: formData.vendor,
          vendorType: formData.vendorType || 'OTHER',
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate
        })
      })

      if (res.ok) {
        setShowModal(false)
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

  const markPaymentPaid = async (billId: string, userId: string) => {
    try {
      const res = await fetch(`/api/admin/bills/${billId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: 'PAID' })
      })
      if (res.ok) {
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update payment')
      }
    } catch (err) {
      setError('Failed to update payment')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString()
  }

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null
    const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days
  }

  if (!hasAccess) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#71717a' }}>
        You don't have permission to access this page.
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '8px' }}>Expenses</h1>
        <p style={{ color: '#a1a1aa' }}>Track bills and expenses split among the 4 founders</p>
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
          { key: 'summary', label: 'Summary' },
          { key: 'bills', label: 'Bills' },
          { key: 'founders', label: 'Founders' }
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
          <button onClick={() => setError('')} style={{ float: 'right', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>x</button>
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
          <button onClick={() => setSuccess('')} style={{ float: 'right', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer' }}>x</button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>Loading...</div>
      ) : (
        <>
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div>
              {/* Global Stats */}
              {globalTotals && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '4px' }}>Total Pending</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>{formatCurrency(globalTotals.totalPending)}</div>
                  </div>
                  <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '4px' }}>Upcoming Bills</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>{globalTotals.upcomingBillsCount}</div>
                    <div style={{ fontSize: '12px', color: '#71717a' }}>due in 7 days</div>
                  </div>
                  <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '4px' }}>Overdue</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: overdueBills.length > 0 ? '#ef4444' : '#10b981' }}>{globalTotals.overdueBillsCount}</div>
                  </div>
                  <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', padding: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '4px' }}>Founders</div>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>{globalTotals.founderCount}</div>
                    <div style={{ fontSize: '12px', color: '#71717a' }}>splitting bills</div>
                  </div>
                </div>
              )}

              {/* Founder Balances */}
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Founder Balances</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {summary.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#71717a', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a' }}>
                    No founders configured. Mark users as founders in the Users section.
                  </div>
                ) : summary.map(s => (
                  <div key={s.founder.id} style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '16px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {s.founder.image ? (
                          <img src={s.founder.image} alt={s.founder.name || ''} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                            {(s.founder.name || s.founder.email || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span style={{ fontWeight: 600, fontSize: '18px' }}>{s.founder.name || s.founder.email}</span>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '999px',
                        fontSize: '14px',
                        fontWeight: 600,
                        background: s.totalOwed > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: s.totalOwed > 0 ? '#ef4444' : '#10b981'
                      }}>
                        {s.totalOwed > 0 ? `Owes ${formatCurrency(s.totalOwed)}` : 'Settled'}
                      </span>
                    </div>
                    {isFounder && (
                      <div style={{ fontSize: '13px', color: '#a1a1aa' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span>Pending:</span>
                          <span>{s.pending.count} bills ({formatCurrency(s.pending.amount)})</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Paid:</span>
                          <span>{s.paid.count} bills ({formatCurrency(s.paid.amount)})</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Overdue Bills */}
              {overdueBills.length > 0 && (
                <>
                  <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', color: '#ef4444' }}>Overdue Bills</h2>
                  <div style={{ background: '#18181b', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', overflow: 'hidden', marginBottom: '32px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Vendor</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>Total</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>Per Person</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overdueBills.map((bill: any) => (
                          <tr key={bill.id} style={{ borderTop: '1px solid #27272a' }}>
                            <td style={{ padding: '12px 16px', fontSize: '14px' }}>{bill.vendor}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(Number(bill.amount))}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#ef4444' }}>{formatCurrency(bill.perPersonAmount)}</td>
                            <td style={{ padding: '12px 16px', fontSize: '14px', color: '#ef4444' }}>{formatDate(bill.dueDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Upcoming Bills */}
              {upcomingBills.length > 0 && (
                <>
                  <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>Upcoming Bills (Next 7 Days)</h2>
                  <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'rgba(39, 39, 42, 0.5)' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Vendor</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>Total</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>Per Person</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {upcomingBills.map((bill: any) => {
                          const days = getDaysUntilDue(bill.dueDate)
                          return (
                            <tr key={bill.id} style={{ borderTop: '1px solid #27272a' }}>
                              <td style={{ padding: '12px 16px', fontSize: '14px' }}>{bill.vendor}</td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(Number(bill.amount))}</td>
                              <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#3b82f6' }}>{formatCurrency(bill.perPersonAmount)}</td>
                              <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                                <span style={{ color: days !== null && days <= 2 ? '#f59e0b' : '#a1a1aa' }}>
                                  {formatDate(bill.dueDate)}
                                  {days !== null && <span style={{ marginLeft: '8px', fontSize: '12px' }}>({days} days)</span>}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <button onClick={openModal} style={{
                  padding: '10px 20px', borderRadius: '8px', border: 'none',
                  background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500
                }}>
                  Add Manual Bill
                </button>
                <button onClick={syncBills} disabled={syncing} style={{
                  padding: '10px 20px', borderRadius: '8px', border: '1px solid #3f3f46',
                  background: '#27272a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
                  opacity: syncing ? 0.5 : 1
                }}>
                  {syncing ? 'Syncing...' : 'Sync from Gmail'}
                </button>
                {syncStatus && (
                  <span style={{ fontSize: '13px', color: '#71717a', alignSelf: 'center' }}>
                    {syncStatus.configured
                      ? `Last sync: ${syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}`
                      : 'Gmail not configured'}
                  </span>
                )}
              </div>

              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(39, 39, 42, 0.5)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Vendor</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>Total</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>Per Person</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Due Date</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Payments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#71717a' }}>
                          No bills yet. Add manually or sync from Gmail.
                        </td>
                      </tr>
                    ) : bills.map(bill => (
                      <tr key={bill.id} style={{ borderTop: '1px solid #27272a' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '14px', fontWeight: 500 }}>{bill.vendor}</div>
                          <div style={{ fontSize: '12px', color: '#71717a' }}>{bill.vendorType}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(Number(bill.amount))}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', textAlign: 'right', color: '#3b82f6' }}>
                          {formatCurrency(bill.perPersonAmount)}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px' }}>{formatDate(bill.dueDate)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500,
                            background: bill.status === 'PAID' ? 'rgba(16, 185, 129, 0.1)' : bill.status === 'OVERDUE' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: bill.status === 'PAID' ? '#10b981' : bill.status === 'OVERDUE' ? '#ef4444' : '#f59e0b'
                          }}>
                            {bill.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {bill.payments.map(p => (
                              <button
                                key={p.id}
                                onClick={() => p.status !== 'PAID' && markPaymentPaid(bill.id, p.user.id)}
                                disabled={p.status === 'PAID'}
                                style={{
                                  padding: '4px 8px', borderRadius: '4px', border: 'none',
                                  background: p.status === 'PAID' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                                  color: p.status === 'PAID' ? '#10b981' : '#3b82f6',
                                  cursor: p.status === 'PAID' ? 'default' : 'pointer',
                                  fontSize: '11px'
                                }}
                              >
                                {(p.user.name || p.user.email || '').split(' ')[0]}: {p.status === 'PAID' ? 'Paid' : formatCurrency(Number(p.amount))}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Founders Tab */}
          {activeTab === 'founders' && (
            <div>
              <p style={{ color: '#71717a', marginBottom: '24px' }}>
                Founders are users marked with the isFounder flag. All bills are automatically split equally among founders.
                To add or remove founders, edit users in the Users section and toggle the isFounder flag.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {founders.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#71717a', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a' }}>
                    No founders configured. Mark users as founders in the Users section.
                  </div>
                ) : founders.map(founder => (
                  <div key={founder.id} style={{
                    background: '#18181b',
                    border: '1px solid #27272a',
                    borderRadius: '16px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      {founder.image ? (
                        <img src={founder.image} alt={founder.name || ''} style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '18px' }}>
                          {(founder.name || founder.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '16px' }}>{founder.name || 'No name'}</div>
                        <div style={{ fontSize: '13px', color: '#71717a' }}>{founder.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Pending</div>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#ef4444' }}>{formatCurrency(founder.pendingAmount || 0)}</div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>{founder.pendingCount || 0} bills</div>
                      </div>
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Paid</div>
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#10b981' }}>{formatCurrency(founder.paidAmount || 0)}</div>
                        <div style={{ fontSize: '11px', color: '#71717a' }}>{founder.paidCount || 0} bills</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Bill Modal */}
      {showModal && (
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
              This bill will be automatically split equally among all {founders.length || '?'} founders.
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
                <option value="">Select type</option>
                {VENDOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Total Amount</label>
              <input type="number" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="0.00" step="0.01" />
              {formData.amount && founders.length > 0 && (
                <div style={{ fontSize: '13px', color: '#3b82f6', marginTop: '8px' }}>
                  Per person: {formatCurrency(parseFloat(formData.amount) / founders.length)}
                </div>
              )}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>Due Date</label>
              <input type="date" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => setShowModal(false)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #3f3f46', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting || !formData.vendor || !formData.amount}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: 500, opacity: (submitting || !formData.vendor || !formData.amount) ? 0.5 : 1 }}>
                {submitting ? 'Creating...' : 'Create Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
