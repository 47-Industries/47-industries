'use client'

import { useState } from 'react'
import Link from 'next/link'

type ServiceType = 'WEB_DEVELOPMENT' | 'APP_DEVELOPMENT' | 'AI_SOLUTIONS' | 'CONSULTATION' | 'OTHER'

interface FormData {
  // Contact Info
  name: string
  email: string
  phone: string
  company: string
  website: string

  // Project Details
  serviceType: ServiceType | ''
  projectType: string
  description: string
  pages: string
  features: string[]
  platforms: string[]
  hasDesign: boolean | null
  designDetails: string
  existingWebsite: string
  competitors: string

  // Budget & Timeline
  budget: string
  timeline: string
  additionalInfo: string
}

const SERVICE_TYPES = [
  { value: 'WEB_DEVELOPMENT', label: 'Web Development', description: 'Websites, web apps, e-commerce' },
  { value: 'APP_DEVELOPMENT', label: 'Mobile App Development', description: 'iOS, Android, cross-platform apps' },
  { value: 'AI_SOLUTIONS', label: 'AI Solutions', description: 'Machine learning, automation, AI integration' },
  { value: 'CONSULTATION', label: 'Consultation', description: 'Technical advice, project planning' },
  { value: 'OTHER', label: 'Other', description: 'Something else entirely' },
]

const PROJECT_TYPES = {
  WEB_DEVELOPMENT: [
    'Business/Corporate Website',
    'E-commerce Store',
    'Web Application',
    'Landing Page',
    'Portfolio/Personal Site',
    'Blog/Content Site',
    'SaaS Platform',
    'Other',
  ],
  APP_DEVELOPMENT: [
    'Consumer App',
    'Business/Enterprise App',
    'E-commerce App',
    'Social/Community App',
    'Utility/Productivity App',
    'Game',
    'Other',
  ],
  AI_SOLUTIONS: [
    'Chatbot/Virtual Assistant',
    'Data Analysis/Insights',
    'Process Automation',
    'Recommendation System',
    'Image/Video Processing',
    'Natural Language Processing',
    'Other',
  ],
}

const WEB_FEATURES = [
  'User Authentication',
  'Payment Processing',
  'Admin Dashboard',
  'Content Management (CMS)',
  'Search Functionality',
  'Email Notifications',
  'Third-party Integrations',
  'Analytics/Reporting',
  'Multi-language Support',
  'Real-time Features',
]

const APP_FEATURES = [
  'User Authentication',
  'Push Notifications',
  'In-app Purchases',
  'Social Features',
  'Offline Mode',
  'GPS/Location',
  'Camera/Media',
  'Third-party Integrations',
  'Analytics',
  'Admin Dashboard',
]

const PLATFORMS = ['iOS', 'Android', 'Web', 'Desktop (Windows)', 'Desktop (Mac)']

const BUDGETS = [
  'Under $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000 - $50,000',
  '$50,000 - $100,000',
  '$100,000+',
  'Not sure yet',
]

const TIMELINES = [
  'ASAP (Rush)',
  '1-2 months',
  '2-3 months',
  '3-6 months',
  '6+ months',
  'Flexible / No deadline',
]

const PAGE_RANGES = [
  '1-5 pages',
  '5-10 pages',
  '10-20 pages',
  '20-50 pages',
  '50+ pages',
  'Not sure yet',
]

