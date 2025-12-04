'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

// Service packages matching the database
const SERVICE_PACKAGES: Record<string, { name: string; category: string; basePrice: number | null; isMonthly?: boolean }> = {
  'web-starter': { name: 'Website Starter', category: 'WEBSITE', basePrice: 2500 },
  'web-professional': { name: 'Website Professional', category: 'WEBSITE', basePrice: 5000 },
  'web-enterprise': { name: 'Website Enterprise', category: 'WEBSITE', basePrice: null },
  'webapp-starter': { name: 'Web App Starter', category: 'WEB_APP', basePrice: 8000 },
  'webapp-professional': { name: 'Web App Professional', category: 'WEB_APP', basePrice: 18000 },
  'webapp-enterprise': { name: 'Web App Enterprise', category: 'WEB_APP', basePrice: null },
  'ios-basic': { name: 'iOS Starter', category: 'IOS_APP', basePrice: 8000 },
  'ios-standard': { name: 'iOS Professional', category: 'IOS_APP', basePrice: 15000 },
  'ios-enterprise': { name: 'iOS Enterprise', category: 'IOS_APP', basePrice: null },
  'android-basic': { name: 'Android Starter', category: 'ANDROID_APP', basePrice: 7500 },
  'android-standard': { name: 'Android Professional', category: 'ANDROID_APP', basePrice: 14000 },
  'android-enterprise': { name: 'Android Enterprise', category: 'ANDROID_APP', basePrice: null },
  'cross-platform-starter': { name: 'Cross-Platform Starter', category: 'CROSS_PLATFORM', basePrice: 12000 },
  'cross-platform-professional': { name: 'Cross-Platform Professional', category: 'CROSS_PLATFORM', basePrice: 22000 },
  'cross-platform-enterprise': { name: 'Cross-Platform Enterprise', category: 'CROSS_PLATFORM', basePrice: null },
  'ai-starter': { name: 'AI Automation Starter', category: 'AI_AUTOMATION', basePrice: 799, isMonthly: true },
  'ai-professional': { name: 'AI Automation Professional', category: 'AI_AUTOMATION', basePrice: 1999, isMonthly: true },
  'ai-enterprise': { name: 'AI Automation Enterprise', category: 'AI_AUTOMATION', basePrice: null, isMonthly: true },
}

const SERVICES = [
  { id: 'WEBSITE', label: 'Website', description: 'Business sites, landing pages, portfolios' },
  { id: 'WEB_APP', label: 'Web Application', description: 'Dashboards, SaaS platforms, custom software' },
  { id: 'IOS_APP', label: 'iOS App', description: 'Native iPhone & iPad applications' },
  { id: 'ANDROID_APP', label: 'Android App', description: 'Native Android applications' },
  { id: 'CROSS_PLATFORM', label: 'Cross-Platform App', description: 'iOS & Android from one codebase' },
  { id: 'AI_AUTOMATION', label: 'AI Automation', description: 'AI receptionists, lead gen, workflow automation' },
]

const PAGE_OPTIONS = ['1-5 pages', '5-10 pages', '10-20 pages', '20-50 pages', '50+ pages']
const SCREEN_OPTIONS = ['1-10 screens', '10-25 screens', '25-50 screens', '50+ screens']

const WEBSITE_FEATURES = [
  'Contact form',
  'Blog/News section',
  'E-commerce/Shop',
  'Booking/Scheduling',
  'User accounts',
  'CMS (content management)',
  'Multi-language',
  'SEO optimization',
  'Analytics integration',
  'Live chat',
  'Newsletter signup',
  'Social media integration',
]

const APP_FEATURES = [
  'User authentication',
  'Push notifications',
  'In-app purchases',
  'Payment processing',
  'GPS/Location',
  'Camera/Photo upload',
  'Social features',
  'Offline mode',
  'Real-time chat',
  'Admin dashboard',
  'Analytics',
  'Third-party API integrations',
]

