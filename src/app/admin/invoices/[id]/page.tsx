'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerCompany?: string
  customerPhone?: string
  subtotal: number
  taxRate: number
  taxAmount: number
  total: number
  status: string
  dueDate?: string
  paidAt?: string
  sentAt?: string
  notes?: string
  internalNotes?: string
  stripePaymentId?: string
  createdAt: string
  items: InvoiceItem[]
  client?: {
    id: string
    name: string
    clientNumber: string
  }
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const { showToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchInvoice()
  }, [id])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/invoices/${id}`)
      if (res.ok) {
        const data = await res.json()
        setInvoice(data.invoice)
      } else if (res.status === 404) {
        showToast('Invoice not found', 'error')
        router.push('/admin/invoices')
      }
    } catch (error) {
      console.error('Error fetching invoice:', error)
      showToast('Failed to load invoice', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!confirm('Send this invoice to the customer?')) return
    try {
      setSending(true)
      const res = await fetch(`/api/admin/invoices/${id}/send`, {
        method: 'POST',
      })
      if (res.ok) {
        showToast('Invoice sent!', 'success')
        fetchInvoice()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to send', 'error')
      }
    } catch (error) {
      showToast('Failed to send invoice', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleMarkPaid = async () => {
    if (!confirm('Mark this invoice as paid?')) return
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID', paidAt: new Date().toISOString() }),
      })
      if (res.ok) {
        showToast('Invoice marked as paid', 'success')
        fetchInvoice()
      }
    } catch (error) {
      showToast('Failed to update', 'error')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
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

  if (loading) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#71717a' }}>Loading invoice...</p>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div style={{ color: '#fff', textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ color: '#71717a' }}>Invoice not found</p>
      </div>
    )
  }

  return (
    <div style={{ color: '#fff', maxWidth: '900px' }}>
      {/* Back Link */}
      <Link
        href="/admin/invoices"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          color: '#71717a',
          textDecoration: 'none',
          fontSize: '14px',
          marginBottom: '16px',
        }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Invoices
      </Link>

      {/* Header */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, fontFamily: 'monospace' }}>
                {invoice.invoiceNumber}
              </h1>
              <span style={{
                padding: '4px 12px',
                background: `${getStatusColor(invoice.status)}20`,
                color: getStatusColor(invoice.status),
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
              }}>
                {invoice.status}
              </span>
            </div>
            <p style={{ margin: 0, color: '#71717a', fontSize: '14px' }}>
              Created {formatDate(invoice.createdAt)}
              {invoice.dueDate && ` | Due ${formatDate(invoice.dueDate)}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {invoice.status === 'DRAFT' && (
              <button
                onClick={handleSend}
                disabled={sending}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {sending ? 'Sending...' : 'Send Invoice'}
              </button>
            )}
            {['SENT', 'VIEWED', 'OVERDUE'].includes(invoice.status) && (
              <button
                onClick={handleMarkPaid}
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Mark as Paid
              </button>
            )}
            <Link
              href={`/invoice/${invoice.invoiceNumber}`}
              target="_blank"
              style={{
                padding: '10px 20px',
                background: '#27272a',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              View Public
            </Link>
          </div>
        </div>
      </div>

      {/* Customer & Amount */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#71717a' }}>BILL TO</h2>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '16px' }}>{invoice.customerName}</p>
          {invoice.customerCompany && (
            <p style={{ margin: '4px 0 0 0', color: '#a1a1aa' }}>{invoice.customerCompany}</p>
          )}
          <p style={{ margin: '4px 0 0 0', color: '#a1a1aa' }}>{invoice.customerEmail}</p>
          {invoice.customerPhone && (
            <p style={{ margin: '4px 0 0 0', color: '#a1a1aa' }}>{invoice.customerPhone}</p>
          )}
          {invoice.client && (
            <Link
              href={`/admin/clients/${invoice.client.id}`}
              style={{ display: 'inline-block', marginTop: '12px', color: '#3b82f6', fontSize: '13px' }}
            >
              View Client: {invoice.client.name}
            </Link>
          )}
        </div>

        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#71717a' }}>AMOUNT</h2>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>{formatCurrency(Number(invoice.total))}</p>
          {invoice.status === 'PAID' && invoice.paidAt && (
            <p style={{ margin: '8px 0 0 0', color: '#10b981', fontSize: '14px' }}>
              Paid on {formatDate(invoice.paidAt)}
            </p>
          )}
          {invoice.stripePaymentId && (
            <p style={{ margin: '4px 0 0 0', color: '#71717a', fontSize: '12px', fontFamily: 'monospace' }}>
              Stripe: {invoice.stripePaymentId}
            </p>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '20px',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0a0a0a' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>DESCRIPTION</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', color: '#71717a', fontWeight: 500, width: '80px' }}>QTY</th>
              <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', color: '#71717a', fontWeight: 500, width: '120px' }}>PRICE</th>
              <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', color: '#71717a', fontWeight: 500, width: '120px' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id} style={{ borderTop: '1px solid #27272a' }}>
                <td style={{ padding: '14px 16px' }}>{item.description}</td>
                <td style={{ padding: '14px 16px', textAlign: 'center', color: '#a1a1aa' }}>{item.quantity}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', color: '#a1a1aa' }}>{formatCurrency(Number(item.unitPrice))}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 500 }}>{formatCurrency(Number(item.total))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: '1px solid #27272a' }}>
              <td colSpan={3} style={{ padding: '12px 16px', textAlign: 'right', color: '#71717a' }}>Subtotal</td>
              <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(Number(invoice.subtotal))}</td>
            </tr>
            {Number(invoice.taxRate) > 0 && (
              <tr>
                <td colSpan={3} style={{ padding: '12px 16px', textAlign: 'right', color: '#71717a' }}>Tax ({invoice.taxRate}%)</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>{formatCurrency(Number(invoice.taxAmount))}</td>
              </tr>
            )}
            <tr style={{ borderTop: '1px solid #3f3f46' }}>
              <td colSpan={3} style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 600, fontSize: '16px' }}>Total</td>
              <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, fontSize: '18px' }}>{formatCurrency(Number(invoice.total))}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      {(invoice.notes || invoice.internalNotes) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {invoice.notes && (
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#71717a' }}>NOTES</h2>
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
            </div>
          )}
          {invoice.internalNotes && (
            <div style={{
              background: '#18181b',
              border: '1px solid #f59e0b30',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#f59e0b' }}>INTERNAL NOTES</h2>
              <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{invoice.internalNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
