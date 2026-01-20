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

export default function ExpenseSettingsTab() {
  const [loading, setLoading] = useState(true)
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [syncing, setSyncing] = useState<string | null>(null)
  const [addingZoho, setAddingZoho] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchEmailAccounts()
  }, [])

  const fetchEmailAccounts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/email-accounts')
      if (res.ok) {
        const data = await res.json()
        setEmailAccounts(data.accounts || [])
      }
    } catch (err) {
      setError('Failed to fetch email accounts')
    } finally {
      setLoading(false)
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
              {addingZoho ? 'Adding...' : 'Add Zoho'}
            </button>
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
              Add your connected Zoho account to automatically scan for bills.
            </div>
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
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
              {addingZoho ? 'Adding...' : 'Add Zoho Account'}
            </button>
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
      <div>
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
    </div>
  )
}
