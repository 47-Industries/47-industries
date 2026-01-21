'use client'

import { useState, useEffect } from 'react'

interface EmailAccount {
  id: string
  provider: string
  email: string
  displayName: string | null
  isActive: boolean
  scanForBills: boolean
  lastSyncAt: string | null
  lastSyncError: string | null
  createdAt: string
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
  autoApprove: boolean
}

interface BillInstance {
  id: string
  vendor: string
  amount: number
  period: string | null
  status: string
  paidDate: string | null
  dueDate: string | null
}

const VENDOR_TYPES = [
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
  { value: 'SUBSCRIPTION', label: 'Subscription' },
  { value: 'OTHER', label: 'Other' }
]

export default function ExpenseSettingsTab() {
  const [loading, setLoading] = useState(true)
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([])
  const [syncing, setSyncing] = useState<string | null>(null)
  const [addingZoho, setAddingZoho] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Recurring bill modal state
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringBill | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [submitting, setSubmitting] = useState(false)
  const [historyBill, setHistoryBill] = useState<RecurringBill | null>(null)
  const [billHistory, setBillHistory] = useState<BillInstance[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [emailRes, recurringRes] = await Promise.all([
        fetch('/api/admin/email-accounts'),
        fetch('/api/admin/recurring-bills')
      ])

      if (emailRes.ok) {
        const data = await emailRes.json()
        setEmailAccounts(data.accounts || [])
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

  const fetchEmailAccounts = async () => {
    try {
      const res = await fetch('/api/admin/email-accounts')
      if (res.ok) {
        const data = await res.json()
        setEmailAccounts(data.accounts || [])
      }
    } catch (err) {
      setError('Failed to fetch email accounts')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
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
        vendorType: recurring.vendorType,
        autoApprove: recurring.autoApprove
      })
    } else {
      setEditingRecurring(null)
      setFormData({ amountType: 'VARIABLE', frequency: 'MONTHLY', vendorType: 'OTHER', autoApprove: false })
    }
    setShowRecurringModal(true)
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
        vendorType: formData.vendorType || 'OTHER',
        autoApprove: formData.autoApprove || false
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
        setSuccess(editingRecurring ? 'Recurring bill updated' : 'Recurring bill created')
        fetchData()
      } else {
        setError('Failed to save recurring bill')
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
      setSuccess('Recurring bill deleted')
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

  const handleGenerateBills = async () => {
    setGenerating(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/admin/recurring-bills/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthsBack: 6,
          monthsForward: 2
        })
      })
      const data = await res.json()
      if (res.ok) {
        if (data.created > 0) {
          setSuccess(`Generated ${data.created} bill instance(s) for recurring bills`)
        } else {
          setSuccess('All bill instances already exist - nothing to generate')
        }
      } else {
        setError(data.error || 'Failed to generate bills')
      }
    } catch (err) {
      setError('Failed to generate bills')
    } finally {
      setGenerating(false)
    }
  }

  const handleSync = async (accountId: string) => {
    setSyncing(accountId)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/admin/email-accounts/${accountId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 7 })
      })

      if (res.ok) {
        const data = await res.json()
        setSuccess(`Synced ${data.results?.emails || 0} emails, created ${data.results?.proposed || 0} proposed bills`)
        fetchEmailAccounts()
      } else {
        const data = await res.json()
        setError(data.error || 'Sync failed')
      }
    } catch (err) {
      setError('Failed to sync')
    } finally {
      setSyncing(null)
    }
  }

  const handleToggle = async (accountId: string, field: 'isActive' | 'scanForBills', value: boolean) => {
    try {
      const res = await fetch(`/api/admin/email-accounts/${accountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })

      if (res.ok) {
        fetchEmailAccounts()
      } else {
        setError('Failed to update setting')
      }
    } catch (err) {
      setError('Failed to update')
    }
  }

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to remove this email account?')) return

    try {
      const res = await fetch(`/api/admin/email-accounts/${accountId}`, { method: 'DELETE' })
      if (res.ok) {
        setSuccess('Email account removed')
        fetchEmailAccounts()
      } else {
        setError('Failed to remove account')
      }
    } catch (err) {
      setError('Failed to remove')
    }
  }

  const handleAddZoho = async () => {
    setAddingZoho(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/email-accounts/sync-zoho', { method: 'POST' })
      const data = await res.json()

      if (res.ok) {
        setSuccess(data.message || 'Zoho account added for bill scanning')
        fetchEmailAccounts()
      } else {
        setError(data.error || 'Failed to add Zoho account')
      }
    } catch (err) {
      setError('Failed to add Zoho account')
    } finally {
      setAddingZoho(false)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

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

      {/* Email Accounts Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Email Accounts</h3>
            <p style={{ fontSize: '13px', color: '#71717a', margin: '4px 0 0 0' }}>Configure email accounts for bill scanning</p>
          </div>
          {emailAccounts.length > 0 && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleAddZoho}
                disabled={addingZoho}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  opacity: addingZoho ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {addingZoho ? 'Adding...' : '+ Zoho'}
              </button>
              <a
                href="/api/auth/gmail"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '13px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                + Gmail
              </a>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#71717a' }}>Loading...</div>
        ) : emailAccounts.length === 0 ? (
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M22 6l-10 7L2 6"/>
            </svg>
            <div style={{ color: '#71717a', marginBottom: '8px' }}>No email accounts configured</div>
            <div style={{ fontSize: '13px', color: '#52525b', marginBottom: '16px' }}>
              Connect your email accounts to automatically scan for bills.
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={handleAddZoho}
                disabled={addingZoho}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: addingZoho ? 0.5 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 6l-10 7L2 6"/>
                </svg>
                {addingZoho ? 'Adding...' : 'Add Zoho'}
              </button>
              <a
                href="/api/auth/gmail"
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Add Gmail
              </a>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {emailAccounts.map(account => (
              <div key={account.id} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Provider Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: account.provider === 'GMAIL' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {account.provider === 'GMAIL' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444">
                          <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="M22 6l-10 7L2 6" stroke="#3b82f6" strokeWidth="2" fill="none"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '2px' }}>{account.email}</div>
                      <div style={{ fontSize: '13px', color: '#71717a' }}>
                        {account.provider} - {account.displayName || 'No display name'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      background: account.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(113,113,122,0.1)',
                      color: account.isActive ? '#10b981' : '#71717a',
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Settings */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a', padding: '12px 16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px' }}>Active</span>
                    <button
                      onClick={() => handleToggle(account.id, 'isActive', !account.isActive)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: account.isActive ? '#3b82f6' : '#3f3f46',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s'
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '2px',
                        left: account.isActive ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.2s'
                      }} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0a0a', padding: '12px 16px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '13px' }}>Scan for Bills</span>
                    <button
                      onClick={() => handleToggle(account.id, 'scanForBills', !account.scanForBills)}
                      style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: account.scanForBills ? '#3b82f6' : '#3f3f46',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s'
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        top: '2px',
                        left: account.scanForBills ? '22px' : '2px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#fff',
                        transition: 'left 0.2s'
                      }} />
                    </button>
                  </div>
                </div>

                {/* Sync Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', color: '#71717a' }}>
                  <div>
                    Last synced: {formatDate(account.lastSyncAt)}
                    {account.lastSyncError && (
                      <span style={{ color: '#ef4444', marginLeft: '8px' }}>
                        Error: {account.lastSyncError.substring(0, 50)}...
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleSync(account.id)}
                      disabled={syncing === account.id}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #3f3f46',
                        background: 'transparent',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        opacity: syncing === account.id ? 0.5 : 1
                      }}
                    >
                      {syncing === account.id ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: '1px solid #ef4444',
                        background: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stripe Financial Connections Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Stripe Financial Connections</h3>
          <p style={{ fontSize: '13px', color: '#71717a', margin: '4px 0 0 0' }}>
            Connect bank accounts to import transactions. Configure in the Transactions tab.
          </p>
        </div>

        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#635bff" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <div>
              <div style={{ fontWeight: 600 }}>Stripe Integration</div>
              <div style={{ fontSize: '13px', color: '#71717a' }}>Import transactions from connected bank accounts</div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#71717a' }}>
            To connect bank accounts, go to the <strong>Transactions</strong> tab and click "Connect Bank".
            Stripe Financial Connections allows secure read-only access to transaction history.
          </div>
        </div>
      </div>

      {/* Recurring Bills Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Recurring Bills</h3>
            <p style={{ fontSize: '13px', color: '#71717a', margin: '4px 0 0 0' }}>Templates that generate monthly bill instances</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleGenerateBills}
              disabled={generating || recurringBills.length === 0}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #3f3f46',
                background: 'transparent',
                color: '#fff',
                cursor: generating || recurringBills.length === 0 ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                opacity: generating || recurringBills.length === 0 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {generating ? 'Generating...' : 'Generate Bills'}
            </button>
            <button onClick={() => openRecurringModal()} style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontSize: '13px'
            }}>+ Add Recurring Bill</button>
          </div>
        </div>

        {recurringBills.length === 0 ? (
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div style={{ color: '#71717a', marginBottom: '8px' }}>No recurring bills configured</div>
            <div style={{ fontSize: '13px', color: '#52525b' }}>
              Create recurring bills to automatically track monthly expenses.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
            {recurringBills.map(r => (
              <div key={r.id} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600 }}>{r.name}</span>
                    {r.autoApprove && (
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', color: '#10b981' }}>
                        Auto-approve
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, color: r.amountType === 'FIXED' ? '#fff' : '#f59e0b' }}>
                    {r.amountType === 'FIXED' ? formatCurrency(r.fixedAmount || 0) : 'Variable'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px' }}>
                  {r.vendor} - {VENDOR_TYPES.find(t => t.value === r.vendorType)?.label || r.vendorType}
                </div>
                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '8px' }}>
                  Due {r.dueDay}th - {r.frequency}
                </div>
                {r.emailPatterns?.length > 0 && (
                  <div style={{ fontSize: '11px', color: '#52525b', marginBottom: '8px' }}>
                    Patterns: {r.emailPatterns.join(', ')}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => openHistoryModal(r)} style={{
                    padding: '6px 12px', borderRadius: '6px', border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', cursor: 'pointer', fontSize: '12px'
                  }}>History</button>
                  <button onClick={() => openRecurringModal(r)} style={{
                    padding: '6px 12px', borderRadius: '6px', border: '1px solid #3f3f46', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '12px'
                  }}>Edit</button>
                  <button onClick={() => handleDeleteRecurring(r.id)} style={{
                    padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '12px'
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#a1a1aa', marginBottom: '6px' }}>Email Patterns (comma-separated)</label>
              <input type="text" value={formData.emailPatterns || ''} onChange={e => setFormData({ ...formData, emailPatterns: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', background: '#0a0a0a', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
                placeholder="e.g., duke, energy" />
              <p style={{ fontSize: '11px', color: '#52525b', marginTop: '4px' }}>Used to auto-match emails for amount detection</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.autoApprove || false}
                  onChange={e => setFormData({ ...formData, autoApprove: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '13px' }}>Auto-approve matched transactions</span>
              </label>
              <p style={{ fontSize: '11px', color: '#52525b', marginTop: '4px', marginLeft: '26px' }}>
                Automatically approve bank transactions that match this recurring bill
              </p>
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

      {/* Bill History Modal */}
      {showHistoryModal && historyBill && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
          <div style={{ background: '#18181b', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '550px', border: '1px solid #27272a', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>{historyBill.name} History</h2>
              <p style={{ fontSize: '13px', color: '#71717a' }}>
                {historyBill.vendor} - {historyBill.amountType === 'FIXED' ? formatCurrency(historyBill.fixedAmount || 0) + '/mo' : 'Variable'} - Due {historyBill.dueDay}th
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
                    return (
                      <div key={instance.id} style={{
                        background: isLatest ? 'rgba(59,130,246,0.1)' : '#0a0a0a',
                        border: isLatest ? '1px solid rgba(59,130,246,0.3)' : '1px solid #27272a',
                        borderRadius: '8px', padding: '12px 16px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 600 }}>
                              {instance.period ? new Date(instance.period + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
                            </span>
                            {isLatest && (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: '#3b82f6', color: '#fff' }}>Current</span>
                            )}
                          </div>
                          <span style={{ fontSize: '18px', fontWeight: 700 }}>
                            {Number(instance.amount) > 0 ? formatCurrency(Number(instance.amount)) : 'Pending'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#71717a' }}>
                          <span>Due: {instance.dueDate ? new Date(instance.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}</span>
                          <span style={{ color: instance.status === 'PAID' ? '#10b981' : '#f59e0b' }}>
                            {instance.status === 'PAID' ? `Paid ${instance.paidDate ? new Date(instance.paidDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}` : 'Pending'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <button onClick={() => { setShowHistoryModal(false); setHistoryBill(null); setBillHistory([]) }} style={{
              padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer', fontWeight: 500, alignSelf: 'flex-end'
            }}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
