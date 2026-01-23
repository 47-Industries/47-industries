'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Loading...</p>
      </div>
    </div>
  )
}

function RequestAccessContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'partner'

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    website: '',
    socialMedia: '',
    audience: '',
    reason: '',
  })

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        name: session.user.name || '',
        email: session.user.email || '',
      }))
    }
  }, [session])

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/mobile/connect'
    }
  }, [status])

  const programInfo = {
    partner: {
      title: 'Partner Program',
      subtitle: 'Services Partner Application',
      description: 'Join our Partner Program to earn cash commissions for referring clients to our web development, app development, and 3D printing services.',
      benefits: [
        'Up to 15% commission on referred service contracts',
        'Priority support and dedicated account manager',
        'Early access to new services and features',
        'Co-marketing opportunities',
      ],
      color: 'orange',
    },
    'store-affiliate': {
      title: 'Store Affiliate Program',
      subtitle: 'Shop Affiliate Application',
      description: 'Become a store affiliate to earn commission on all 47 Industries shop purchases made through your unique referral link.',
      benefits: [
        '10% commission on all referred purchases',
        'Unique tracking link and discount codes',
        'Real-time earnings dashboard',
        'Monthly payouts via PayPal or direct deposit',
      ],
      color: 'blue',
    },
  }

  const info = programInfo[type as keyof typeof programInfo] || programInfo.partner
  const colorClass = info.color === 'orange' ? 'orange' : 'blue'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/mobile/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          ...formData,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <LoadingFallback />
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className={`w-20 h-20 bg-${colorClass}-500/20 rounded-full flex items-center justify-center mx-auto mb-6`}>
            <svg className={`w-10 h-10 text-${colorClass}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Application Submitted</h1>
          <p className="text-zinc-400 mb-6">
            Thank you for applying to the {info.title}. We'll review your application and get back to you within 2-3 business days.
          </p>
          <Link
            href="/mobile/dashboard"
            className={`inline-block bg-${colorClass}-500 hover:bg-${colorClass}-600 text-white font-medium rounded-xl px-6 py-3 transition-colors`}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6 pb-20">
      <div className="max-w-md mx-auto">
        {/* Back Link */}
        <Link
          href="/mobile/dashboard"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className={`w-14 h-14 bg-${colorClass}-500/20 rounded-2xl flex items-center justify-center mb-4`}>
            {type === 'partner' ? (
              <svg className={`w-7 h-7 text-${colorClass}-500`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
              </svg>
            ) : (
              <svg className={`w-7 h-7 text-${colorClass}-500`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{info.title}</h1>
          <p className="text-zinc-400 text-sm">{info.description}</p>
        </div>

        {/* Benefits */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <p className="text-white font-medium mb-3">Benefits</p>
          <ul className="space-y-2">
            {info.benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <svg className={`w-5 h-5 text-${colorClass}-500 flex-shrink-0 mt-0.5`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-zinc-300 text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">Company / Brand (optional)</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder="Your company or brand name"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">Website (optional)</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">Social Media Handles</label>
            <input
              type="text"
              value={formData.socialMedia}
              onChange={(e) => setFormData(prev => ({ ...prev, socialMedia: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder="@instagram, @youtube, etc."
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              {type === 'partner' ? 'How will you refer clients?' : 'Describe your audience'}
            </label>
            <textarea
              value={formData.audience}
              onChange={(e) => setFormData(prev => ({ ...prev, audience: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
              placeholder={type === 'partner'
                ? "Describe how you plan to refer clients to our services..."
                : "Describe your audience and how you'll promote our products..."
              }
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">Why do you want to join?</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 min-h-[80px] resize-none"
              placeholder="Tell us why you'd be a great partner..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-${colorClass}-500 hover:bg-${colorClass}-600 text-white font-medium rounded-xl px-4 py-4 transition-colors disabled:opacity-50`}
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-zinc-600 text-xs text-center mt-6">
          By submitting, you agree to our{' '}
          <Link href="/terms" className="text-zinc-500 hover:text-zinc-400">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400">Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}

export default function RequestAccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RequestAccessContent />
    </Suspense>
  )
}
