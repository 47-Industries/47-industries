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

interface EditableItem {
  id?: string
  description: string
  quantity: number
  unitPrice: string
}

interface InvoicePayment {
  id: string
  amount: number
  method: string
  reference?: string
  notes?: string
  paidAt: string
  recordedBy: string
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
  amountPaid: number
  status: string
  dueDate?: string
  paidAt?: string
  sentAt?: string
  notes?: string
  internalNotes?: string
  stripePaymentId?: string
  paymentMethod?: string
  paymentReference?: string
  createdAt: string
  items: InvoiceItem[]
  payments?: InvoicePayment[]
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
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [recordingPayment, setRecordingPayment] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'BANK_TRANSFER',
    reference: '',
    notes: '',
    paidAt: new Date().toISOString().split('T')[0],
  })
  const { showToast } = useToast()
  const router = useRouter()

  // Edit form state
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerEmail: '',
    customerCompany: '',
    customerPhone: '',
    dueDate: '',
    notes: '',
    internalNotes: '',
    taxRate: '0',
    status: '',
  })
  const [editItems, setEditItems] = useState<EditableItem[]>([])

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
        // Initialize edit form
        setEditForm({
          customerName: data.invoice.customerName || '',
          customerEmail: data.invoice.customerEmail || '',
          customerCompany: data.invoice.customerCompany || '',
          customerPhone: data.invoice.customerPhone || '',
          dueDate: data.invoice.dueDate ? data.invoice.dueDate.split('T')[0] : '',
          notes: data.invoice.notes || '',
          internalNotes: data.invoice.internalNotes || '',
          taxRate: String(data.invoice.taxRate || 0),
          status: data.invoice.status,
        })
        setEditItems(data.invoice.items.map((item: InvoiceItem) => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: String(item.unitPrice),
        })))
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

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          taxRate: parseFloat(editForm.taxRate) || 0,
          items: editItems.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice) || 0,
          })),
        }),
      })
      if (res.ok) {
        showToast('Invoice updated!', 'success')
        setIsEditing(false)
        fetchInvoice()
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to update', 'error')
      }
    } catch (error) {
      showToast('Failed to update invoice', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        showToast('Invoice deleted', 'success')
        router.push('/admin/invoices')
      } else {
        showToast('Failed to delete', 'error')
      }
    } catch (error) {
      showToast('Failed to delete invoice', 'error')
    }
  }

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showToast('Please enter a valid amount', 'error')
      return
    }
    try {
      setRecordingPayment(true)
      const res = await fetch(`/api/admin/invoices/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          method: paymentForm.method,
          reference: paymentForm.reference || null,
          notes: paymentForm.notes || null,
          paidAt: paymentForm.paidAt,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.isFullyPaid ? 'Payment recorded - Invoice fully paid!' : 'Payment recorded', 'success')
        setInvoice(data.invoice)
        setShowPaymentForm(false)
        setPaymentForm({
          amount: '',
          method: 'BANK_TRANSFER',
          reference: '',
          notes: '',
          paidAt: new Date().toISOString().split('T')[0],
        })
      } else {
        showToast(data.error || 'Failed to record payment', 'error')
      }
    } catch (error) {
      showToast('Failed to record payment', 'error')
    } finally {
      setRecordingPayment(false)
    }
  }

  const getRemainingBalance = () => {
    if (!invoice) return 0
    return Number(invoice.total) - Number(invoice.amountPaid || 0)
  }

  const addItem = () => {
    setEditItems([...editItems, { description: '', quantity: 1, unitPrice: '' }])
  }

  const removeItem = (index: number) => {
    if (editItems.length > 1) {
      setEditItems(editItems.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof EditableItem, value: string | number) => {
    const newItems = [...editItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setEditItems(newItems)
  }

  const calculateSubtotal = () => {
    return editItems.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0
      return sum + (item.quantity * price)
    }, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * (parseFloat(editForm.taxRate) / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
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

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: '#0a0a0a',
    border: '1px solid #3f3f46',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    color: '#a1a1aa',
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
              {isEditing ? (
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  style={{
                    padding: '4px 12px',
                    background: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                  }}
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
                  <option value="VIEWED">VIEWED</option>
                  <option value="PAID">PAID</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              ) : (
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
              )}
            </div>
            <p style={{ margin: 0, color: '#71717a', fontSize: '14px' }}>
              Created {formatDate(invoice.createdAt)}
              {invoice.dueDate && !isEditing && ` | Due ${formatDate(invoice.dueDate)}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    // Reset form
                    setEditForm({
                      customerName: invoice.customerName || '',
                      customerEmail: invoice.customerEmail || '',
                      customerCompany: invoice.customerCompany || '',
                      customerPhone: invoice.customerPhone || '',
                      dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
                      notes: invoice.notes || '',
                      internalNotes: invoice.internalNotes || '',
                      taxRate: String(invoice.taxRate || 0),
                      status: invoice.status,
                    })
                    setEditItems(invoice.items.map((item) => ({
                      id: item.id,
                      description: item.description,
                      quantity: item.quantity,
                      unitPrice: String(item.unitPrice),
                    })))
                  }}
                  style={{
                    padding: '10px 20px',
                    background: '#27272a',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
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
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '10px 20px',
                    background: '#27272a',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  Edit
                </button>
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
              </>
            )}
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
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  type="text"
                  value={editForm.customerName}
                  onChange={(e) => setEditForm({ ...editForm, customerName: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  value={editForm.customerEmail}
                  onChange={(e) => setEditForm({ ...editForm, customerEmail: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Company</label>
                <input
                  type="text"
                  value={editForm.customerCompany}
                  onChange={(e) => setEditForm({ ...editForm, customerCompany: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  value={editForm.customerPhone}
                  onChange={(e) => setEditForm({ ...editForm, customerPhone: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#71717a' }}>AMOUNT</h2>
          <p style={{ margin: 0, fontSize: '32px', fontWeight: 700 }}>
            {isEditing ? formatCurrency(calculateTotal()) : formatCurrency(Number(invoice.total))}
          </p>
          {!isEditing && Number(invoice.amountPaid || 0) > 0 && Number(invoice.amountPaid || 0) < Number(invoice.total) && (
            <div style={{ marginTop: '8px' }}>
              <p style={{ margin: 0, color: '#f59e0b', fontSize: '14px' }}>
                Paid: {formatCurrency(Number(invoice.amountPaid))}
              </p>
              <p style={{ margin: '4px 0 0 0', color: '#ef4444', fontSize: '14px', fontWeight: 600 }}>
                Remaining: {formatCurrency(getRemainingBalance())}
              </p>
            </div>
          )}
          {isEditing && (
            <div style={{ marginTop: '16px' }}>
              <label style={labelStyle}>Due Date</label>
              <input
                type="date"
                value={editForm.dueDate}
                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                style={inputStyle}
              />
            </div>
          )}
          {!isEditing && invoice.status === 'PAID' && invoice.paidAt && (
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

      {/* Payments Section */}
      {!isEditing && invoice.status !== 'DRAFT' && (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#71717a' }}>PAYMENTS</h2>
            {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
              <button
                onClick={() => {
                  setPaymentForm({
                    ...paymentForm,
                    amount: getRemainingBalance().toFixed(2),
                  })
                  setShowPaymentForm(true)
                }}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Record Payment
              </button>
            )}
          </div>

          {/* Payment Form */}
          {showPaymentForm && (
            <div style={{
              background: '#0a0a0a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={getRemainingBalance()}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="0.00"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Payment Method *</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="ZELLE">Zelle</option>
                    <option value="CHECK">Check</option>
                    <option value="CASH">Cash</option>
                    <option value="WIRE">Wire Transfer</option>
                    <option value="STRIPE">Stripe</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Reference / Confirmation</label>
                  <input
                    type="text"
                    value={paymentForm.reference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                    placeholder="Check #, transaction ID, etc."
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Payment Date</label>
                  <input
                    type="date"
                    value={paymentForm.paidAt}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Notes</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="Optional notes about this payment"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#27272a',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  disabled={recordingPayment}
                  style={{
                    padding: '8px 16px',
                    background: '#10b981',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  {recordingPayment ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </div>
          )}

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#71717a', borderBottom: '1px solid #27272a' }}>DATE</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#71717a', borderBottom: '1px solid #27272a' }}>METHOD</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '12px', color: '#71717a', borderBottom: '1px solid #27272a' }}>REFERENCE</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: '12px', color: '#71717a', borderBottom: '1px solid #27272a' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>{formatDate(payment.paidAt)}</td>
                    <td style={{ padding: '10px 12px', fontSize: '14px' }}>
                      <span style={{
                        padding: '2px 8px',
                        background: '#27272a',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}>
                        {payment.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '14px', color: '#a1a1aa' }}>
                      {payment.reference || '-'}
                      {payment.notes && (
                        <span style={{ display: 'block', fontSize: '12px', color: '#71717a' }}>{payment.notes}</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '14px', textAlign: 'right', fontWeight: 500, color: '#10b981' }}>
                      {formatCurrency(Number(payment.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, borderTop: '1px solid #3f3f46' }}>Total Paid</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#10b981', borderTop: '1px solid #3f3f46' }}>
                    {formatCurrency(Number(invoice.amountPaid || 0))}
                  </td>
                </tr>
                {getRemainingBalance() > 0.01 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>Remaining Balance</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                      {formatCurrency(getRemainingBalance())}
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          ) : (
            <p style={{ margin: 0, color: '#71717a', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
              No payments recorded yet
            </p>
          )}
        </div>
      )}

      {/* Line Items */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: '20px',
      }}>
        {isEditing ? (
          <div style={{ padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#71717a' }}>LINE ITEMS</h2>
            {editItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {index === 0 && <label style={{ ...labelStyle, fontSize: '12px' }}>Description</label>}
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Service or product description"
                    style={inputStyle}
                  />
                </div>
                <div style={{ width: '80px' }}>
                  {index === 0 && <label style={{ ...labelStyle, fontSize: '12px' }}>Qty</label>}
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                </div>
                <div style={{ width: '120px' }}>
                  {index === 0 && <label style={{ ...labelStyle, fontSize: '12px' }}>Price</label>}
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    placeholder="0.00"
                    style={inputStyle}
                  />
                </div>
                <div style={{ width: '100px', textAlign: 'right' }}>
                  {index === 0 && <label style={{ ...labelStyle, fontSize: '12px' }}>Total</label>}
                  <div style={{ padding: '10px 0', fontWeight: 500 }}>
                    {formatCurrency(item.quantity * (parseFloat(item.unitPrice) || 0))}
                  </div>
                </div>
                <div style={{ paddingTop: index === 0 ? '24px' : '0' }}>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={editItems.length === 1}
                    style={{
                      padding: '8px',
                      background: 'transparent',
                      border: 'none',
                      color: editItems.length === 1 ? '#3f3f46' : '#ef4444',
                      cursor: editItems.length === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: '#27272a',
                border: 'none',
                borderRadius: '6px',
                color: '#a1a1aa',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '8px',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Line Item
            </button>

            {/* Totals */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '40px', marginBottom: '8px' }}>
                <span style={{ color: '#71717a' }}>Subtotal</span>
                <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '40px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#71717a' }}>Tax (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.taxRate}
                  onChange={(e) => setEditForm({ ...editForm, taxRate: e.target.value })}
                  style={{
                    width: '80px',
                    padding: '6px 10px',
                    background: '#0a0a0a',
                    border: '1px solid #3f3f46',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'right',
                  }}
                />
              </div>
              {parseFloat(editForm.taxRate) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '40px', marginBottom: '8px' }}>
                  <span style={{ color: '#71717a' }}>Tax Amount</span>
                  <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(calculateTax())}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '40px', fontSize: '18px', fontWeight: 600, paddingTop: '8px', borderTop: '1px solid #3f3f46' }}>
                <span>Total</span>
                <span style={{ width: '100px', textAlign: 'right' }}>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#71717a' }}>NOTES</h2>
          {isEditing ? (
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              rows={3}
              placeholder="Notes visible to customer..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          ) : (
            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
              {invoice.notes || 'No notes'}
            </p>
          )}
        </div>
        <div style={{
          background: '#18181b',
          border: '1px solid #f59e0b30',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#f59e0b' }}>INTERNAL NOTES</h2>
          {isEditing ? (
            <textarea
              value={editForm.internalNotes}
              onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
              rows={3}
              placeholder="Internal notes (not visible to customer)..."
              style={{ ...inputStyle, resize: 'vertical', borderColor: '#f59e0b30' }}
            />
          ) : (
            <p style={{ margin: 0, color: '#a1a1aa', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
              {invoice.internalNotes || 'No internal notes'}
            </p>
          )}
        </div>
      </div>

      {/* Delete Button */}
      {isEditing && (
        <div style={{ borderTop: '1px solid #27272a', paddingTop: '20px' }}>
          <button
            onClick={handleDelete}
            style={{
              padding: '10px 20px',
              background: '#dc262620',
              border: '1px solid #dc2626',
              borderRadius: '8px',
              color: '#ef4444',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Delete Invoice
          </button>
        </div>
      )}
    </div>
  )
}
