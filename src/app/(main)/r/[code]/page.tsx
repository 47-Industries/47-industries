'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function ReferralLandingPage() {
  const params = useParams()
  const code = (params.code as string)?.toUpperCase() || ''

  const [copied, setCopied] = useState(false)
  const [isValidCode, setIsValidCode] = useState(false)

  // Validate code format (MR-XXXXXX)
  useEffect(() => {
    const isValid = /^MR-[A-Z0-9]{6}$/.test(code)
    setIsValidCode(isValid)

    // Store code in localStorage for potential web signup
    if (isValid) {
      localStorage.setItem('motorev_referral_code', code)
    }
  }, [code])

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code')
    }
  }

  const appStoreUrl = 'https://apps.apple.com/app/motorev/id6450234567'

  if (!isValidCode) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="w-full max-w-md px-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Invalid Referral Code</h1>
          <p className="text-text-secondary mb-8">
            The referral code you're trying to use is not valid. Please check the code and try again.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-lg mx-auto px-6">
        {/* MotoRev Logo/Hero */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2">Join MotoRev</h1>
          <p className="text-text-secondary text-lg">
            The ultimate motorcycle companion app
          </p>
        </div>

        {/* Referral Code Card */}
        <div className="bg-surface border border-border rounded-xl p-6 mb-8">
          <div className="text-center mb-4">
            <p className="text-text-secondary text-sm mb-2">Your Referral Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-mono font-bold tracking-wider">{code}</span>
              <button
                onClick={handleCopyCode}
                className="p-2 bg-surface-elevated hover:bg-border rounded-lg transition-colors"
                title="Copy code"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="bg-background rounded-lg p-4 text-sm text-text-secondary">
            <p className="font-medium text-white mb-2">How to use this code:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Copy the code above</li>
              <li>Download MotoRev from the App Store</li>
              <li>Create your account</li>
              <li>The app will detect the code automatically</li>
            </ol>
          </div>
        </div>

        {/* App Store Button */}
        <a
          href={appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors mb-6"
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          <span>Download on the App Store</span>
        </a>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">GPS Tracking</h3>
            <p className="text-text-secondary text-sm">Track your rides with detailed route maps</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">Social</h3>
            <p className="text-text-secondary text-sm">Connect with riders in your area</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">Safety</h3>
            <p className="text-text-secondary text-sm">Emergency alerts and crash detection</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">Garage</h3>
            <p className="text-text-secondary text-sm">Manage your bikes and maintenance</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-text-secondary text-sm">
          <p className="mb-2">MotoRev is a product of 47 Industries</p>
          <div className="flex items-center justify-center gap-4">
            <Link href="https://motorevapp.com" className="text-accent hover:underline">
              Learn More
            </Link>
            <span className="text-border">|</span>
            <Link href="/legal/privacy" className="hover:text-white">
              Privacy
            </Link>
            <span className="text-border">|</span>
            <Link href="/legal/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
