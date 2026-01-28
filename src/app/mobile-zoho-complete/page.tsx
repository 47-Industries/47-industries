'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function MobileZohoCompleteContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Zoho Connected</h1>
            <p className="text-zinc-400 mb-8">
              Your Zoho Mail account has been successfully connected. You can now close this window and return to the 47 app.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Connection Failed</h1>
            <p className="text-zinc-400 mb-8">
              {error === 'zoho_auth_failed' && 'Failed to authorize with Zoho. Please try again.'}
              {error === 'no_code' && 'No authorization code received from Zoho.'}
              {error === 'no_user' && 'Could not identify your account. Please try again.'}
              {!error && 'Something went wrong. Please return to the app and try again.'}
            </p>
          </>
        )}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <p className="text-sm text-zinc-500">
            Pull down to refresh in the app to update your connection status.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MobileZohoCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <MobileZohoCompleteContent />
    </Suspense>
  )
}
