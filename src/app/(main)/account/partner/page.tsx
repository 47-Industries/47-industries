'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ReferredProject {
  id: string
  name: string
  type?: string
  status: string
  contractValue?: number
  monthlyRecurring?: number
  createdAt: string
  client: { id: string; name: string }
}

interface Partner {
  id: string
  partnerNumber: string
  name: string
  email: string
  company?: string
  firstSaleRate: number
  recurringRate: number
  status: string
  totalEarned: number
  pendingAmount: number
  totalPaid: number
  leadStats: Record<string, number>
  leads: Lead[]
  commissions: Commission[]
  payouts: Payout[]
  referredProjects: ReferredProject[]
  stripeConnectId?: string
  stripeConnectStatus?: string
  contract?: {
    id: string
    title: string
    status: string
    signedAt?: string
  }
}

interface Lead {
  id: string
  leadNumber: string
  businessName: string
  status: string
  createdAt: string
}

interface Commission {
  id: string
  type: string
  amount: number
  status: string
  createdAt: string
  lead: { businessName: string; leadNumber: string }
}

interface Payout {
  id: string
  payoutNumber: string
  amount: number
  status: string
  paidAt?: string
}

export default function PartnerDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/partner')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchPartnerData()
    }
  }, [session])

  async function fetchPartnerData() {
    try {
      setLoading(true)
      const res = await fetch('/api/account/partner')
      if (res.ok) {
        const data = await res.json()
        setPartner(data.partner)
      } else if (res.status === 404) {
        setError('not_partner')
      }
    } catch (error) {
      console.error('Error fetching partner data:', error)
      setError('error')
    } finally {
      setLoading(false)
    }
  }

  async function setupStripeConnect() {
    setStripeConnectLoading(true)
    try {
      const res = await fetch('/api/account/partner/stripe-connect', {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok && data.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = data.onboardingUrl
      } else {
        alert(data.error || 'Failed to setup Stripe Connect')
      }
    } catch (error) {
      console.error('Error setting up Stripe Connect:', error)
      alert('Failed to setup Stripe Connect')
    } finally {
      setStripeConnectLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
      NEW: 'bg-blue-500/20 text-blue-500',
      CONTACTED: 'bg-purple-500/20 text-purple-500',
      QUALIFIED: 'bg-yellow-500/20 text-yellow-500',
      CONVERTED: 'bg-green-500/20 text-green-500',
      LOST: 'bg-red-500/20 text-red-500',
      PENDING: 'bg-yellow-500/20 text-yellow-500',
      APPROVED: 'bg-blue-500/20 text-blue-500',
      PAID: 'bg-green-500/20 text-green-500',
      ACTIVE: 'bg-green-500/20 text-green-500',
      IN_PROGRESS: 'bg-blue-500/20 text-blue-500',
      COMPLETED: 'bg-green-500/20 text-green-500',
      ON_HOLD: 'bg-yellow-500/20 text-yellow-500',
      CANCELLED: 'bg-red-500/20 text-red-500',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (error === 'not_partner') {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Partner Portal</h1>
            <p className="text-text-secondary mb-6">
              Your account is not associated with a partner profile.
            </p>
            <Link
              href="/account"
              className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Back to Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!partner) {
    return null
  }

  const totalLeads = Object.values(partner.leadStats).reduce((a, b) => a + b, 0)
  const convertedLeads = partner.leadStats['CONVERTED'] || 0

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/account" className="text-sm text-text-secondary hover:text-accent mb-2 inline-block">
              Back to Account
            </Link>
            <h1 className="text-3xl font-bold">Partner Dashboard</h1>
            <p className="text-text-secondary">
              {partner.name} | {partner.partnerNumber}
            </p>
          </div>
          <Link
            href="/account/partner/leads/new"
            className="px-5 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors font-medium"
          >
            Submit New Lead
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 border border-border rounded-xl bg-surface">
            <p className="text-sm text-text-secondary mb-1">Total Earned</p>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(partner.totalEarned)}</p>
          </div>
          <div className="p-5 border border-border rounded-xl bg-surface">
            <p className="text-sm text-text-secondary mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">{formatCurrency(partner.pendingAmount)}</p>
          </div>
          <div className="p-5 border border-border rounded-xl bg-surface">
            <p className="text-sm text-text-secondary mb-1">Paid Out</p>
            <p className="text-2xl font-bold">{formatCurrency(partner.totalPaid)}</p>
          </div>
          <div className="p-5 border border-border rounded-xl bg-surface">
            <p className="text-sm text-text-secondary mb-1">Leads</p>
            <p className="text-2xl font-bold text-accent">{totalLeads}</p>
            <p className="text-xs text-text-secondary">{convertedLeads} converted</p>
          </div>
        </div>

        {/* Commission Rates */}
        <div className="p-5 border border-border rounded-xl bg-surface mb-8">
          <h2 className="font-semibold mb-3">Your Commission Rates</h2>
          <div className="flex gap-8">
            <div>
              <p className="text-sm text-text-secondary">First Sale</p>
              <p className="text-xl font-bold text-accent">{partner.firstSaleRate}%</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Recurring</p>
              <p className="text-xl font-bold text-purple-500">{partner.recurringRate}%</p>
            </div>
          </div>
        </div>

        {/* Stripe Connect for Payouts */}
        <div className="p-5 border border-border rounded-xl bg-surface mb-8">
          <h2 className="font-semibold mb-2">Payout Setup</h2>
          <p className="text-sm text-text-secondary mb-4">
            Connect your bank account to receive commission payouts directly via Stripe.
          </p>

          {!partner.stripeConnectId ? (
            <div className="p-6 border border-dashed border-border rounded-lg text-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#635bff" className="mx-auto mb-4">
                <rect x="3" y="4" width="18" height="14" rx="2" strokeWidth="1.5" />
                <path d="M3 10h18" strokeWidth="1.5" />
                <path d="M7 15h4" strokeWidth="1.5" />
              </svg>
              <p className="font-medium mb-2">Connect Your Bank Account</p>
              <p className="text-sm text-text-secondary mb-4">
                Set up direct deposit to receive your commission payouts automatically.
              </p>
              <button
                onClick={setupStripeConnect}
                disabled={stripeConnectLoading}
                className="px-5 py-2.5 bg-[#635bff] text-white rounded-lg hover:bg-[#635bff]/90 transition-colors font-medium disabled:opacity-50"
              >
                {stripeConnectLoading ? 'Setting up...' : 'Connect with Stripe'}
              </button>
            </div>
          ) : partner.stripeConnectStatus === 'CONNECTED' ? (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-500">Bank Account Connected</p>
                  <p className="text-sm text-text-secondary">
                    You're all set to receive payouts directly to your bank account.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                    <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-500">Setup Incomplete</p>
                    <p className="text-sm text-text-secondary">
                      Please complete your Stripe onboarding to receive payouts.
                    </p>
                  </div>
                </div>
                <button
                  onClick={setupStripeConnect}
                  disabled={stripeConnectLoading}
                  className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-500/90 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {stripeConnectLoading ? 'Loading...' : 'Complete Setup'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Referred Projects */}
        {partner.referredProjects && partner.referredProjects.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden mb-8">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold">Your Referred Projects</h2>
              <p className="text-sm text-text-secondary">Projects where you are credited as the referral source</p>
            </div>
            <div className="divide-y divide-border">
              {partner.referredProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/account/partner/projects/${project.id}`}
                  className="block p-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-text-secondary">
                        Client: {project.client.name}
                        {project.type && ` | ${project.type}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      {project.contractValue && (
                        <div className="text-right">
                          <p className="text-xs text-text-secondary">Commission</p>
                          <p className="font-semibold text-green-500">
                            {formatCurrency(Number(project.contractValue) * (partner.firstSaleRate / 100))}
                          </p>
                        </div>
                      )}
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-text-secondary">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {/* Summary */}
            <div className="p-4 bg-green-500/5 border-t border-green-500/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-text-secondary">Total Potential First Sale Commission</p>
                  <p className="text-xl font-bold text-green-500">
                    {formatCurrency(
                      partner.referredProjects.reduce((sum, p) => {
                        return sum + (Number(p.contractValue || 0) * (partner.firstSaleRate / 100))
                      }, 0)
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-secondary">Total Contract Value</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(
                      partner.referredProjects.reduce((sum, p) => sum + Number(p.contractValue || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Link
            href="/account/partner/affiliate"
            className="p-5 border border-accent/50 bg-accent/5 rounded-xl hover:border-accent transition-colors group"
          >
            <h3 className="font-semibold group-hover:text-accent transition-colors">Affiliate Links</h3>
            <p className="text-sm text-text-secondary">Earn on shop orders</p>
          </Link>
          <Link
            href="/account/partner/leads"
            className="p-5 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <h3 className="font-semibold group-hover:text-accent transition-colors">My Leads</h3>
            <p className="text-sm text-text-secondary">View and manage leads</p>
          </Link>
          <Link
            href="/account/partner/commissions"
            className="p-5 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <h3 className="font-semibold group-hover:text-accent transition-colors">Commissions</h3>
            <p className="text-sm text-text-secondary">View commission history</p>
          </Link>
          <Link
            href="/account/partner/payouts"
            className="p-5 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <h3 className="font-semibold group-hover:text-accent transition-colors">Payouts</h3>
            <p className="text-sm text-text-secondary">View payout history</p>
          </Link>
          <Link
            href="/account/partner/contract"
            className="p-5 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <h3 className="font-semibold group-hover:text-accent transition-colors">Contract</h3>
            <p className="text-sm text-text-secondary">View your agreement</p>
          </Link>
        </div>

        {/* Recent Leads */}
        <div className="border border-border rounded-xl overflow-hidden mb-8">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Recent Leads</h2>
            <Link href="/account/partner/leads" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          {partner.leads.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-text-secondary mb-4">No leads submitted yet</p>
              <Link
                href="/account/partner/leads/new"
                className="inline-block px-5 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Submit Your First Lead
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {partner.leads.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-surface/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{lead.businessName}</p>
                      <p className="text-sm text-text-secondary">{lead.leadNumber}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                      <span className="text-sm text-text-secondary">{formatDate(lead.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Commissions */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Recent Commissions</h2>
            <Link href="/account/partner/commissions" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          {partner.commissions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-text-secondary">No commissions earned yet</p>
              <p className="text-sm text-text-secondary mt-1">
                Submit leads and earn commissions when they convert!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {partner.commissions.map((commission) => (
                <div key={commission.id} className="p-4 hover:bg-surface/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{commission.lead.businessName}</p>
                      <p className="text-sm text-text-secondary">
                        {commission.type.replace('_', ' ')} | {commission.lead.leadNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(commission.status)}`}>
                        {commission.status}
                      </span>
                      <span className="font-semibold text-green-500">{formatCurrency(Number(commission.amount))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
