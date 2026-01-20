'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  stripeTransactionId: string
  amount: number
  description: string | null
  merchantName: string | null
  category: string | null
  transactedAt: string
  status: string
  matchedBillInstanceId: string | null
  matchConfidence: number | null
  financialAccount: {
    institutionName: string
    accountLast4: string | null
  }
}

interface FinancialAccount {
  id: string
  stripeAccountId: string
  institutionName: string
  accountName: string | null
  accountType: string
  accountLast4: string | null
  status: string
  lastSyncAt: string | null
  _count: { transactions: number }
}

interface TransactionsTabProps {
  onCountChange: (count: number) => void
}

export default function TransactionsTab({ onCountChange }: TransactionsTabProps) {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [matchedFilter, setMatchedFilter] = useState<'all' | 'matched' | 'unmatched'>('all')
  const [syncing, setSyncing] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [matchedFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const matchedParam = matchedFilter === 'all' ? '' : `&matched=${matchedFilter === 'matched'}`

      const [txnRes, accRes] = await Promise.all([
        fetch(`/api/admin/financial-connections/transactions?${matchedParam}`),
        fetch('/api/admin/financial-connections/accounts')
      ])

      if (txnRes.ok) {
        const data = await txnRes.json()
        setTransactions(data.transactions || [])
        onCountChange(data.unmatchedCount || 0)
      }

      if (accRes.ok) {
        const data = await accRes.json()
        setAccounts(data.accounts || [])
      }
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async (accountId?: string) => {
    setSyncing(true)
    try {
      const res = await fetch('/api/admin/financial-connections/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId })
      })

      if (res.ok) {
        const data = await res.json()
        alert(`Synced ${data.results?.transactionsAdded || 0} new transactions`)
        fetchData()
      } else {
        const data = await res.json()
        setError(data.error || 'Sync failed')
      }
    } catch (err) {
      setError('Failed to sync')
    } finally {
      setSyncing(false)
    }
  }

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await fetch('/api/admin/financial-connections/session', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        // In a real implementation, you would open Stripe's Financial Connections modal here
        // For now, we'll just show a message
        alert('Stripe Financial Connections integration requires Stripe.js. Session created: ' + data.sessionId)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to create session')
      }
    } catch (err) {
      setError('Failed to connect bank')
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return

    try {
      const res = await fetch(`/api/admin/financial-connections/accounts/${accountId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchData()
      } else {
        setError('Failed to disconnect account')
      }
    } catch (err) {
      setError('Failed to disconnect')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>x</button>
        </div>
      )}

      {/* Connected Accounts */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Connected Accounts</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleSync()}
              disabled={syncing || accounts.length === 0}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #3f3f46',
                background: 'transparent',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                opacity: syncing || accounts.length === 0 ? 0.5 : 1
              }}
            >
              {syncing ? 'Syncing...' : 'Sync All'}
            </button>
            <button
              onClick={handleConnect}
              disabled={connecting}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                opacity: connecting ? 0.5 : 1
              }}
            >
              {connecting ? 'Connecting...' : '+ Connect Bank'}
            </button>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" style={{ margin: '0 auto 12px' }}>
              <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4zM8 14v3M12 14v3M16 14v3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ color: '#71717a', marginBottom: '8px' }}>No bank accounts connected</div>
            <div style={{ fontSize: '13px', color: '#52525b' }}>Connect a bank account to import transactions</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {accounts.map(account => (
              <div key={account.id} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{account.institutionName}</div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>
                      {account.accountType} {account.accountLast4 ? `****${account.accountLast4}` : ''}
                    </div>
                  </div>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: account.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: account.status === 'ACTIVE' ? '#10b981' : '#ef4444',
                    fontSize: '11px',
                    fontWeight: 500
                  }}>
                    {account.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '12px' }}>
                  {account._count.transactions} transactions
                  {account.lastSyncAt && ` - Last synced ${formatDate(account.lastSyncAt)}`}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSync(account.id)}
                    disabled={syncing}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #3f3f46',
                      background: 'transparent',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      flex: 1
                    }}
                  >
                    Sync
                  </button>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #ef4444',
                      background: 'transparent',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Transactions</h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'unmatched', 'matched'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setMatchedFilter(filter)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '4px',
                  border: matchedFilter === filter ? 'none' : '1px solid #3f3f46',
                  background: matchedFilter === filter ? '#3b82f6' : 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#71717a' }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#71717a' }}>
            No transactions found
          </div>
        ) : (
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 120px 100px', gap: '12px', padding: '12px 16px', background: '#0a0a0a', fontSize: '12px', color: '#71717a', textTransform: 'uppercase' }}>
              <div>Description</div>
              <div>Amount</div>
              <div>Date</div>
              <div>Account</div>
              <div>Matched</div>
            </div>

            {transactions.map(txn => (
              <div key={txn.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 120px 100px', gap: '12px', padding: '14px 16px', borderTop: '1px solid #27272a', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: '2px' }}>{txn.merchantName || txn.description || 'Transaction'}</div>
                  <div style={{ fontSize: '12px', color: '#71717a' }}>{txn.description}</div>
                </div>
                <div style={{ fontWeight: 600, color: txn.amount < 0 ? '#ef4444' : '#10b981' }}>
                  {formatCurrency(txn.amount)}
                </div>
                <div style={{ fontSize: '13px', color: '#a1a1aa' }}>{formatDate(txn.transactedAt)}</div>
                <div style={{ fontSize: '12px', color: '#71717a' }}>
                  {txn.financialAccount.institutionName}
                  {txn.financialAccount.accountLast4 && ` ****${txn.financialAccount.accountLast4}`}
                </div>
                <div>
                  {txn.matchedBillInstanceId ? (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(16,185,129,0.1)',
                      color: '#10b981',
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      Matched
                    </span>
                  ) : (
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(245,158,11,0.1)',
                      color: '#f59e0b',
                      fontSize: '11px',
                      fontWeight: 500
                    }}>
                      Unmatched
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