export default function StartProjectPage() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [inquiryNumber, setInquiryNumber] = useState('')

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    website: '',
    serviceType: '',
    projectType: '',
    description: '',
    pages: '',
    features: [],
    platforms: [],
    hasDesign: null,
    designDetails: '',
    existingWebsite: '',
    competitors: '',
    budget: '',
    timeline: '',
    additionalInfo: '',
  })

  const updateForm = (field: keyof FormData, value: FormData[keyof FormData]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }))
  }

  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }))
  }

  const canProceedStep1 = formData.name && formData.email && formData.serviceType
  const canProceedStep2 = formData.description
  const canSubmit = canProceedStep1 && canProceedStep2

  const handleSubmit = async () => {
    if (!canSubmit) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/service-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitted(true)
        setInquiryNumber(data.inquiryNumber)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Failed to submit. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
            <p className="text-xl text-text-secondary mb-6">
              Your project inquiry has been received.
            </p>
            <div className="bg-surface border border-border rounded-xl p-6 mb-8">
              <p className="text-sm text-text-secondary mb-2">Your Reference Number</p>
              <p className="text-2xl font-bold text-accent">{inquiryNumber}</p>
            </div>
            <p className="text-text-secondary mb-8">
              We&apos;ll review your requirements and get back to you within 1-2 business days.
              A confirmation email has been sent to <strong>{formData.email}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
              >
                Back to Home
              </Link>
              <Link
                href="/services"
                className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-surface transition-colors"
              >
                View Our Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const featuresForType = formData.serviceType === 'APP_DEVELOPMENT' ? APP_FEATURES : WEB_FEATURES
  const projectTypesForService = formData.serviceType && formData.serviceType !== 'CONSULTATION' && formData.serviceType !== 'OTHER'
    ? PROJECT_TYPES[formData.serviceType as keyof typeof PROJECT_TYPES]
    : null

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Start Your Project</h1>
            <p className="text-xl text-text-secondary">
              Tell us about your vision and we&apos;ll help bring it to life.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => s < step && setStep(s)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                      step === s
                        ? 'bg-accent text-white'
                        : step > s
                          ? 'bg-green-500 text-white cursor-pointer'
                          : 'bg-surface border border-border text-text-secondary'
                    }`}
                  >
                    {step > s ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s}
                  </button>
                  {s < 3 && (
                    <div className={`w-16 h-1 mx-2 rounded ${step > s ? 'bg-green-500' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Contact & Service Type */}
          {step === 1 && (
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>

              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => updateForm('company', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="Your company name"
                  />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4">What do you need? <span className="text-red-500">*</span></h2>
              <div className="grid gap-3 mb-8">
                {SERVICE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateForm('serviceType', type.value as ServiceType)}
                    className={`w-full p-4 text-left rounded-xl border transition-all ${
                      formData.serviceType === type.value
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="font-medium">{type.label}</div>
                    <div className="text-sm text-text-secondary">{type.description}</div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="px-8 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Project Details */}
          {step === 2 && (
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">Project Details</h2>

              {/* Project Type */}
              {projectTypesForService && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">What type of project is this?</label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => updateForm('projectType', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                  >
                    <option value="">Select a type...</option>
                    {projectTypesForService.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Describe your project <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none resize-none"
                  placeholder="Tell us about your project idea, goals, and what you're looking to achieve..."
                />
              </div>

              {/* Pages/Screens (for web/app) */}
              {(formData.serviceType === 'WEB_DEVELOPMENT' || formData.serviceType === 'APP_DEVELOPMENT') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Estimated number of {formData.serviceType === 'APP_DEVELOPMENT' ? 'screens' : 'pages'}
                  </label>
                  <select
                    value={formData.pages}
                    onChange={(e) => updateForm('pages', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {PAGE_RANGES.map((range) => (
                      <option key={range} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Platforms (for app) */}
              {formData.serviceType === 'APP_DEVELOPMENT' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Target platforms</label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((platform) => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`px-4 py-2 rounded-lg border transition-all ${
                          formData.platforms.includes(platform)
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {(formData.serviceType === 'WEB_DEVELOPMENT' || formData.serviceType === 'APP_DEVELOPMENT') && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Desired features (select all that apply)</label>
                  <div className="flex flex-wrap gap-2">
                    {featuresForType.map((feature) => (
                      <button
                        key={feature}
                        type="button"
                        onClick={() => toggleFeature(feature)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          formData.features.includes(feature)
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Design */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Do you have existing designs?</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateForm('hasDesign', true)}
                    className={`flex-1 py-3 rounded-lg border transition-all ${
                      formData.hasDesign === true
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => updateForm('hasDesign', false)}
                    className={`flex-1 py-3 rounded-lg border transition-all ${
                      formData.hasDesign === false
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    No, I need design help
                  </button>
                </div>
              </div>

              {formData.hasDesign === true && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Tell us about your designs</label>
                  <input
                    type="text"
                    value={formData.designDetails}
                    onChange={(e) => updateForm('designDetails', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="e.g., Figma files, wireframes, brand guidelines..."
                  />
                </div>
              )}

              {/* Reference Sites */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Any websites or apps you like? (for reference)
                </label>
                <input
                  type="text"
                  value={formData.competitors}
                  onChange={(e) => updateForm('competitors', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                  placeholder="e.g., stripe.com, airbnb.com..."
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-background transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2}
                  className="px-8 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Budget & Timeline */}
          {step === 3 && (
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6">Budget & Timeline</h2>

              {/* Budget */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">What&apos;s your budget range?</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {BUDGETS.map((budget) => (
                    <button
                      key={budget}
                      type="button"
                      onClick={() => updateForm('budget', budget)}
                      className={`py-3 px-4 rounded-lg border text-sm transition-all ${
                        formData.budget === budget
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      {budget}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">When do you need this completed?</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TIMELINES.map((timeline) => (
                    <button
                      key={timeline}
                      type="button"
                      onClick={() => updateForm('timeline', timeline)}
                      className={`py-3 px-4 rounded-lg border text-sm transition-all ${
                        formData.timeline === timeline
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      {timeline}
                    </button>
                  ))}
                </div>
              </div>

              {/* Existing Website */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Existing website (if any)</label>
                <input
                  type="url"
                  value={formData.existingWebsite}
                  onChange={(e) => updateForm('existingWebsite', e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                  placeholder="https://yoursite.com"
                />
              </div>

              {/* Additional Info */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2">Anything else we should know?</label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => updateForm('additionalInfo', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none resize-none"
                  placeholder="Any other details, requirements, or questions..."
                />
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-background transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmit}
                  className="px-8 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Inquiry'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Start Your Project - 47 Industries',
  description: 'Tell us about your web development, app development, or AI project and get a custom proposal.',
}
