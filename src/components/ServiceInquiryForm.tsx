"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const SERVICE_TYPES = [
  { value: 'WEB_DEVELOPMENT', label: 'Website Development' },
  { value: 'APP_DEVELOPMENT', label: 'App Development' },
  { value: 'AI_SOLUTIONS', label: 'AI Solutions' },
  { value: 'CONSULTATION', label: 'Consultation' },
  { value: 'OTHER', label: 'Other' },
]

const BUDGET_RANGES = [
  { value: 'UNDER_5K', label: 'Under $5,000' },
  { value: '5K_15K', label: '$5,000 - $15,000' },
  { value: '15K_30K', label: '$15,000 - $30,000' },
  { value: '30K_50K', label: '$30,000 - $50,000' },
  { value: 'OVER_50K', label: 'Over $50,000' },
  { value: 'NOT_SURE', label: 'Not Sure' },
]

const TIMELINE_OPTIONS = [
  { value: 'ASAP', label: 'As soon as possible' },
  { value: '1_MONTH', label: 'Within 1 month' },
  { value: '2_3_MONTHS', label: '2-3 months' },
  { value: '3_6_MONTHS', label: '3-6 months' },
  { value: 'FLEXIBLE', label: 'Flexible' },
]

// Product-specific configurations
const PRODUCT_CONFIGS: Record<string, {
  name: string
  tagline: string
  price: string
  description: string
  features: string[]
  demoPhone?: string
}> = {
  ringzero: {
    name: 'RingZero',
    tagline: 'AI Receptionist - Never Miss Another Call',
    price: '$497/month',
    description: `I'm interested in RingZero AI Receptionist for my business.

My business type: [e.g., HVAC, Plumbing, Electrical, etc.]
Current call volume: [estimated calls per day/week]
Main goals: [e.g., capture more leads, book appointments, 24/7 availability]

Additional notes:`,
    features: [
      'Answers every call in under 1 second',
      '24/7/365 availability - no holidays or sick days',
      'Natural AI voice conversations',
      'Lead capture with instant SMS/email alerts',
      'Real-time appointment booking',
      'Call recordings and transcripts',
      'Google Calendar, CRM, and Zapier integration',
    ],
    demoPhone: '(415) 969-4084',
  },
}

export default function ServiceInquiryForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultServiceType = searchParams.get('type') || ''
  const defaultDescription = searchParams.get('description') || ''
  const projectReference = searchParams.get('projectTitle') || ''
  const productParam = searchParams.get('product') || ''

  // Get product-specific config
  const productConfig = PRODUCT_CONFIGS[productParam.toLowerCase()]

  const [formData, setFormData] = useState({
    website_url: '', // Honeypot field
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    serviceType: defaultServiceType,
    budget: '',
    timeline: '',
    description: productConfig?.description || defaultDescription,
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [inquiryNumber, setInquiryNumber] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/services/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setInquiryNumber(data.inquiryNumber)
        setFormData({
          website_url: '',
          name: '',
          email: '',
          phone: '',
          company: '',
          website: '',
          serviceType: '',
          budget: '',
          timeline: '',
          description: '',
        })
      } else {
        setError(data.error || 'Failed to submit inquiry. Please try again.')
      }
    } catch {
      setError('Failed to submit inquiry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">Inquiry Submitted!</h3>
        <p className="text-text-secondary mb-4">
          Thank you for your interest. We will review your request and get back to you within 24 hours.
        </p>
        <p className="text-sm text-text-muted mb-6">
          Reference: {inquiryNumber}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setSuccess(false)}
            className="px-6 py-2 border border-border rounded-lg hover:bg-surface transition-all"
          >
            Submit Another Inquiry
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Product-specific info banner */}
      {productConfig && (
        <div className="border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-xl p-6 mb-2">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-cyan-400 mb-1">{productConfig.name}</h3>
              <p className="text-text-secondary text-sm mb-3">{productConfig.tagline}</p>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-semibold">
                  {productConfig.price}
                </span>
                {productConfig.demoPhone && (
                  <a
                    href={`tel:${productConfig.demoPhone.replace(/[^0-9+]/g, '')}`}
                    className="text-sm text-text-secondary hover:text-cyan-400 transition-colors"
                  >
                    Demo: {productConfig.demoPhone}
                  </a>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {productConfig.features.slice(0, 6).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                    <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Honeypot field - hidden from humans, bots will fill it */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website_url">Website URL</label>
        <input
          type="text"
          id="website_url"
          name="website_url"
          value={formData.website_url}
          onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Contact Information */}
      <div className="border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
              placeholder="John Doe"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
              placeholder="john@example.com"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
              placeholder="(555) 123-4567"
              disabled={submitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
              placeholder="Acme Inc."
              disabled={submitting}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Current Website (if applicable)</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
              placeholder="https://example.com"
              disabled={submitting}
            />
          </div>
        </div>
      </div>

      {/* Project Details */}
      <div className="border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Project Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Service Type *</label>
            <select
              required
              value={formData.serviceType}
              onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
              disabled={submitting}
            >
              <option value="">Select a service type...</option>
              {SERVICE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Budget Range</label>
              <select
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                disabled={submitting}
              >
                <option value="">Select a budget range...</option>
                {BUDGET_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Timeline</label>
              <select
                value={formData.timeline}
                onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
                disabled={submitting}
              >
                <option value="">Select a timeline...</option>
                {TIMELINE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Project Description *</label>
            {projectReference && (
              <div className="mb-3 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                <p className="text-sm text-accent flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pre-filled based on: <strong>{projectReference}</strong>
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Feel free to edit the description below to match your specific needs.
                </p>
              </div>
            )}
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={8}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
              placeholder="Tell us about your project goals, features needed, target audience, and any specific requirements..."
              disabled={submitting}
            />
            <p className="text-xs text-text-muted mt-2">
              Please provide as much detail as possible to help us understand your needs.
            </p>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit Inquiry'}
      </button>

      <p className="text-xs text-text-muted text-center">
        By submitting this form, you agree to our terms of service and privacy policy.
      </p>
    </form>
  )
}
