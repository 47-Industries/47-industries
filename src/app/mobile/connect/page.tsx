'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useSearchParams, useRouter } from 'next/navigation'
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

function ConnectContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')

  // MotoRev user info from query params
  const motorevUserId = searchParams.get('motorevUserId')
  const motorevEmail = searchParams.get('motorevEmail')
  const motorevUsername = searchParams.get('motorevUsername')

  useEffect(() => {
    // If already logged in, auto-connect MotoRev account
    if (status === 'authenticated' && session?.user?.id) {
      connectMotoRevAccount()
    }
  }, [status, session])

  async function connectMotoRevAccount() {
    if (!motorevUserId) {
      // No MotoRev user ID provided, just redirect to success
      redirectToMotoRev(null)
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Connect MotoRev account to 47 Industries
      const res = await fetch('/api/mobile/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motorevUserId,
          motorevEmail,
          motorevUsername,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect account')
      }

      // Success - redirect back to MotoRev
      redirectToMotoRev(data.affiliateCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setIsConnecting(false)
    }
  }

  function redirectToMotoRev(affiliateCode: string | null) {
    // Build callback URL
    const callbackUrl = new URL('motorev://affiliate-connect')
    callbackUrl.searchParams.set('success', 'true')
    if (affiliateCode) {
      callbackUrl.searchParams.set('code', affiliateCode)
    }

    // Try deep link first, then show success page
    window.location.href = callbackUrl.toString()

    // Fallback: show success page if deep link doesn't work
    setTimeout(() => {
      router.push(`/mobile/connect/success?code=${affiliateCode || ''}`)
    }, 1000)
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const result = await signIn('credentials', {
      usernameOrEmail: email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
    }
    // If successful, useEffect will handle the connection
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Sign in after successful registration
      const result = await signIn('credentials', {
        usernameOrEmail: email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created but login failed. Please try signing in.')
        setIsSignUp(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  // Loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Connecting state
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-medium mb-2">Connecting your account...</p>
          <p className="text-zinc-400 text-sm">Please wait</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="47 Industries"
            className="w-16 h-16 rounded-2xl mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-white mb-2">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h1>
          <p className="text-zinc-400 text-sm">
            Connect your MotoRev account to 47 Industries
          </p>
        </div>

        {/* MotoRev Info Banner */}
        {motorevUsername && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">@{motorevUsername}</p>
                <p className="text-zinc-500 text-sm">MotoRev Account</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-zinc-400 text-sm mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                placeholder="Your name"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-zinc-400 text-sm mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              placeholder={isSignUp ? 'Create a password' : 'Your password'}
              required
              minLength={isSignUp ? 8 : undefined}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl px-4 py-3 transition-colors"
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle Sign In / Sign Up */}
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
            }}
            className="text-blue-500 text-sm hover:underline"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Create one"}
          </button>
        </div>

        {/* Benefits */}
        <div className="mt-10 pt-6 border-t border-zinc-800">
          <h3 className="text-white font-medium mb-4 text-center">Why connect?</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Earn Free Pro Time</p>
                <p className="text-zinc-500 text-xs">Get 7 days of MotoRev Pro for every 10 points</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Referral Rewards</p>
                <p className="text-zinc-500 text-xs">Earn points when friends join and upgrade</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Partner Program</p>
                <p className="text-zinc-500 text-xs">Top affiliates can apply for cash rewards</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-zinc-600 text-xs">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-400">Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MobileConnectPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConnectContent />
    </Suspense>
  )
}
