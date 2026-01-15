'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Payout {
  id: string
  payoutNumber: string
  amount: number
  method?: string
  reference?: string
  status: string
  paidAt?: string
  createdAt: string
  commissions: {
    id: string
    amount: number
    type: string
  }[]
}

interface Totals {
  totalPaid: number
  pending: number
}

export default function PartnerPayoutsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/partner/payouts')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchPayouts()
    }
  }, [session])

  async function fetchPayouts() {
    try {
      setLoading(true)
      const res = await fetch('/api/account/partner/payouts')
      if (res.ok) {
        const data = await res.json()
        setPayouts(data.payouts)
        setTotals(data.totals)
      } else if (res.status === 404) {
        router.push('/account/partner')
      }
    } catch (error) {
      console.error('Error fetching payouts:', error)
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
    return status === 'PAID' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'
  }

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
          <h1 className="text-3xl font-bold">My Payouts</h1>
        </div>

        {/* Stats */}
        {totals && (
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="p-5 border border-border rounded-xl bg-surface">
              <p className="text-sm text-text-secondary mb-1">Total Paid</p>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(totals.totalPaid)}</p>
            </div>
            <div className="p-5 border border-border rounded-xl bg-surface">
              <p className="text-sm text-text-secondary mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-500">{formatCurrency(totals.pending)}</p>
            </div>
          </div>
        )}

        {/* Payouts List */}
        {payouts.length === 0 ? (
          <div className="border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary mb-2">No payouts yet</p>
            <p className="text-sm text-text-secondary">
              Payouts are created when your approved commissions are processed for payment.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {payouts.map((payout) => (
                <div key={payout.id} className="p-5 hover:bg-surface/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{payout.payoutNumber}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                        {payout.method && (
                          <span className="text-sm text-text-secondary">
                            via {payout.method}
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm">
                        {payout.commissions.length} commission{payout.commissions.length !== 1 ? 's' : ''} included
                      </p>
                      <p className="text-text-secondary text-xs mt-1">
                        Created {formatDate(payout.createdAt)}
                        {payout.paidAt && ` | Paid ${formatDate(payout.paidAt)}`}
                        {payout.reference && ` | Ref: ${payout.reference}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{formatCurrency(Number(payout.amount))}</p>
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
