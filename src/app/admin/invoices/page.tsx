'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerCompany?: string
  total: number
  status: string
  dueDate?: string
  paidAt?: string
  createdAt: string
  client?: {
    id: string
    name: string
    clientNumber: string
  }
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [filter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.set('status', filter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/invoices?${params}`)
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInvoices()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: '#6b7280',
      SENT: '#3b82f6',
      VIEWED: '#8b5cf6',
      PAID: '#10b981',
      OVERDUE: '#ef4444',
      CANCELLED: '#6b7280',
    }
    return colors[status] || '#6b7280'
  }

  const stats = {
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'PAID').length,
    pending: invoices.filter(i => ['SENT', 'VIEWED'].includes(i.status)).length,
    overdue: invoices.filter(i => i.status === 'OVERDUE').length,
    totalRevenue: invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + Number(i.total), 0),
    outstanding: invoices.filter(i => ['SENT', 'VIEWED', 'OVERDUE'].includes(i.status)).reduce((sum, i) => sum + Number(i.total), 0),
  }

  return (
    <div style={{ color: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Invoices</h1>
          <p style={{ color: '#71717a', margin: '4px 0 0 0', fontSize: '14px' }}>
            Manage invoices and track payments
          </p>
        </div>
        <Link
          href="/admin/invoices/create"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>Total Revenue</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>Outstanding</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
            {formatCurrency(stats.outstanding)}
          </p>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>Paid</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: '#fff' }}>
            {stats.paid}
          </p>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ margin: 0, color: '#71717a', fontSize: '13px' }}>Overdue</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: 700, color: stats.overdue > 0 ? '#ef4444' : '#fff' }}>
            {stats.overdue}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleSearch} style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices..."
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#0a0a0a',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </form>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'DRAFT', 'SENT', 'PAID', 'OVERDUE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 16px',
                background: filter === status ? '#3b82f6' : '#27272a',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {status === 'all' ? 'All' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#71717a', margin: '0 0 16px 0' }}>No invoices found</p>
            <Link
              href="/admin/invoices/create"
              style={{ color: '#3b82f6', textDecoration: 'none' }}
            >
              Create your first invoice
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0a0a0a', borderBottom: '1px solid #27272a' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>INVOICE</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>CUSTOMER</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>STATUS</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>DATE</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  style={{ borderBottom: '1px solid #27272a', cursor: 'pointer' }}
                  onClick={() => window.location.href = `/admin/invoices/${invoice.id}`}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontWeight: 500, fontFamily: 'monospace' }}>{invoice.invoiceNumber}</span>
                    {invoice.client && (
                      <span style={{ marginLeft: '8px', fontSize: '12px', color: '#71717a' }}>
                        {invoice.client.name}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 500 }}>{invoice.customerName}</div>
                    <div style={{ fontSize: '13px', color: '#71717a' }}>{invoice.customerEmail}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      background: `${getStatusColor(invoice.status)}20`,
                      color: getStatusColor(invoice.status),
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>
                      {invoice.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#a1a1aa', fontSize: '14px' }}>
                    {formatDate(invoice.createdAt)}
                    {invoice.dueDate && (
                      <div style={{ fontSize: '12px', color: '#71717a' }}>
                        Due: {formatDate(invoice.dueDate)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600 }}>
                    {formatCurrency(Number(invoice.total))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
