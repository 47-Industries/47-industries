'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: string
  total: string
}

interface Invoice {
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerCompany: string | null
  customerPhone: string | null
  items: InvoiceItem[]
  subtotal: string
  taxRate: string
  taxAmount: string
  total: string
  status: string
  dueDate: string | null
  paidAt: string | null
  notes: string | null
  stripePaymentLink: string | null
  createdAt: string
  inquiry: {
    inquiryNumber: string
    serviceType: string
    description: string
  } | null
  customRequest: {
    requestNumber: string
    material: string
    finish: string
    color: string
    quantity: number
  } | null
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string; printBg: string }> = {
  DRAFT: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Draft', printBg: '#6b7280' },
  SENT: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Sent', printBg: '#3b82f6' },
  VIEWED: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Viewed', printBg: '#8b5cf6' },
  PAID: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Paid', printBg: '#10b981' },
  CANCELLED: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Cancelled', printBg: '#ef4444' },
  OVERDUE: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Overdue', printBg: '#f59e0b' },
}

export default function InvoiceViewPage() {
  const params = useParams()
  const invoiceNumber = params.invoiceNumber as string

  const [loading, setLoading] = useState(true)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchInvoice() {
      if (!invoiceNumber) {
        setError('No invoice number provided')
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/invoice/${invoiceNumber}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Invoice not found. Please check the invoice number and try again.')
          } else {
            setError('Failed to load invoice. Please try again later.')
          }
          setLoading(false)
          return
        }

        const data = await res.json()
        setInvoice(data.invoice)
      } catch (err) {
        console.error('Error fetching invoice:', err)
        setError('Failed to load invoice. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [invoiceNumber])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Invoice Not Found</h1>
            <p className="text-text-secondary mb-8">{error}</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const statusStyle = STATUS_COLORS[invoice.status] || STATUS_COLORS.DRAFT
  const isPaid = invoice.status === 'PAID'
  const isCancelled = invoice.status === 'CANCELLED'

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          /* Reset page */
          @page {
            size: letter;
            margin: 0.4in 0.5in;
          }

          /* Hide non-printable elements */
          .no-print,
          nav,
          footer,
          header,
          .print-hidden {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            overflow: hidden !important;
          }

          /* Force color printing */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Reset body and html */
          html, body {
            background: white !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Main container reset */
          .min-h-screen {
            min-height: 0 !important;
            padding: 0 !important;
          }

          /* Invoice container */
          .invoice-container {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }

          .invoice-container > div {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .invoice-card {
            background: white !important;
            border: 1px solid #d1d5db !important;
            border-radius: 6px !important;
            overflow: visible !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }

          /* Header section */
          .invoice-card > div:first-child {
            border-bottom: 1px solid #d1d5db !important;
            padding: 16px 20px !important;
          }

          /* Typography - force black text */
          h1, h2, h3, h4, h5, h6, p, span, td, th, div, a {
            color: #000 !important;
          }

          /* Secondary text - gray */
          .text-text-secondary,
          .text-text-muted,
          [class*="text-text-secondary"],
          [class*="text-text-muted"] {
            color: #4b5563 !important;
          }

          /* Accent color for total */
          .text-accent,
          [class*="text-accent"] {
            color: #2563eb !important;
          }

          /* Green text */
          .text-green-400,
          .text-green-500,
          [class*="text-green"] {
            color: #059669 !important;
          }

          /* Red text */
          .text-red-400,
          .text-red-500,
          [class*="text-red"] {
            color: #dc2626 !important;
          }

          /* Table styling */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            font-size: 11px !important;
          }

          thead tr {
            border-bottom: 2px solid #9ca3af !important;
          }

          th {
            color: #374151 !important;
            font-weight: 600 !important;
            padding: 8px 4px !important;
            font-size: 10px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }

          tbody tr {
            border-bottom: 1px solid #e5e7eb !important;
          }

          td {
            padding: 10px 4px !important;
            vertical-align: top !important;
          }

          /* Status badge */
          .status-badge {
            display: inline-block !important;
            padding: 2px 10px !important;
            border-radius: 12px !important;
            font-size: 10px !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
          }

          /* Status colors */
          .status-badge.bg-blue-500\\/20 {
            background: #dbeafe !important;
            color: #1d4ed8 !important;
          }
          .status-badge.bg-green-500\\/20 {
            background: #dcfce7 !important;
            color: #15803d !important;
          }
          .status-badge.bg-purple-500\\/20 {
            background: #f3e8ff !important;
            color: #7c3aed !important;
          }
          .status-badge.bg-orange-500\\/20 {
            background: #ffedd5 !important;
            color: #c2410c !important;
          }
          .status-badge.bg-red-500\\/20 {
            background: #fee2e2 !important;
            color: #dc2626 !important;
          }
          .status-badge.bg-gray-500\\/20 {
            background: #f3f4f6 !important;
            color: #374151 !important;
          }

          /* Logo */
          .print-logo {
            filter: none !important;
            max-width: 48px !important;
            max-height: 48px !important;
          }

          /* Section backgrounds */
          .bg-surface,
          .bg-surface-elevated,
          [class*="bg-surface"] {
            background: #f9fafb !important;
          }

          /* Border colors */
          .border-border,
          [class*="border-border"] {
            border-color: #d1d5db !important;
          }

          /* Padding adjustments for print */
          .p-6, .p-8, .md\\:p-8 {
            padding: 16px 20px !important;
          }

          /* Paid stamp section */
          .paid-stamp,
          .bg-green-500\\/10 {
            background: #dcfce7 !important;
            border-top: 2px solid #10b981 !important;
          }

          /* Cancelled section */
          .bg-red-500\\/10 {
            background: #fee2e2 !important;
            border-top: 2px solid #ef4444 !important;
          }

          /* Totals section */
          .border-t-2 {
            border-top: 2px solid #9ca3af !important;
          }

          /* Font sizes */
          .text-2xl, .text-3xl {
            font-size: 18px !important;
          }

          .text-xl {
            font-size: 14px !important;
          }

          .text-lg {
            font-size: 13px !important;
          }

          .text-sm {
            font-size: 11px !important;
          }

          .text-xs {
            font-size: 10px !important;
          }

          /* Font mono */
          .font-mono {
            font-family: 'Courier New', Courier, monospace !important;
          }

          /* Spacing */
          .gap-6 {
            gap: 12px !important;
          }

          .gap-4 {
            gap: 8px !important;
          }

          .mb-6, .mt-6 {
            margin-top: 12px !important;
            margin-bottom: 12px !important;
          }

          .mb-8, .mt-8 {
            margin-top: 16px !important;
            margin-bottom: 16px !important;
          }

          /* Grid layouts */
          .md\\:grid-cols-2 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
          }

          /* Flex layouts */
          .md\\:flex-row {
            flex-direction: row !important;
          }

          .md\\:justify-between {
            justify-content: space-between !important;
          }

          .md\\:justify-end {
            justify-content: flex-end !important;
          }

          .md\\:text-right {
            text-align: right !important;
          }

          /* Prevent page breaks inside sections */
          .invoice-card > div {
            page-break-inside: avoid !important;
          }

          /* Width for totals */
          .md\\:w-72 {
            width: 200px !important;
          }

          /* Invoice number styling */
          h1 {
            font-size: 20px !important;
            font-weight: 700 !important;
          }

          /* Company name */
          h2 {
            font-size: 16px !important;
          }

          /* SVG icons */
          svg {
            print-color-adjust: exact !important;
          }

          .w-12.h-12 {
            width: 36px !important;
            height: 36px !important;
          }

          .w-6.h-6 {
            width: 18px !important;
            height: 18px !important;
          }

          /* Rounded backgrounds for icons */
          .bg-green-500\\/20,
          .bg-red-500\\/20 {
            border-radius: 50% !important;
          }

          .bg-green-500\\/20 {
            background: #dcfce7 !important;
          }

          .bg-red-500\\/20 {
            background: #fee2e2 !important;
          }
        }
      `}</style>

      <div className="min-h-screen py-8 md:py-12 print:py-0 print:min-h-0">
        <div className="container mx-auto px-6 print:px-0 invoice-container">
          <div className="max-w-4xl mx-auto">
            {/* Action Buttons - Hidden on Print */}
            <div className="flex justify-end gap-3 mb-6 no-print">
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 bg-surface border border-border rounded-lg text-sm font-medium hover:bg-surface-elevated transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Invoice
              </button>
            </div>

            {/* Invoice Card */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden invoice-card print:bg-white">
              {/* Header with Logo */}
              <div className="p-6 md:p-8 border-b border-border">
                <div className="flex flex-col md:flex-row md:justify-between gap-6">
                  {/* Company Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 flex-shrink-0 print:w-14 print:h-14">
                      <Image
                        src="/logo.png"
                        alt="47 Industries"
                        width={64}
                        height={64}
                        className="w-full h-full object-contain print-logo"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold mb-2">47 Industries</h2>
                      <div className="text-text-secondary text-sm space-y-0.5">
                        <p>Digital Solutions & 3D Printing</p>
                        <p>contact@47industries.com</p>
                        <p>47industries.com</p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="md:text-right">
                    <div className="flex items-center gap-3 mb-2 md:justify-end">
                      <h1 className="text-2xl md:text-3xl font-bold">INVOICE</h1>
                      <span
                        className={`status-badge px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.text}`}
                        style={{ ['--print-color' as string]: statusStyle.printBg }}
                      >
                        {statusStyle.label}
                      </span>
                    </div>
                    <p className="font-mono text-lg font-semibold mb-3">{invoice.invoiceNumber}</p>
                    <div className="text-sm space-y-1">
                      <div className="flex md:justify-end gap-2">
                        <span className="text-text-secondary">Issued:</span>
                        <span className="font-medium">{new Date(invoice.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}</span>
                      </div>
                      {invoice.dueDate && (
                        <div className="flex md:justify-end gap-2">
                          <span className="text-text-secondary">Due:</span>
                          <span className="font-medium">{new Date(invoice.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To Section */}
              <div className="p-6 md:p-8 border-b border-border bg-surface-elevated/30 print:bg-gray-50">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-text-secondary text-sm font-medium uppercase tracking-wide mb-2">Bill To</p>
                    <p className="font-semibold text-lg">{invoice.customerName}</p>
                    {invoice.customerCompany && (
                      <p className="text-text-secondary">{invoice.customerCompany}</p>
                    )}
                    <p className="text-text-secondary text-sm mt-1">{invoice.customerEmail}</p>
                    {invoice.customerPhone && (
                      <p className="text-text-secondary text-sm">{invoice.customerPhone}</p>
                    )}
                  </div>

                  {/* Related Request/Inquiry */}
                  {(invoice.inquiry || invoice.customRequest) && (
                    <div>
                      <p className="text-text-secondary text-sm font-medium uppercase tracking-wide mb-2">Reference</p>
                      {invoice.inquiry && (
                        <div>
                          <p className="font-medium">Service Inquiry</p>
                          <p className="font-mono text-sm text-text-secondary">{invoice.inquiry.inquiryNumber}</p>
                          <p className="text-sm text-text-secondary capitalize mt-1">
                            {invoice.inquiry.serviceType.replace(/_/g, ' ').toLowerCase()}
                          </p>
                        </div>
                      )}
                      {invoice.customRequest && (
                        <div>
                          <p className="font-medium">3D Print Request</p>
                          <p className="font-mono text-sm text-text-secondary">{invoice.customRequest.requestNumber}</p>
                          <p className="text-sm text-text-secondary mt-1">
                            {invoice.customRequest.quantity}x {invoice.customRequest.material} ({invoice.customRequest.finish})
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Line Items */}
              <div className="p-6 md:p-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left pb-4 text-text-secondary font-semibold text-sm uppercase tracking-wide">Description</th>
                      <th className="text-center pb-4 text-text-secondary font-semibold text-sm uppercase tracking-wide w-20">Qty</th>
                      <th className="text-right pb-4 text-text-secondary font-semibold text-sm uppercase tracking-wide w-28">Unit Price</th>
                      <th className="text-right pb-4 text-text-secondary font-semibold text-sm uppercase tracking-wide w-28">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="border-b border-border/50">
                        <td className="py-4 pr-4">{item.description}</td>
                        <td className="py-4 text-center text-text-secondary">{item.quantity}</td>
                        <td className="py-4 text-right text-text-secondary">
                          ${parseFloat(item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 text-right font-medium">
                          ${parseFloat(item.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-6 pt-6 border-t-2 border-border">
                  <div className="flex justify-end">
                    <div className="w-full md:w-72 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary">Subtotal</span>
                        <span>${parseFloat(invoice.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                      {parseFloat(invoice.taxRate) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-text-secondary">Tax ({invoice.taxRate}%)</span>
                          <span>${parseFloat(invoice.taxAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t-2 border-border">
                        <span className="text-lg font-bold">Total Due</span>
                        <span className="text-2xl font-bold text-accent">
                          ${parseFloat(invoice.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <p className="text-text-secondary text-sm font-medium uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment Section - Hidden on Print */}
              {!isPaid && !isCancelled && invoice.stripePaymentLink && (
                <div className="p-6 md:p-8 border-t border-border bg-surface-elevated/50 no-print">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">Ready to pay?</h3>
                      <p className="text-text-secondary text-sm">
                        Secure payment powered by Stripe. All major credit cards accepted.
                      </p>
                    </div>
                    <a
                      href={invoice.stripePaymentLink}
                      className="inline-flex items-center justify-center px-8 py-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors text-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Pay ${parseFloat(invoice.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </a>
                  </div>
                </div>
              )}

              {/* Paid Confirmation */}
              {isPaid && (
                <div className="p-6 md:p-8 border-t border-border bg-green-500/10 paid-stamp print:bg-green-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 print:bg-green-100">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-400 print:text-green-600">PAID</h3>
                      <p className="text-text-secondary text-sm">
                        Payment received on {invoice.paidAt && new Date(invoice.paidAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled Notice */}
              {isCancelled && (
                <div className="p-6 md:p-8 border-t border-border bg-red-500/10 print:bg-red-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 print:bg-red-100">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-red-400 print:text-red-600">CANCELLED</h3>
                      <p className="text-text-secondary text-sm">
                        This invoice has been cancelled and is no longer payable.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer - Payment Instructions for Print */}
              <div className="p-6 md:p-8 border-t border-border bg-surface-elevated/30 print:bg-gray-50">
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <p className="font-semibold mb-2">Payment Information</p>
                    <p className="text-text-secondary">
                      Pay online at: <span className="font-mono">47industries.com/invoice/{invoice.invoiceNumber}</span>
                    </p>
                    <p className="text-text-secondary mt-1">
                      Or contact us at contact@47industries.com
                    </p>
                  </div>
                  <div className="md:text-right">
                    <p className="font-semibold mb-2">47 Industries</p>
                    <p className="text-text-secondary">
                      Web Development, App Development & 3D Printing Services
                    </p>
                    <p className="text-text-secondary mt-1">
                      47industries.com
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Links - Hidden on Print */}
            <div className="mt-8 text-center no-print">
              <p className="text-text-secondary text-sm mb-4">
                Questions about this invoice?{' '}
                <Link href="/contact" className="text-accent hover:underline">
                  Contact us
                </Link>
              </p>
              <Link
                href="/"
                className="inline-flex items-center text-text-secondary hover:text-white transition-colors text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to 47 Industries
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
