'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
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

interface AffiliateLink {
  id: string
  name: string | null
  code: string
  url: string
  platform: string
  clicks: number
  createdAt: string
}

interface AffiliateReferral {
  id: string
  platform: string
  eventType: string
  orderId: string | null
  customerEmail: string | null
  orderTotal: number | null
  createdAt: string
  commission?: { amount: number; status: string } | null
}

interface AffiliateCommission {
  id: string
  type: string
  amount: number
  status: string
  createdAt: string
  referral?: { platform: string; eventType: string } | null
}

interface Partner {
  id: string
  partnerNumber: string
  name: string
  email: string
  phone?: string
  company?: string
  partnerType: 'SERVICE_REFERRAL' | 'PRODUCT_AFFILIATE' | 'BOTH'
  firstSaleRate: number
  recurringRate: number
  shopCommissionRate?: number
  motorevProBonus?: number
  affiliateCode?: string
  status: string
  totalEarned: number
  pendingAmount: number
  totalPaid: number
  affiliateTotalEarned: number
  affiliatePendingAmount: number
  totalClicks: number
  leadStats: Record<string, number>
  affiliateReferralStats: Record<string, number>
  leads: Lead[]
  commissions: Commission[]
  payouts: Payout[]
  referredProjects: ReferredProject[]
  affiliateLinks: AffiliateLink[]
  affiliateReferrals: AffiliateReferral[]
  affiliateCommissions: AffiliateCommission[]
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

function PartnerDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stripeConnectLoading, setStripeConnectLoading] = useState(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)
  const [phoneInput, setPhoneInput] = useState('')
  const [phoneSaving, setPhoneSaving] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [stripeStatusMessage, setStripeStatusMessage] = useState('')

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

  // Check Stripe status after returning from onboarding
  useEffect(() => {
    const stripeSuccess = searchParams.get('stripe_success')
    const stripeRefresh = searchParams.get('stripe_refresh')

    if (stripeSuccess === 'true' || stripeRefresh === 'true') {
      // Remove query params from URL
      router.replace('/account/partner', { scroll: false })
      // Check Stripe status
      checkStripeStatus()
    }
  }, [searchParams])

  async function checkStripeStatus() {
    try {
      setStripeStatusMessage('Verifying payout setup...')
      const res = await fetch('/api/account/partner/stripe-connect')
      if (res.ok) {
        const data = await res.json()
        if (data.connected) {
          setStripeStatusMessage('Payout setup complete!')
          // Refresh partner data to get updated status
          fetchPartnerData()
          setTimeout(() => setStripeStatusMessage(''), 5000)
        } else if (data.detailsSubmitted && !data.payoutsEnabled) {
          // User completed onboarding but Stripe is still verifying
          setStripeStatusMessage('Submitted! Stripe is verifying your info. This usually takes 1-2 business days.')
          fetchPartnerData()
          setTimeout(() => setStripeStatusMessage(''), 10000)
        } else if (data.status === 'PENDING') {
          setStripeStatusMessage('Setup incomplete. Please complete all required steps.')
          setTimeout(() => setStripeStatusMessage(''), 5000)
        } else {
          setStripeStatusMessage('')
        }
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error)
      setStripeStatusMessage('')
    }
  }

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
        window.location.href = data.onboardingUrl
      } else if (data.code === 'PHONE_REQUIRED') {
        // Phone number required - show modal
        setPhoneInput(partner?.phone || '')
        setShowPhoneModal(true)
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

  async function savePhone() {
    if (!phoneInput.trim()) {
      setPhoneError('Phone number is required')
      return
    }

    const digitsOnly = phoneInput.replace(/\D/g, '')
    if (digitsOnly.length < 10) {
      setPhoneError('Please enter a valid phone number with at least 10 digits')
      return
    }

    setPhoneSaving(true)
    setPhoneError('')

    try {
      const res = await fetch('/api/account/partner', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneInput }),
      })
      const data = await res.json()

      if (res.ok) {
        // Update local state
        setPartner(prev => prev ? { ...prev, phone: phoneInput } : null)
        setShowPhoneModal(false)
        // Now try Stripe Connect again
        setupStripeConnect()
      } else {
        setPhoneError(data.error || 'Failed to save phone number')
      }
    } catch (error) {
      console.error('Error saving phone:', error)
      setPhoneError('Failed to save phone number')
    } finally {
      setPhoneSaving(false)
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
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  const canDoServiceReferrals = partner?.partnerType === 'SERVICE_REFERRAL' || partner?.partnerType === 'BOTH'
  const canDoAffiliate = partner?.partnerType === 'PRODUCT_AFFILIATE' || partner?.partnerType === 'BOTH'

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

  if (error || !partner) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-text-secondary mb-6">
              Unable to load partner dashboard. Please try again.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                Try Again
              </button>
              <Link
                href="/account"
                className="px-6 py-3 bg-surface border border-border text-white rounded-lg hover:bg-surface-elevated transition-colors"
              >
                Back to Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalLeads = Object.values(partner.leadStats).reduce((a, b) => a + b, 0)
  const convertedLeads = partner.leadStats['CONVERTED'] || 0
  const totalServiceEarnings = partner.totalEarned
  const totalAffiliateEarnings = partner.affiliateTotalEarned
  const grandTotalEarnings = totalServiceEarnings + totalAffiliateEarnings
  const grandTotalPending = partner.pendingAmount + partner.affiliatePendingAmount

  // Affiliate stats
  const shopOrders = (partner.affiliateReferralStats?.['SHOP_ORDER'] || 0)
  const motorevSignups = (partner.affiliateReferralStats?.['MOTOREV_SIGNUP'] || 0)
  const motorevProConversions = (partner.affiliateReferralStats?.['MOTOREV_PRO_CONVERSION'] || 0)

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header with Partner Type Badge */}
        <div className="mb-8">
          <Link href="/account" className="text-sm text-text-secondary hover:text-accent mb-2 inline-flex items-center gap-1">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Account
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">Partner Dashboard</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  partner.partnerType === 'BOTH'
                    ? 'bg-purple-500/20 text-purple-400'
                    : partner.partnerType === 'SERVICE_REFERRAL'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {partner.partnerType === 'BOTH' ? 'Full Partner' : partner.partnerType === 'SERVICE_REFERRAL' ? 'Service Referral' : 'Product Affiliate'}
                </span>
              </div>
              <p className="text-text-secondary">
                Welcome back, {partner.name}! <span className="text-text-secondary/70">({partner.partnerNumber})</span>
              </p>
            </div>
            <div className="flex gap-3">
              {canDoServiceReferrals && (
                <Link
                  href="/account/partner/leads/new"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Submit Lead
                </Link>
              )}
              {canDoAffiliate && (
                <Link
                  href="/account/partner/affiliate"
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Get Affiliate Links
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Total Earnings Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 border border-border rounded-xl bg-gradient-to-br from-green-500/10 to-transparent">
            <p className="text-sm text-text-secondary mb-1">Total Earned</p>
            <p className="text-3xl font-bold text-green-500">{formatCurrency(grandTotalEarnings)}</p>
            <p className="text-xs text-text-secondary mt-1">All-time earnings</p>
          </div>
          <div className="p-5 border border-border rounded-xl bg-surface">
            <p className="text-sm text-text-secondary mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-500">{formatCurrency(grandTotalPending)}</p>
            <p className="text-xs text-text-secondary mt-1">Awaiting approval</p>
          </div>
          <div className="p-5 border border-border rounded-xl bg-surface">
            <p className="text-sm text-text-secondary mb-1">Paid Out</p>
            <p className="text-2xl font-bold">{formatCurrency(partner.totalPaid)}</p>
            <p className="text-xs text-text-secondary mt-1">Received</p>
          </div>
          <div className="p-5 border border-border rounded-xl bg-surface">
            <p className="text-sm text-text-secondary mb-1">Payout Status</p>
            {stripeStatusMessage ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-blue-400 text-sm">{stripeStatusMessage}</span>
              </div>
            ) : partner.stripeConnectStatus === 'CONNECTED' ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-green-500 font-medium">Ready</span>
              </div>
            ) : partner.stripeConnectStatus === 'PENDING_VERIFICATION' ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"></div>
                <span className="text-yellow-500 text-sm">Verifying</span>
              </div>
            ) : (
              <button
                onClick={setupStripeConnect}
                disabled={stripeConnectLoading}
                className="text-sm text-accent hover:underline"
              >
                {stripeConnectLoading ? 'Loading...' : 'Setup Payouts'}
              </button>
            )}
          </div>
        </div>

        {/* How to Earn Money Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">How You Can Earn Money</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Service Referrals Card */}
            {canDoServiceReferrals && (
              <div className="border border-blue-500/30 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500/5 to-transparent">
                <div className="p-5 border-b border-blue-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <svg width="20" height="20" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Service Referrals</h3>
                        <p className="text-sm text-text-secondary">Refer clients for our services</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-500">{formatCurrency(totalServiceEarnings)}</p>
                      <p className="text-xs text-text-secondary">earned</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-surface/50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">{partner.firstSaleRate}%</p>
                      <p className="text-xs text-text-secondary">First Sale</p>
                    </div>
                    <div className="text-center p-3 bg-surface/50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-400">{partner.recurringRate}%</p>
                      <p className="text-xs text-text-secondary">Recurring</p>
                    </div>
                    <div className="text-center p-3 bg-surface/50 rounded-lg">
                      <p className="text-2xl font-bold">{totalLeads}</p>
                      <p className="text-xs text-text-secondary">Leads</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-text-secondary">Refer clients for:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm">Web Development</span>
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm">App Development</span>
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm">3D Printing</span>
                    </div>
                  </div>
                  <Link
                    href="/account/partner/leads/new"
                    className="block w-full text-center py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Submit a New Lead
                  </Link>
                </div>
              </div>
            )}

            {/* Affiliate Sales Card */}
            {canDoAffiliate && (
              <div className="border border-green-500/30 rounded-xl overflow-hidden bg-gradient-to-br from-green-500/5 to-transparent">
                <div className="p-5 border-b border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <svg width="20" height="20" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Affiliate Sales</h3>
                        <p className="text-sm text-text-secondary">Share links, earn commissions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-500">{formatCurrency(totalAffiliateEarnings)}</p>
                      <p className="text-xs text-text-secondary">earned</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-surface/50 rounded-lg">
                      <p className="text-2xl font-bold text-green-400">{partner.shopCommissionRate || 5}%</p>
                      <p className="text-xs text-text-secondary">Shop Sales</p>
                    </div>
                    <div className="text-center p-3 bg-surface/50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-400">${partner.motorevProBonus || 2.5}</p>
                      <p className="text-xs text-text-secondary">Pro Bonus</p>
                    </div>
                    <div className="text-center p-3 bg-surface/50 rounded-lg">
                      <p className="text-2xl font-bold">{partner.totalClicks}</p>
                      <p className="text-xs text-text-secondary">Clicks</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-text-secondary">Earn from:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-sm">Shop Orders ({shopOrders})</span>
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-sm">MotoRev Pro ({motorevProConversions})</span>
                    </div>
                  </div>
                  {partner.affiliateCode ? (
                    <div className="mb-4 p-3 bg-surface rounded-lg">
                      <p className="text-xs text-text-secondary mb-1">Your Affiliate Code</p>
                      <p className="font-mono text-lg font-bold text-green-400">{partner.affiliateCode}</p>
                    </div>
                  ) : null}
                  <Link
                    href="/account/partner/affiliate"
                    className="block w-full text-center py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Manage Affiliate Links
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {canDoServiceReferrals && (
            <Link
              href="/account/partner/leads"
              className="p-4 border border-border rounded-xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors group text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-semibold text-sm">My Leads</h3>
              <p className="text-xs text-text-secondary">{totalLeads} total</p>
            </Link>
          )}
          {canDoAffiliate && (
            <Link
              href="/account/partner/affiliate"
              className="p-4 border border-border rounded-xl hover:border-green-500/50 hover:bg-green-500/5 transition-colors group text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                <svg width="20" height="20" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="font-semibold text-sm">Affiliate Links</h3>
              <p className="text-xs text-text-secondary">{partner.affiliateLinks?.length || 0} links</p>
            </Link>
          )}
          <Link
            href="/account/partner/commissions"
            className="p-4 border border-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-colors group text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <svg width="20" height="20" fill="none" stroke="currentColor" className="text-accent" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm">Commissions</h3>
            <p className="text-xs text-text-secondary">View history</p>
          </Link>
          <Link
            href="/account/partner/payouts"
            className="p-4 border border-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-colors group text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <svg width="20" height="20" fill="none" stroke="currentColor" className="text-accent" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm">Payouts</h3>
            <p className="text-xs text-text-secondary">{formatCurrency(partner.totalPaid)} paid</p>
          </Link>
          <Link
            href="/account/partner/contract"
            className="p-4 border border-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-colors group text-center"
          >
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
              <svg width="20" height="20" fill="none" stroke="currentColor" className="text-accent" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-sm">Contract</h3>
            <p className="text-xs text-text-secondary">{partner.contract?.status || 'View'}</p>
          </Link>
        </div>

        {/* Payout Setup Banner - if not connected */}
        {partner.stripeConnectStatus !== 'CONNECTED' && partner.stripeConnectStatus !== 'PENDING_VERIFICATION' && (
          <div className="p-5 border border-yellow-500/30 rounded-xl bg-yellow-500/5 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <svg width="24" height="24" fill="none" stroke="#eab308" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-500">Setup Required: Connect Your Bank Account</h3>
                  <p className="text-sm text-text-secondary">
                    Connect via Stripe to receive your commission payouts directly to your bank account.
                  </p>
                </div>
              </div>
              <button
                onClick={setupStripeConnect}
                disabled={stripeConnectLoading}
                className="px-5 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors font-medium whitespace-nowrap disabled:opacity-50"
              >
                {stripeConnectLoading ? 'Loading...' : 'Connect Bank Account'}
              </button>
            </div>
          </div>
        )}

        {/* Verification in Progress Banner */}
        {partner.stripeConnectStatus === 'PENDING_VERIFICATION' && (
          <div className="p-5 border border-blue-500/30 rounded-xl bg-blue-500/5 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24" className="animate-spin">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-400">Verification in Progress</h3>
                <p className="text-sm text-text-secondary">
                  Stripe is reviewing your information. This usually takes 1-2 business days. You&apos;ll be able to receive payouts once verified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Referred Projects */}
        {canDoServiceReferrals && partner.referredProjects && partner.referredProjects.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden mb-8">
            <div className="p-5 border-b border-border bg-blue-500/5">
              <h2 className="font-semibold">Your Referred Projects</h2>
              <p className="text-sm text-text-secondary">Projects where you earn commissions</p>
            </div>
            <div className="divide-y divide-border">
              {partner.referredProjects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  href={`/account/partner/projects/${project.id}`}
                  className="block p-4 hover:bg-surface/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-text-secondary">
                        {project.client.name} {project.type && `| ${project.type}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      {project.contractValue && (
                        <span className="font-semibold text-green-500">
                          {formatCurrency(Number(project.contractValue) * (partner.firstSaleRate / 100))}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Leads */}
          {canDoServiceReferrals && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold">Recent Leads</h2>
                <Link href="/account/partner/leads" className="text-sm text-accent hover:underline">
                  View all
                </Link>
              </div>
              {partner.leads.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-text-secondary mb-3">No leads submitted yet</p>
                  <Link
                    href="/account/partner/leads/new"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Submit Your First Lead
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {partner.leads.slice(0, 4).map((lead) => (
                    <div key={lead.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{lead.businessName}</p>
                          <p className="text-xs text-text-secondary">{formatDate(lead.createdAt)}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Affiliate Activity */}
          {canDoAffiliate && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold">Recent Affiliate Activity</h2>
                <Link href="/account/partner/affiliate" className="text-sm text-accent hover:underline">
                  View all
                </Link>
              </div>
              {(!partner.affiliateReferrals || partner.affiliateReferrals.length === 0) ? (
                <div className="p-6 text-center">
                  <p className="text-text-secondary mb-3">No affiliate activity yet</p>
                  <Link
                    href="/account/partner/affiliate"
                    className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Get Your Affiliate Links
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {partner.affiliateReferrals.slice(0, 4).map((referral) => (
                    <div key={referral.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              referral.platform === 'MOTOREV' ? 'bg-purple-500/20 text-purple-400' : 'bg-green-500/20 text-green-400'
                            }`}>
                              {referral.platform === 'MOTOREV' ? 'MotoRev' : 'Shop'}
                            </span>
                            <span className="text-sm">
                              {referral.eventType === 'ORDER' ? 'Order' : referral.eventType === 'PRO_CONVERSION' ? 'Pro Conversion' : 'Signup'}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary mt-1">{formatDate(referral.createdAt)}</p>
                        </div>
                        {referral.commission && (
                          <span className="font-semibold text-green-500 text-sm">
                            +{formatCurrency(referral.commission.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recent Commissions - show for all */}
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Recent Commissions</h2>
              <Link href="/account/partner/commissions" className="text-sm text-accent hover:underline">
                View all
              </Link>
            </div>
            {partner.commissions.length === 0 && (!partner.affiliateCommissions || partner.affiliateCommissions.length === 0) ? (
              <div className="p-6 text-center">
                <p className="text-text-secondary">No commissions earned yet</p>
                <p className="text-sm text-text-secondary mt-1">
                  {canDoServiceReferrals ? 'Submit leads and ' : ''}
                  {canDoAffiliate ? 'share affiliate links to ' : ''}
                  earn commissions!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {/* Service commissions */}
                {partner.commissions.slice(0, 3).map((commission) => (
                  <div key={`service-${commission.id}`} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-500/20 text-blue-400">
                            Service
                          </span>
                          <span className="font-medium text-sm">{commission.lead.businessName}</span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{commission.type.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-green-500">{formatCurrency(Number(commission.amount))}</span>
                        <span className={`block text-xs px-2 py-0.5 rounded mt-1 ${getStatusColor(commission.status)}`}>
                          {commission.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Affiliate commissions */}
                {partner.affiliateCommissions?.slice(0, 3).map((commission) => (
                  <div key={`affiliate-${commission.id}`} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-500/20 text-green-400">
                            Affiliate
                          </span>
                          <span className="font-medium text-sm">
                            {commission.type === 'SHOP_ORDER' ? 'Shop Order' : 'MotoRev Pro'}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{formatDate(commission.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-green-500">{formatCurrency(Number(commission.amount))}</span>
                        <span className={`block text-xs px-2 py-0.5 rounded mt-1 ${getStatusColor(commission.status)}`}>
                          {commission.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-2">Phone Number Required</h2>
            <p className="text-text-secondary text-sm mb-4">
              Please enter your phone number to set up payouts. Stripe will send verification codes to this number during setup.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
              />
              {phoneError && (
                <p className="text-red-500 text-sm mt-2">{phoneError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePhone}
                disabled={phoneSaving}
                className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {phoneSaving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap in Suspense for useSearchParams
export default function PartnerDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    }>
      <PartnerDashboardContent />
    </Suspense>
  )
}
