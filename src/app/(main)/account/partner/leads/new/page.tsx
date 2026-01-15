'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewLeadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    notes: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/partner/leads/new')
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.businessName || !formData.contactName || !formData.email) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      setError('')
      const res = await fetch('/api/account/partner/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/account/partner/leads?success=Lead+submitted+successfully')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to submit lead')
      }
    } catch (error) {
      setError('Failed to submit lead')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account/partner/leads" className="text-sm text-text-secondary hover:text-accent mb-2 inline-block">
            Back to Leads
          </Link>
          <h1 className="text-3xl font-bold">Submit New Lead</h1>
          <p className="text-text-secondary">
            Fill in the details of the potential client you are referring
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="border border-border rounded-xl p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Acme Corp"
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                required
              />
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="John Smith"
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://company.com"
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description
                <span className="text-text-secondary font-normal ml-2">What do they need?</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what services the lead is interested in..."
                rows={4}
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Additional Notes
                <span className="text-text-secondary font-normal ml-2">For internal reference</span>
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional context or notes..."
                rows={3}
                className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:border-accent focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="mt-8 flex gap-4">
            <Link
              href="/account/partner/leads"
              className="flex-1 px-6 py-3 border border-border rounded-lg text-center hover:bg-surface transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 font-medium"
            >
              {saving ? 'Submitting...' : 'Submit Lead'}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-surface/50 border border-border rounded-lg">
          <p className="text-sm text-text-secondary">
            When your lead converts to a client, you will automatically receive a commission based on your agreed rates.
            You can track the status of your leads and commissions from your partner dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
