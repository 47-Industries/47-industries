'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BillingInfo {
  autopayEnabled: boolean
  stripeCustomerId?: string
  defaultPaymentMethod?: string
  paymentMethodDetails?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
}

export default function ClientBillingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [billing, setBilling] = useState<BillingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/client/billing')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchBillingInfo()
    }
  }, [session])

  async function fetchBillingInfo() {
    try {
      const res = await fetch('/api/account/client/billing')
      if (res.ok) {
        const data = await res.json()
        setBilling(data)
      }
    } catch (err) {
      console.error('Error fetching billing info:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleManagePayment() {
    setRedirecting(true)
    try {
      const res = await fetch('/api/account/client/billing/portal', {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        }
      }
    } catch (err) {
      console.error('Error creating portal session:', err)
      setRedirecting(false)
    }
  }

  async function handleToggleAutopay() {
    try {
      const res = await fetch('/api/account/client/billing/autopay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !billing?.autopayEnabled }),
      })
      if (res.ok) {
        fetchBillingInfo()
      }
    } catch (err) {
      console.error('Error toggling autopay:', err)
    }
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
          <Link href="/account/client" className="text-text-secondary hover:text-white text-sm mb-4 inline-block">
            Back to Client Portal
          </Link>
          <h1 className="text-3xl font-bold mb-2">Billing & Payment</h1>
          <p className="text-text-secondary">
            Manage your payment methods and billing preferences
          </p>
        </div>

        {/* Payment Method */}
        <div className="border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Payment Method</h2>
            <button
              onClick={handleManagePayment}
              disabled={redirecting}
              className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {redirecting ? 'Redirecting...' : billing?.stripeCustomerId ? 'Manage Payment' : 'Add Payment Method'}
            </button>
          </div>

          {billing?.paymentMethodDetails ? (
            <div className="flex items-center gap-4 p-4 bg-surface rounded-lg">
              <div className="w-12 h-8 bg-zinc-700 rounded flex items-center justify-center text-xs font-bold uppercase">
                {billing.paymentMethodDetails.brand}
              </div>
              <div>
                <p className="font-medium">
                  {billing.paymentMethodDetails.brand.toUpperCase()} ending in {billing.paymentMethodDetails.last4}
                </p>
                <p className="text-sm text-text-secondary">
                  Expires {billing.paymentMethodDetails.expMonth}/{billing.paymentMethodDetails.expYear}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-surface rounded-lg text-center">
              <p className="text-text-secondary">No payment method on file</p>
              <p className="text-sm text-text-secondary mt-1">
                Add a payment method to enable autopay and faster checkout
              </p>
            </div>
          )}
        </div>

        {/* Autopay Settings */}
        <div className="border border-border rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Autopay</h2>
              <p className="text-text-secondary text-sm">
                Automatically pay invoices when they are due
              </p>
            </div>
            <button
              onClick={handleToggleAutopay}
              disabled={!billing?.stripeCustomerId}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billing?.autopayEnabled ? 'bg-green-500' : 'bg-zinc-600'
              } ${!billing?.stripeCustomerId ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billing?.autopayEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {!billing?.stripeCustomerId && (
            <p className="text-sm text-yellow-500 mt-4">
              Add a payment method to enable autopay
            </p>
          )}

          {billing?.autopayEnabled && (
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-green-500 text-sm">
                Autopay is enabled. Your monthly invoices will be automatically charged to your saved payment method.
              </p>
            </div>
          )}
        </div>

        {/* Billing History Link */}
        <div className="border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Billing History</h2>
              <p className="text-text-secondary text-sm">
                View all your past and pending invoices
              </p>
            </div>
            <Link
              href="/account/client/invoices"
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:border-accent transition-colors"
            >
              View Invoices
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
