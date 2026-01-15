'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface Client {
  id: string
  name: string
  email: string
  clientNumber: string
  contacts: Array<{ name: string; email: string; isPrimary: boolean }>
}

interface LineItem {
  description: string
  quantity: number
  unitPrice: string
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientIdParam = searchParams.get('clientId')
  const { showToast } = useToast()

  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState(clientIdParam || '')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerCompany, setCustomerCompany] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unitPrice: '' }])
  const [taxRate, setTaxRate] = useState('0')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringDay, setRecurringDay] = useState('1')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (selectedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === selectedClientId)
      if (client) {
        const primary = client.contacts?.find(c => c.isPrimary) || client.contacts?.[0]
        setCustomerName(primary?.name || client.name)
        setCustomerEmail(primary?.email || client.email)
        setCustomerCompany(client.name)
      }
    }
  }, [selectedClientId, clients])

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/admin/clients')
      if (res.ok) {
        const data = await res.json()
        setClients(data.clients || [])
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: '' }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.unitPrice) || 0
      return sum + (item.quantity * price)
    }, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * (parseFloat(taxRate) / 100)
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

  const handleSubmit = async (e: React.FormEvent, sendImmediately: boolean = false) => {
    e.preventDefault()

    if (!customerName || !customerEmail || items.some(i => !i.description || !i.unitPrice)) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    try {
      setSaving(true)
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId || null,
          customerName,
          customerEmail,
          customerCompany,
          customerPhone,
          items: items.map(i => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
          taxRate: parseFloat(taxRate),
          dueDate: dueDate || null,
          notes,
          internalNotes,
          isRecurring,
          recurringDay: isRecurring ? parseInt(recurringDay) : null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        showToast('Invoice created!', 'success')

        if (sendImmediately) {
          // Send the invoice
          await fetch(`/api/admin/invoices/${data.invoice.id}/send`, { method: 'POST' })
          showToast('Invoice sent!', 'success')
        }

        router.push(`/admin/invoices/${data.invoice.id}`)
      } else {
        const data = await res.json()
        showToast(data.error || 'Failed to create invoice', 'error')
      }
    } catch (error) {
      showToast('Failed to create invoice', 'error')
    } finally {
      setSaving(false)
    }
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

      <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 24px 0' }}>Create Invoice</h1>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* Client Selection */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Customer</h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>
              Link to Client (optional)
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
              }}
            >
              <option value="">-- No Client --</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.clientNumber})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>
                Customer Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>
                Email *
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>
                Company
              </label>
              <input
                type="text"
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>
                Phone
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Line Items</h2>

          {items.map((item, index) => (
            <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                {index === 0 && <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#71717a' }}>Description</label>}
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                  placeholder="Service or product description"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ width: '80px' }}>
                {index === 0 && <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#71717a' }}>Qty</label>}
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                />
              </div>
              <div style={{ width: '120px' }}>
                {index === 0 && <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#71717a' }}>Price</label>}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ width: '100px', textAlign: 'right' }}>
                {index === 0 && <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: '#71717a' }}>Total</label>}
                <div style={{ padding: '10px 0', fontWeight: 500 }}>
                  {formatCurrency(item.quantity * (parseFloat(item.unitPrice) || 0))}
                </div>
              </div>
              <div style={{ paddingTop: index === 0 ? '24px' : '0' }}>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  style={{
                    padding: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: items.length === 1 ? '#3f3f46' : '#ef4444',
                    cursor: items.length === 1 ? 'not-allowed' : 'pointer',
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
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                style={{
                  width: '80px',
                  padding: '6px 10px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                  textAlign: 'right',
                }}
              />
            </div>
            {parseFloat(taxRate) > 0 && (
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

        {/* Settings */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Settings</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#0a0a0a',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  style={{ accentColor: '#3b82f6' }}
                />
                Set as Recurring Monthly
              </label>
              {isRecurring && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#71717a' }}>Bill on day</span>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={recurringDay}
                    onChange={(e) => setRecurringDay(e.target.value)}
                    style={{
                      width: '60px',
                      padding: '6px 10px',
                      background: '#0a0a0a',
                      border: '1px solid #27272a',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '14px',
                      textAlign: 'center',
                    }}
                  />
                  <span style={{ fontSize: '13px', color: '#71717a' }}>of each month</span>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#a1a1aa' }}>
              Notes (visible to customer)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Thank you for your business!"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: '#f59e0b' }}>
              Internal Notes (not visible to customer)
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={2}
              placeholder="Notes for your team..."
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0a0a0a',
                border: '1px solid #f59e0b30',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Link
            href="/admin/invoices"
            style={{
              padding: '12px 24px',
              background: '#27272a',
              borderRadius: '8px',
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: '#27272a',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={saving}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save & Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
