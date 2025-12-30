'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: string
}

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  inquiryId?: string
  customRequestId?: string
  customerName: string
  customerEmail: string
  customerCompany?: string
  customerPhone?: string
  onInvoiceCreated: (invoice: any) => void
}

export default function InvoiceModal({
  isOpen,
  onClose,
  inquiryId,
  customRequestId,
  customerName,
  customerEmail,
  customerCompany,
  customerPhone,
  onInvoiceCreated,
}: InvoiceModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unitPrice: '0.00' },
  ])
  const [taxRate, setTaxRate] = useState('0')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  useEffect(() => {
    if (isOpen) {
      // Set default due date to 30 days from now
      const defaultDueDate = new Date()
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      setDueDate(defaultDueDate.toISOString().split('T')[0])
    }
  }, [isOpen])

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: '0.00' }])
  }

  const removeItem = (index: number) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    setItems(newItems)
  }

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      return sum + (item.quantity * parseFloat(item.unitPrice || '0'))
    }, 0)
  }

  const calculateTax = () => {
    return calculateSubtotal() * (parseFloat(taxRate || '0') / 100)
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inquiryId,
          customRequestId,
          customerName,
          customerEmail,
          customerCompany,
          customerPhone,
          items,
          taxRate: parseFloat(taxRate),
          dueDate,
          notes,
          internalNotes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create invoice')
      }

      showToast('Invoice created successfully!', 'success')
      onInvoiceCreated(data.invoice)
      onClose()
    } catch (error: any) {
      console.error('Error creating invoice:', error)
      showToast(error.message || 'Failed to create invoice', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #27272a',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: '24px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>
          Create Invoice
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Customer Info */}
          <div style={{ marginBottom: '20px', padding: '16px', background: '#0a0a0a', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Customer Information</h3>
            <div style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.6' }}>
              <div><strong style={{ color: '#fff' }}>Name:</strong> {customerName}</div>
              <div><strong style={{ color: '#fff' }}>Email:</strong> {customerEmail}</div>
              {customerCompany && <div><strong style={{ color: '#fff' }}>Company:</strong> {customerCompany}</div>}
              {customerPhone && <div><strong style={{ color: '#fff' }}>Phone:</strong> {customerPhone}</div>}
            </div>
          </div>

          {/* Line Items */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600' }}>Line Items</h3>
              <button
                type="button"
                onClick={addItem}
                style={{
                  padding: '6px 12px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                + Add Item
              </button>
            </div>

            {items.map((item, index) => (
              <div key={index} style={{ marginBottom: '12px', padding: '12px', background: '#0a0a0a', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 40px', gap: '8px', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
                      Description
                    </label>
                    <input
                      type="text"
                      required
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000',
                        border: '1px solid #3f3f46',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                      }}
                      placeholder="Service or product description"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
                      Qty
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000',
                        border: '1px solid #3f3f46',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
                      Unit Price
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#000',
                        border: '1px solid #3f3f46',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    style={{
                      padding: '8px',
                      background: items.length === 1 ? '#27272a' : '#dc2626',
                      color: items.length === 1 ? '#71717a' : 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: items.length === 1 ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#a1a1aa', textAlign: 'right' }}>
                  Total: ${(item.quantity * parseFloat(item.unitPrice || '0')).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Tax and Totals */}
          <div style={{ marginBottom: '20px', padding: '16px', background: '#0a0a0a', borderRadius: '8px' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                style={{
                  width: '150px',
                  padding: '8px 12px',
                  background: '#000',
                  border: '1px solid #3f3f46',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '13px',
                }}
              />
            </div>

            <div style={{ fontSize: '14px', lineHeight: '2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a1a1aa' }}>Subtotal:</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>${calculateSubtotal().toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#a1a1aa' }}>Tax ({taxRate}%):</span>
                <span style={{ color: '#fff', fontWeight: '600' }}>${calculateTax().toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #27272a', marginTop: '8px' }}>
                <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Total:</span>
                <span style={{ color: '#3b82f6', fontWeight: '700', fontSize: '16px' }}>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: '200px',
                padding: '8px 12px',
                background: '#0a0a0a',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
              }}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
              Notes (visible to customer)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0a0a0a',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                resize: 'vertical',
              }}
              placeholder="Payment terms, additional information, etc."
            />
          </div>

          {/* Internal Notes */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
              Internal Notes (not visible to customer)
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#0a0a0a',
                border: '1px solid #3f3f46',
                borderRadius: '6px',
                color: 'white',
                fontSize: '13px',
                resize: 'vertical',
              }}
              placeholder="Internal notes for the team"
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#27272a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
