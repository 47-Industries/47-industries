'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  status: string
  dueDate?: string
  paidAt?: string
  createdAt: string
}

export default function ClientInvoicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/client/invoices')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchInvoices()
    }
  }, [session])

  async function fetchInvoices() {
    try {
      const res = await fetch('/api/account/client/invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices)
      }
    } catch (err) {
      console.error('Error fetching invoices:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
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
      PAID: 'bg-green-500/20 text-green-500',
      SENT: 'bg-blue-500/20 text-blue-500',
      VIEWED: 'bg-purple-500/20 text-purple-500',
      OVERDUE: 'bg-red-500/20 text-red-500',
      DRAFT: 'bg-gray-500/20 text-gray-500',
      CANCELLED: 'bg-gray-500/20 text-gray-500',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'pending') return ['SENT', 'VIEWED', 'OVERDUE'].includes(inv.status)
    if (filter === 'paid') return inv.status === 'PAID'
    return true
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account/client" className="text-text-secondary hover:text-white text-sm mb-4 inline-block">
            Back to Client Portal
          </Link>
          <h1 className="text-3xl font-bold mb-2">Invoices</h1>
          <p className="text-text-secondary">
            View and pay your invoices
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'pending', 'paid'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-accent text-white'
                  : 'bg-surface hover:bg-surface-hover text-text-secondary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Invoices List */}
        {filteredInvoices.length === 0 ? (
          <div className="border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary mb-4">No invoices found</p>
            <Link
              href="/account/client"
              className="text-accent hover:underline"
            >
              Back to dashboard
            </Link>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
            {filteredInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/invoice/${invoice.invoiceNumber}`}
                className="block p-6 hover:bg-surface transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-medium text-lg">{invoice.invoiceNumber}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <span className="font-bold text-xl">{formatCurrency(Number(invoice.total))}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-text-secondary">
                  <span>Created {formatDate(invoice.createdAt)}</span>
                  {invoice.status === 'PAID' && invoice.paidAt ? (
                    <span className="text-green-500">Paid {formatDate(invoice.paidAt)}</span>
                  ) : invoice.dueDate ? (
                    <span className={invoice.status === 'OVERDUE' ? 'text-red-500' : ''}>
                      Due {formatDate(invoice.dueDate)}
                    </span>
                  ) : null}
                </div>
                {['SENT', 'VIEWED', 'OVERDUE'].includes(invoice.status) && (
                  <div className="mt-4">
                    <span className="inline-flex items-center px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium">
                      Pay Now
                    </span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