const AI_FEATURES = [
  'Website chatbot',
  'AI receptionist (voice)',
  'Email automation',
  'Lead generation',
  'Calendar integration',
  'CRM integration',
  'Custom workflows',
  'SMS automation',
  'Multi-channel support',
]

const TIMELINES = [
  'ASAP - Rush project',
  '1-2 months',
  '2-3 months',
  '3-6 months',
  '6+ months',
  'Flexible / Not sure',
]

const BUDGETS = [
  'Under $5,000',
  '$5,000 - $10,000',
  '$10,000 - $25,000',
  '$25,000 - $50,000',
  '$50,000 - $100,000',
  '$100,000+',
  'Not sure - need guidance',
]

interface FormData {
  // Contact
  name: string
  email: string
  phone: string
  company: string
  website: string

  // Service
  selectedServices: string[]
  selectedPackage: string

  // Project scope
  projectName: string
  description: string
  targetAudience: string
  pages: string
  screens: string
  features: string[]

  // Design
  hasDesign: string
  designNotes: string
  brandGuidelines: string
  referenceUrls: string

  // Technical
  existingSystem: string
  integrations: string
  hostingPreference: string

  // Business
  budget: string
  timeline: string
  startDate: string
  additionalInfo: string
}

export default function StartProjectClient() {
  const searchParams = useSearchParams()
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
    selectedServices: [],
    selectedPackage: '',
    projectName: '',
    description: '',
    targetAudience: '',
    pages: '',
    screens: '',
    features: [],
    hasDesign: '',
    designNotes: '',
    brandGuidelines: '',
    referenceUrls: '',
    existingSystem: '',
    integrations: '',
    hostingPreference: '',
    budget: '',
    timeline: '',
    startDate: '',
    additionalInfo: '',
  })

  // Handle ?service= query param
  useEffect(() => {
    const serviceParam = searchParams.get('service')
    if (serviceParam) {
      const pkg = SERVICE_PACKAGES[serviceParam]
      if (pkg) {
        setFormData(prev => ({
          ...prev,
          selectedPackage: serviceParam,
          selectedServices: [pkg.category],
        }))
      }
    }
  }, [searchParams])

  const updateForm = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(s => s !== serviceId)
        : [...prev.selectedServices, serviceId],
    }))
  }

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }))
  }

  // Get relevant features based on selected services
  const getRelevantFeatures = () => {
    const features: string[] = []
    if (formData.selectedServices.includes('WEBSITE')) features.push(...WEBSITE_FEATURES)
    if (formData.selectedServices.some(s => ['WEB_APP', 'IOS_APP', 'ANDROID_APP', 'CROSS_PLATFORM'].includes(s))) {
      APP_FEATURES.forEach(f => { if (!features.includes(f)) features.push(f) })
    }
    if (formData.selectedServices.includes('AI_AUTOMATION')) features.push(...AI_FEATURES)
    return features
  }

  const needsPages = formData.selectedServices.includes('WEBSITE')
  const needsScreens = formData.selectedServices.some(s => ['WEB_APP', 'IOS_APP', 'ANDROID_APP', 'CROSS_PLATFORM'].includes(s))

  const canProceed1 = formData.name && formData.email && formData.selectedServices.length > 0
  const canProceed2 = formData.description
  const canProceed3 = true // Optional step
  const canSubmit = canProceed1 && canProceed2

  const selectedPackageInfo = formData.selectedPackage ? SERVICE_PACKAGES[formData.selectedPackage] : null

  const handleSubmit = async () => {
    if (!canSubmit) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/service-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          // Map to API expected format
          serviceType: formData.selectedServices[0] === 'WEBSITE' ? 'WEB_DEVELOPMENT' :
                       formData.selectedServices.includes('AI_AUTOMATION') ? 'AI_SOLUTIONS' :
                       formData.selectedServices.some(s => ['IOS_APP', 'ANDROID_APP', 'CROSS_PLATFORM'].includes(s)) ? 'APP_DEVELOPMENT' :
                       formData.selectedServices.includes('WEB_APP') ? 'WEB_DEVELOPMENT' : 'OTHER',
          projectDetails: {
            services: formData.selectedServices,
            package: formData.selectedPackage,
            projectName: formData.projectName,
            targetAudience: formData.targetAudience,
            pages: formData.pages,
            screens: formData.screens,
            features: formData.features,
            hasDesign: formData.hasDesign,
            designNotes: formData.designNotes,
            brandGuidelines: formData.brandGuidelines,
            referenceUrls: formData.referenceUrls,
            existingSystem: formData.existingSystem,
            integrations: formData.integrations,
            hostingPreference: formData.hostingPreference,
            startDate: formData.startDate,
          },
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitted(true)
        setInquiryNumber(data.inquiryNumber)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
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

            <div className="bg-surface border border-border rounded-xl p-6 mb-6">
              <p className="text-sm text-text-secondary mb-2">Your Reference Number</p>
              <p className="text-2xl font-bold text-accent">{inquiryNumber}</p>
            </div>

            {/* View Inquiry Button */}
            <Link
              href={`/inquiry/${inquiryNumber}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors mb-6"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Your Inquiry
            </Link>

            <div className="bg-surface border border-border rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold mb-4">What happens next?</h3>
              <ol className="space-y-3 text-text-secondary">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <span>Our team will review your project requirements (within 24 hours)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <span>We&apos;ll prepare a detailed quote based on your needs</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-accent text-white rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <span>You&apos;ll receive your personalized quote via email</span>
                </li>
              </ol>
            </div>

            <p className="text-text-secondary text-sm mb-4">
              A confirmation has been sent to <strong>{formData.email}</strong>.
            </p>

            <div className="bg-surface-elevated border border-border rounded-lg p-4 mb-8">
              <p className="text-sm text-text-secondary">
                Bookmark your inquiry page to track status updates and view our responses:
              </p>
              <p className="text-sm text-accent font-medium mt-1 break-all">
                47industries.com/inquiry/{inquiryNumber}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-surface transition-colors"
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

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Start Your Project</h1>
            <p className="text-lg text-text-secondary">
              Tell us about your project and we&apos;ll prepare a personalized quote.
            </p>
            {selectedPackageInfo && (
              <div className="mt-4 inline-block px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg">
                <span className="text-accent font-medium">Selected: {selectedPackageInfo.name}</span>
                {selectedPackageInfo.basePrice && (
                  <span className="text-text-secondary ml-2">
                    (Starting at ${selectedPackageInfo.basePrice.toLocaleString()}{selectedPackageInfo.isMonthly ? '/mo' : ''})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-2 sm:gap-4">
              {[
                { num: 1, label: 'Basics' },
                { num: 2, label: 'Project' },
                { num: 3, label: 'Details' },
                { num: 4, label: 'Submit' },
              ].map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <button
                    onClick={() => s.num < step && setStep(s.num)}
                    disabled={s.num > step}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${
                      step === s.num
                        ? 'bg-accent text-white'
                        : step > s.num
                          ? 'bg-green-500 text-white cursor-pointer'
                          : 'bg-surface border border-border text-text-muted'
                    }`}
                  >
                    {step > s.num ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.num}
                  </button>
                  {i < 3 && (
                    <div className={`w-8 sm:w-12 h-0.5 mx-1 ${step > s.num ? 'bg-green-500' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Basics */}
          {step === 1 && (
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">Contact Information</h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="Your full name"
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
                    placeholder="you@company.com"
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
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-2">Current Website (if any)</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => updateForm('website', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="https://yoursite.com"
                  />
                </div>
              </div>

              <h2 className="text-xl font-bold mb-4">What do you need? <span className="text-red-500">*</span></h2>
              <p className="text-text-secondary text-sm mb-4">Select all that apply</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {SERVICES.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service.id)}
                    className={`p-4 text-left rounded-xl border transition-all ${
                      formData.selectedServices.includes(service.id)
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{service.label}</div>
                        <div className="text-sm text-text-secondary">{service.description}</div>
                      </div>
                      {formData.selectedServices.includes(service.id) && (
                        <svg className="w-5 h-5 text-accent flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceed1}
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
              <h2 className="text-xl font-bold mb-6">Tell Us About Your Project</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Name</label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) => updateForm('projectName', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="e.g., Company Website Redesign"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Project Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    rows={5}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none resize-none"
                    placeholder="Describe your project goals, what problem it solves, and any key requirements..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Who is the target audience?</label>
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => updateForm('targetAudience', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="e.g., Small business owners, healthcare professionals, consumers aged 25-40"
                  />
                </div>

                {needsPages && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Estimated number of pages</label>
                    <select
                      value={formData.pages}
                      onChange={(e) => updateForm('pages', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    >
                      <option value="">Select...</option>
                      {PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}

                {needsScreens && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Estimated number of screens</label>
                    <select
                      value={formData.screens}
                      onChange={(e) => updateForm('screens', e.target.value)}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    >
                      <option value="">Select...</option>
                      {SCREEN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}

                {getRelevantFeatures().length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-3">Features needed (select all that apply)</label>
                    <div className="flex flex-wrap gap-2">
                      {getRelevantFeatures().map((feature) => (
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
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-background transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canProceed2}
                  className="px-8 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Design & Technical */}
          {step === 3 && (
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">Design & Technical Details</h2>
              <p className="text-text-secondary text-sm mb-6">
                These details help us provide a more accurate quote. Skip any that don&apos;t apply.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Do you have designs ready?</label>
                  <div className="flex flex-wrap gap-3">
                    {['Yes, complete designs', 'Partial/wireframes', 'No, need design help', 'Just an idea'].map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateForm('hasDesign', opt)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                          formData.hasDesign === opt
                            ? 'border-accent bg-accent/10'
                            : 'border-border hover:border-accent/50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Design notes or preferences</label>
                  <textarea
                    value={formData.designNotes}
                    onChange={(e) => updateForm('designNotes', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none resize-none"
                    placeholder="Style preferences, color schemes, inspiration sites..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Reference websites or apps</label>
                  <textarea
                    value={formData.referenceUrls}
                    onChange={(e) => updateForm('referenceUrls', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none resize-none"
                    placeholder="Links to sites/apps you like (one per line)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Existing systems to integrate with</label>
                  <input
                    type="text"
                    value={formData.integrations}
                    onChange={(e) => updateForm('integrations', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="e.g., Salesforce, HubSpot, Stripe, custom API..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Any existing website/app being replaced?</label>
                  <input
                    type="text"
                    value={formData.existingSystem}
                    onChange={(e) => updateForm('existingSystem', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="URL or description of current system"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-background transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="px-8 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Budget & Submit */}
          {step === 4 && (
            <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
              <h2 className="text-xl font-bold mb-6">Budget & Timeline</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Budget range</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {BUDGETS.map((budget) => (
                      <button
                        key={budget}
                        type="button"
                        onClick={() => updateForm('budget', budget)}
                        className={`py-3 px-3 rounded-lg border text-sm transition-all ${
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

                <div>
                  <label className="block text-sm font-medium mb-3">Timeline</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {TIMELINES.map((timeline) => (
                      <button
                        key={timeline}
                        type="button"
                        onClick={() => updateForm('timeline', timeline)}
                        className={`py-3 px-3 rounded-lg border text-sm transition-all ${
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

                <div>
                  <label className="block text-sm font-medium mb-2">Preferred start date</label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) => updateForm('startDate', e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                    placeholder="e.g., January 2025, ASAP, Flexible"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Anything else we should know?</label>
                  <textarea
                    value={formData.additionalInfo}
                    onChange={(e) => updateForm('additionalInfo', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none resize-none"
                    placeholder="Special requirements, concerns, questions..."
                  />
                </div>
              </div>

              {error && (
                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                  {error}
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setStep(3)}
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
