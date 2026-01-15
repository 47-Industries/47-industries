'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Commission {
  id: string
  type: string
  baseAmount: number
  rate: number
  amount: number
  status: string
  createdAt: string
  lead: {
    id: string
    businessName: string
    leadNumber: string
  }
  payout?: {
    id: string
    payoutNumber: string
    status: string
    paidAt?: string
  }
}

interface Totals {
  total: number
  pending: number
}

export default function PartnerCommissionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/partner/commissions')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchCommissions()
    }
  }, [session, statusFilter])

  async function fetchCommissions() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      const res = await fetch(`/api/account/partner/commissions?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCommissions(data.commissions)
        setTotals(data.totals)
      } else if (res.status === 404) {
        router.push('/account/partner')
      }
    } catch (error) {
      console.error('Error fetching commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-500',
      APPROVED: 'bg-blue-500/20 text-blue-500',
      PAID: 'bg-green-500/20 text-green-500',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  const getTypeColor = (type: string) => {
    return type === 'FIRST_SALE' ? 'text-accent' : 'text-purple-500'
  }

  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'PAID', label: 'Paid' },
  ]

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
          <Link href="/account/partner" className="text-sm text-text-secondary hover:text-accent mb-2 inline-block">
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">My Commissions</h1>
        </div>

        {/* Stats */}
        {totals && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="p-5 border border-border rounded-xl bg-surface">
              <p className="text-sm text-text-secondary mb-1">Total Earned</p>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(totals.total)}</p>
            </div>
            <div className="p-5 border border-border rounded-xl bg-surface">
              <p className="text-sm text-text-secondary mb-1">Pending Payment</p>
              <p className="text-2xl font-bold text-yellow-500">{formatCurrency(totals.pending)}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-surface border border-border rounded-lg text-white"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Commissions List */}
        {commissions.length === 0 ? (
          <div className="border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary mb-2">No commissions found</p>
            <p className="text-sm text-text-secondary">
              Commissions are created when your leads convert to clients.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {commissions.map((commission) => (
                <div key={commission.id} className="p-5 hover:bg-surface/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{commission.lead.businessName}</h3>
                        <span className={`text-sm font-medium ${getTypeColor(commission.type)}`}>
                          {commission.type.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(commission.status)}`}>
                          {commission.status}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm">
                        {commission.rate}% of {formatCurrency(Number(commission.baseAmount))}
                      </p>
                      <p className="text-text-secondary text-xs mt-1">
                        {formatDate(commission.createdAt)}
                        {commission.payout && (
                          <>
                            {' '}| Payout: {commission.payout.payoutNumber}
                            {commission.payout.paidAt && ` (Paid ${formatDate(commission.payout.paidAt)})`}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-500">
                        {formatCurrency(Number(commission.amount))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
