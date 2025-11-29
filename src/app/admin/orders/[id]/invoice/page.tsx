'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  total: number
  sku?: string
}

interface Address {
  fullName: string
  company?: string
  address1: string
  address2?: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  status: string
  paymentStatus: string
  items: OrderItem[]
  shippingAddress?: Address
  createdAt: string
}

export default function InvoicePage() {
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<'invoice' | 'packing'>('invoice')

  useEffect(() => {
    // Get type from URL params
    const urlParams = new URLSearchParams(window.location.search)
    const docType = urlParams.get('type')
    if (docType === 'packing') setType('packing')
  }, [])

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/admin/orders/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setOrder(data)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading...
      </div>
    )
  }

  if (!order) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Order not found
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print-container {
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Print Controls */}
      <div className="no-print" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: '#18181b',
        borderBottom: '1px solid #27272a',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setType('invoice')}
            style={{
              padding: '8px 16px',
              background: type === 'invoice' ? '#3b82f6' : '#27272a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Invoice
          </button>
          <button
            onClick={() => setType('packing')}
            style={{
              padding: '8px 16px',
              background: type === 'packing' ? '#3b82f6' : '#27272a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Packing Slip
          </button>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href={`/admin/orders/${order.id}`}
            style={{
              padding: '8px 16px',
              background: '#27272a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            Back to Order
          </a>
          <button
            onClick={handlePrint}
            style={{
              padding: '8px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Print {type === 'invoice' ? 'Invoice' : 'Packing Slip'}
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="print-container" style={{
        maxWidth: '800px',
        margin: '80px auto 40px',
        padding: '40px',
        background: 'white',
        color: '#000',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '40px',
          paddingBottom: '20px',
          borderBottom: '2px solid #000',
        }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>
              47 Industries
            </h1>
            <p style={{ color: '#666', margin: '4px 0 0 0', fontSize: '14px' }}>
              47industries.com
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, margin: 0, textTransform: 'uppercase' }}>
              {type === 'invoice' ? 'Invoice' : 'Packing Slip'}
            </h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              <strong>Order #:</strong> {order.orderNumber}
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
              <strong>Date:</strong> {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          marginBottom: '40px',
        }}>
          <div>
            <h3 style={{
              fontSize: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#666',
              margin: '0 0 8px 0',
            }}>
              Bill To
            </h3>
            <p style={{ margin: 0, fontWeight: 500 }}>{order.customerName}</p>
            <p style={{ margin: '4px 0 0 0', color: '#333' }}>{order.customerEmail}</p>
            {order.customerPhone && (
              <p style={{ margin: '4px 0 0 0', color: '#333' }}>{order.customerPhone}</p>
            )}
          </div>

          {order.shippingAddress && (
            <div>
              <h3 style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#666',
                margin: '0 0 8px 0',
              }}>
                Ship To
              </h3>
              <p style={{ margin: 0, fontWeight: 500 }}>{order.shippingAddress.fullName}</p>
              {order.shippingAddress.company && (
                <p style={{ margin: '4px 0 0 0', color: '#333' }}>{order.shippingAddress.company}</p>
              )}
              <p style={{ margin: '4px 0 0 0', color: '#333' }}>{order.shippingAddress.address1}</p>
              {order.shippingAddress.address2 && (
                <p style={{ margin: '4px 0 0 0', color: '#333' }}>{order.shippingAddress.address2}</p>
              )}
              <p style={{ margin: '4px 0 0 0', color: '#333' }}>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p style={{ margin: '4px 0 0 0', color: '#333' }}>{order.shippingAddress.country}</p>
            </div>
          )}
        </div>

        {/* Items Table */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '40px',
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', textTransform: 'uppercase' }}>
                Item
              </th>
              {type === 'packing' && (
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', textTransform: 'uppercase' }}>
                  SKU
                </th>
              )}
              <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '12px', textTransform: 'uppercase' }}>
                Qty
              </th>
              {type === 'invoice' && (
                <>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', textTransform: 'uppercase' }}>
                    Price
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', textTransform: 'uppercase' }}>
                    Total
                  </th>
                </>
              )}
              {type === 'packing' && (
                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: '12px', textTransform: 'uppercase', width: '80px' }}>
                  Packed
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '12px 8px' }}>{item.name}</td>
                {type === 'packing' && (
                  <td style={{ padding: '12px 8px', color: '#666' }}>{item.sku || '-'}</td>
                )}
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>{item.quantity}</td>
                {type === 'invoice' && (
                  <>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      ${Number(item.price).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                      ${Number(item.total).toFixed(2)}
                    </td>
                  </>
                )}
                {type === 'packing' && (
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #000',
                      margin: '0 auto',
                    }} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals (Invoice Only) */}
        {type === 'invoice' && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}>
            <div style={{ width: '250px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #ddd',
              }}>
                <span>Subtotal</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid #ddd',
                  color: '#10b981',
                }}>
                  <span>Discount</span>
                  <span>-${Number(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #ddd',
              }}>
                <span>Shipping</span>
                <span>${Number(order.shipping).toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid #ddd',
              }}>
                <span>Tax</span>
                <span>${Number(order.tax).toFixed(2)}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                fontWeight: 700,
                fontSize: '18px',
              }}>
                <span>Total</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: '60px',
          paddingTop: '20px',
          borderTop: '1px solid #ddd',
          textAlign: 'center',
          color: '#666',
          fontSize: '12px',
        }}>
          <p style={{ margin: 0 }}>Thank you for your order!</p>
          <p style={{ margin: '8px 0 0 0' }}>
            47 Industries | 47industries.com | support@47industries.com
          </p>
        </div>
      </div>
    </>
  )
}
