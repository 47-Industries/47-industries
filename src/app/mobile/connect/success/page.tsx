'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function MobileConnectSuccessPage() {
  const searchParams = useSearchParams()
  const affiliateCode = searchParams.get('code')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    // Try to redirect to MotoRev app
    const callbackUrl = new URL('motorev://affiliate-connect')
    callbackUrl.searchParams.set('success', 'true')
    if (affiliateCode) {
      callbackUrl.searchParams.set('code', affiliateCode)
    }

    // Attempt deep link
    window.location.href = callbackUrl.toString()

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [affiliateCode])

  function handleReturnToApp() {
    const callbackUrl = new URL('motorev://affiliate-connect')
    callbackUrl.searchParams.set('success', 'true')
    if (affiliateCode) {
      callbackUrl.searchParams.set('code', affiliateCode)
    }
    window.location.href = callbackUrl.toString()
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Account Connected!</h1>

        <p className="text-zinc-400 mb-6">
          Your MotoRev account is now linked to 47 Industries. You can now earn points and track your affiliate rewards.
        </p>

        {affiliateCode && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
            <p className="text-zinc-500 text-sm mb-1">Your Affiliate Code</p>
            <p className="text-white font-mono text-lg">{affiliateCode}</p>
          </div>
        )}

        <button
          onClick={handleReturnToApp}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl px-6 py-4 transition-colors mb-4"
        >
          Return to MotoRev
        </button>

        <p className="text-zinc-600 text-sm">
          {countdown > 0
            ? `Returning automatically in ${countdown}...`
            : 'Tap above to return to MotoRev'}
        </p>
      </div>
    </div>
  )
}
