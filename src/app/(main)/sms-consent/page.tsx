'use client'

import { useState } from 'react'

interface ConsentRecord {
  name: string
  phone: string
  email: string
  timestamp: string
  ip?: string
}

export default function SmsConsentPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!agreed) {
      setError('You must agree to receive SMS messages to continue.')
      return
    }

    if (!formData.name || !formData.phone) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/sms-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          agreedAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit consent')
      }

      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">Consent Recorded</h1>
            <p className="text-text-secondary text-lg mb-8">
              Thank you, {formData.name}! Your consent to receive SMS notifications has been recorded.
            </p>
            <div className="bg-surface border border-border rounded-2xl p-6 text-left">
              <h2 className="font-semibold mb-4">What happens next?</h2>
              <ul className="space-y-2 text-text-secondary">
                <li>You will receive SMS notifications about household bills</li>
                <li>Daily bank balance updates will be sent to the group</li>
                <li>You can opt out at any time by replying STOP</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">SMS Notification Consent</h1>
          <p className="text-text-secondary text-lg mb-8">
            47 Industries Household Bill Notifications
          </p>

          <div className="bg-surface border border-border rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">About This Service</h2>
            <p className="text-text-secondary mb-6">
              As a member of the 47 Industries household, you are invited to receive SMS text message notifications regarding shared bills and financial updates.
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Bill Notifications</h3>
                  <p className="text-sm text-text-secondary">Alerts when bills arrive from Duke Energy, Chase, Amex, Tote Enterprises (Trash), and Pinellas County Utilities (Water)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Balance Updates</h3>
                  <p className="text-sm text-text-secondary">Daily bank account balance notifications</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium">Message Frequency</h3>
                  <p className="text-sm text-text-secondary">Approximately 5-15 messages per month</p>
                </div>
              </div>
            </div>

            <div className="bg-surface-elevated rounded-xl p-4 text-sm text-text-secondary">
              <strong className="text-text-primary">Important:</strong> Message and data rates may apply based on your mobile carrier plan. You can opt out at any time by replying STOP to any message or by contacting us directly.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-8">
            <h2 className="text-xl font-semibold mb-6">Provide Your Consent</h2>

            {error && (
              <div className="bg-error/10 border border-error/20 text-error rounded-xl p-4 mb-6">
                {error}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Full Name <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-border rounded-xl focus:outline-none focus:border-accent transition-colors"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number <span className="text-error">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-border rounded-xl focus:outline-none focus:border-accent transition-colors"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address <span className="text-text-secondary">(optional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-black border border-border rounded-xl focus:outline-none focus:border-accent transition-colors"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="border-t border-border pt-6 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-border bg-black text-accent focus:ring-accent focus:ring-offset-0"
                />
                <span className="text-sm text-text-secondary">
                  I consent to receive SMS text messages from 47 Industries regarding household bills and financial updates at the phone number provided above. I understand that message and data rates may apply, and that I can opt out at any time by replying STOP.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full py-4 bg-accent hover:bg-accent/90 disabled:bg-accent/50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
            >
              {loading ? 'Submitting...' : 'I Agree - Submit Consent'}
            </button>

            <p className="text-xs text-text-secondary mt-4 text-center">
              By submitting this form, you acknowledge that you have read and understood the terms above.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
