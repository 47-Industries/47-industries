'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function PartnerInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteData, setInviteData] = useState<{
    name: string
    email: string
    partnerNumber: string
    firstSaleRate: number
    recurringRate: number
  } | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (token) {
      verifyToken()
    } else {
      setError('Invalid invite link')
      setLoading(false)
    }
  }, [token])

  const verifyToken = async () => {
    try {
      const res = await fetch(`/api/invite/partner/verify?token=${token}`)
      if (res.ok) {
        const data = await res.json()
        setInviteData(data)
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid or expired invite link')
      }
    } catch (err) {
      setError('Failed to verify invite')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setVerifying(true)
      setError(null)

      const res = await fetch('/api/invite/partner/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (res.ok) {
        // Redirect to login with success message
        router.push('/login?message=Account created! Please sign in.')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to complete setup')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Verifying invite...</div>
      </div>
    )
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
            <p className="text-text-secondary mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
            >
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome, {inviteData?.name}!</h1>
          <p className="text-text-secondary">
            Set up your password to access your partner dashboard
          </p>
        </div>

        {/* Partner Details Card */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
            Partner Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Partner Number</span>
              <span className="font-mono">{inviteData?.partnerNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Email</span>
              <span>{inviteData?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">First Sale Commission</span>
              <span className="text-green-500 font-semibold">{inviteData?.firstSaleRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Recurring Commission</span>
              <span className="text-green-500 font-semibold">{inviteData?.recurringRate}%</span>
            </div>
          </div>
        </div>

        {/* Password Form */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Set Your Password</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-white placeholder-text-muted focus:border-accent focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="w-full py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? 'Setting up...' : 'Complete Setup'}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          After setting up, you can access your partner dashboard at /account/partner
        </p>
      </div>
    </div>
  )
}

export default function PartnerInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    }>
      <PartnerInviteContent />
    </Suspense>
  )
}
