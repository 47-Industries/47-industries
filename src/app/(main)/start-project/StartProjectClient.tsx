'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// Service types matching actual offerings
const SERVICES = [
  {
    id: 'WEBSITE',
    label: 'Website',
    description: 'Business sites, landing pages, portfolios',
    icon: 'globe',
    basePrice: 2500,
    proPrice: 5000,
  },
  {
    id: 'WEB_APP',
    label: 'Web Application',
    description: 'Dashboards, SaaS platforms, portals',
    icon: 'app',
    basePrice: 8000,
    proPrice: 18000,
  },
  {
    id: 'IOS_APP',
    label: 'iOS App',
    description: 'Native iPhone & iPad applications',
    icon: 'apple',
    basePrice: 8000,
    proPrice: 15000,
  },
  {
    id: 'ANDROID_APP',
    label: 'Android App',
    description: 'Native Android applications',
    icon: 'android',
    basePrice: 7500,
    proPrice: 14000,
  },
  {
    id: 'CROSS_PLATFORM',
    label: 'Cross-Platform App',
    description: 'iOS & Android from one codebase',
    icon: 'devices',
    basePrice: 12000,
    proPrice: 22000,
  },
  {
    id: 'AI_AUTOMATION',
    label: 'AI Automation',
    description: 'AI receptionists, lead gen, workflow automation',
    icon: 'ai',
    basePrice: 799,
    proPrice: 1999,
    isMonthly: true,
  },
]

// Complexity levels
const COMPLEXITY_LEVELS = [
  { id: 'simple', label: 'Simple', description: 'Basic functionality, few screens/pages', multiplier: 1 },
  { id: 'moderate', label: 'Moderate', description: 'Standard features, multiple screens/pages', multiplier: 1.5 },
  { id: 'complex', label: 'Complex', description: 'Advanced features, many integrations', multiplier: 2.5 },
  { id: 'enterprise', label: 'Enterprise', description: 'Large-scale, custom everything', multiplier: 0 }, // Custom quote
]

// Features that affect pricing
const FEATURES = {
  WEBSITE: [
    { id: 'pages_5', label: '1-5 pages', priceAdd: 0 },
    { id: 'pages_10', label: '6-10 pages', priceAdd: 1000 },
    { id: 'pages_20', label: '11-20 pages', priceAdd: 2500 },
    { id: 'pages_50', label: '20+ pages', priceAdd: 0, requiresQuote: true },
    { id: 'cms', label: 'Content Management System', priceAdd: 1500 },
    { id: 'ecommerce', label: 'E-commerce functionality', priceAdd: 3000 },
    { id: 'blog', label: 'Blog/News section', priceAdd: 800 },
    { id: 'multilang', label: 'Multi-language support', priceAdd: 1500 },
    { id: 'seo', label: 'Advanced SEO optimization', priceAdd: 500 },
    { id: 'analytics', label: 'Analytics integration', priceAdd: 300 },
  ],
  WEB_APP: [
    { id: 'auth', label: 'User authentication', priceAdd: 1500 },
    { id: 'dashboard', label: 'Admin dashboard', priceAdd: 3000 },
    { id: 'payments', label: 'Payment processing', priceAdd: 2500 },
    { id: 'realtime', label: 'Real-time features', priceAdd: 3000 },
    { id: 'api', label: 'API integrations', priceAdd: 2000 },
    { id: 'notifications', label: 'Email/SMS notifications', priceAdd: 1000 },
    { id: 'reporting', label: 'Reports & analytics', priceAdd: 2500 },
    { id: 'roles', label: 'User roles & permissions', priceAdd: 1500 },
  ],
  IOS_APP: [
    { id: 'auth', label: 'User authentication', priceAdd: 1500 },
    { id: 'push', label: 'Push notifications', priceAdd: 1000 },
    { id: 'iap', label: 'In-app purchases', priceAdd: 2500 },
    { id: 'camera', label: 'Camera/Photo features', priceAdd: 1500 },
    { id: 'gps', label: 'GPS/Location services', priceAdd: 1500 },
    { id: 'offline', label: 'Offline mode', priceAdd: 2000 },
    { id: 'social', label: 'Social features', priceAdd: 2000 },
    { id: 'api', label: 'Backend API', priceAdd: 4000 },
  ],
  ANDROID_APP: [
    { id: 'auth', label: 'User authentication', priceAdd: 1500 },
    { id: 'push', label: 'Push notifications', priceAdd: 1000 },
    { id: 'iap', label: 'In-app purchases', priceAdd: 2500 },
    { id: 'camera', label: 'Camera/Photo features', priceAdd: 1500 },
    { id: 'gps', label: 'GPS/Location services', priceAdd: 1500 },
    { id: 'offline', label: 'Offline mode', priceAdd: 2000 },
    { id: 'social', label: 'Social features', priceAdd: 2000 },
    { id: 'api', label: 'Backend API', priceAdd: 4000 },
  ],
  CROSS_PLATFORM: [
    { id: 'auth', label: 'User authentication', priceAdd: 2000 },
    { id: 'push', label: 'Push notifications', priceAdd: 1500 },
    { id: 'iap', label: 'In-app purchases', priceAdd: 3000 },
    { id: 'camera', label: 'Camera/Photo features', priceAdd: 2000 },
    { id: 'gps', label: 'GPS/Location services', priceAdd: 2000 },
    { id: 'offline', label: 'Offline mode', priceAdd: 2500 },
    { id: 'social', label: 'Social features', priceAdd: 2500 },
    { id: 'api', label: 'Backend API', priceAdd: 5000 },
  ],
  AI_AUTOMATION: [
    { id: 'chatbot', label: 'Website chatbot', priceAdd: 0 },
    { id: 'receptionist', label: 'AI receptionist (voice)', priceAdd: 500, monthly: true },
    { id: 'calendar', label: 'Calendar integration', priceAdd: 200, monthly: true },
    { id: 'email', label: 'Email automation', priceAdd: 200, monthly: true },
    { id: 'crm', label: 'CRM integration', priceAdd: 300, monthly: true },
    { id: 'leadgen', label: 'Lead generation', priceAdd: 400, monthly: true },
    { id: 'workflow', label: 'Custom workflow automation', priceAdd: 0, requiresQuote: true },
  ],
}

const TIMELINES = [
  { id: 'asap', label: 'ASAP (Rush)', multiplier: 1.25 },
  { id: '1-2months', label: '1-2 months', multiplier: 1 },
  { id: '2-3months', label: '2-3 months', multiplier: 1 },
  { id: '3-6months', label: '3-6 months', multiplier: 0.95 },
  { id: 'flexible', label: 'Flexible', multiplier: 0.9 },
]

interface ServiceConfig {
  complexity: string
  features: string[]
  description: string
  hasDesign: boolean | null
}

interface FormData {
  // Contact
  name: string
  email: string
  phone: string
  company: string

  // Services
  selectedServices: string[]
  serviceConfigs: Record<string, ServiceConfig>

  // Timeline & Additional
  timeline: string
  additionalInfo: string
  referenceLinks: string
}

export default function StartProjectClient() {
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
    selectedServices: [],
    serviceConfigs: {},
    timeline: '',
    additionalInfo: '',
    referenceLinks: '',
  })

  const toggleService = (serviceId: string) => {
    setFormData(prev => {
      const isSelected = prev.selectedServices.includes(serviceId)
      const newServices = isSelected
        ? prev.selectedServices.filter(s => s !== serviceId)
        : [...prev.selectedServices, serviceId]

      // Initialize config for newly selected services
      const newConfigs = { ...prev.serviceConfigs }
      if (!isSelected && !newConfigs[serviceId]) {
        newConfigs[serviceId] = {
          complexity: 'simple',
          features: [],
          description: '',
          hasDesign: null,
        }
      }

      return {
        ...prev,
        selectedServices: newServices,
        serviceConfigs: newConfigs,
      }
    })
  }

  const updateServiceConfig = (serviceId: string, field: keyof ServiceConfig, value: ServiceConfig[keyof ServiceConfig]) => {
    setFormData(prev => ({
      ...prev,
      serviceConfigs: {
        ...prev.serviceConfigs,
        [serviceId]: {
          ...prev.serviceConfigs[serviceId],
          [field]: value,
        },
      },
    }))
  }

  const toggleServiceFeature = (serviceId: string, featureId: string) => {
    setFormData(prev => {
      const config = prev.serviceConfigs[serviceId]
      const features = config.features.includes(featureId)
        ? config.features.filter(f => f !== featureId)
        : [...config.features, featureId]

      return {
        ...prev,
        serviceConfigs: {
          ...prev.serviceConfigs,
          [serviceId]: { ...config, features },
        },
      }
    })
  }

  // Calculate quote
  const quote = useMemo(() => {
    let oneTimeTotal = 0
    let monthlyTotal = 0
    let requiresCustomQuote = false
    const breakdown: { service: string; amount: number; isMonthly: boolean; note?: string }[] = []

    formData.selectedServices.forEach(serviceId => {
      const service = SERVICES.find(s => s.id === serviceId)
      const config = formData.serviceConfigs[serviceId]
      if (!service || !config) return

      const complexity = COMPLEXITY_LEVELS.find(c => c.id === config.complexity)
      if (!complexity) return

      // Enterprise = custom quote
      if (complexity.multiplier === 0) {
        requiresCustomQuote = true
        breakdown.push({
          service: service.label,
          amount: 0,
          isMonthly: !!service.isMonthly,
          note: 'Custom quote required'
        })
        return
      }

      // Base price with complexity multiplier
      let baseAmount = service.basePrice * complexity.multiplier
      let monthlyAmount = 0

      // Add feature costs
      const serviceFeatures = FEATURES[serviceId as keyof typeof FEATURES] || []
      config.features.forEach(featureId => {
        const feature = serviceFeatures.find(f => f.id === featureId)
        if (feature) {
          if (feature.requiresQuote) {
            requiresCustomQuote = true
          } else if (feature.monthly) {
            monthlyAmount += feature.priceAdd
          } else {
            baseAmount += feature.priceAdd
          }
        }
      })

      if (service.isMonthly) {
        monthlyTotal += baseAmount + monthlyAmount
        breakdown.push({ service: service.label, amount: baseAmount + monthlyAmount, isMonthly: true })
      } else {
        oneTimeTotal += baseAmount
        if (monthlyAmount > 0) {
          monthlyTotal += monthlyAmount
        }
        breakdown.push({ service: service.label, amount: baseAmount, isMonthly: false })
      }
    })

    // Apply timeline multiplier
    const timeline = TIMELINES.find(t => t.id === formData.timeline)
    if (timeline) {
      oneTimeTotal *= timeline.multiplier
    }

    return {
      oneTime: Math.round(oneTimeTotal),
      monthly: Math.round(monthlyTotal),
      requiresCustomQuote,
      breakdown,
    }
  }, [formData.selectedServices, formData.serviceConfigs, formData.timeline])

  const canProceedStep1 = formData.name && formData.email && formData.selectedServices.length > 0
  const canProceedStep2 = formData.selectedServices.every(s => {
    const config = formData.serviceConfigs[s]
    return config && config.complexity
  })
  const canSubmit = canProceedStep1 && canProceedStep2 && formData.timeline

  const handleSubmit = async () => {
    if (!canSubmit) return

    setSubmitting(true)
    setError('')

    try {
      // Convert to API format
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        serviceType: formData.selectedServices.join(', '),
        services: formData.selectedServices,
        serviceConfigs: formData.serviceConfigs,
        timeline: formData.timeline,
        description: formData.additionalInfo,
        referenceLinks: formData.referenceLinks,
        estimatedQuote: {
          oneTime: quote.oneTime,
          monthly: quote.monthly,
          requiresCustomQuote: quote.requiresCustomQuote,
        },
      }

      const res = await fetch('/api/service-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  // Service icon component
  const ServiceIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'globe':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        )
      case 'app':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'apple':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
        )
      case 'android':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-1.4-.59-2.94-.92-4.47-.92s-3.07.33-4.47.92L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25S6.31 12.75 7 12.75s1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z"/>
          </svg>
        )
      case 'devices':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'ai':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611l-.628.105a9 9 0 01-2.507.222 9 9 0 01-2.507-.222l-.628-.105c-1.717-.293-2.299-2.379-1.067-3.611L14 15.3" />
          </svg>
        )
      default:
        return null
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

            {/* Quote Summary */}
            <div className="bg-surface border border-border rounded-xl p-6 mb-8 text-left">
              <h3 className="font-semibold mb-4">Your Estimated Quote</h3>
              {quote.requiresCustomQuote ? (
                <p className="text-text-secondary">
                  Based on your requirements, we&apos;ll prepare a custom quote for you.
                </p>
              ) : (
                <div className="space-y-2">
                  {quote.oneTime > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">One-time</span>
                      <span className="font-semibold">${quote.oneTime.toLocaleString()}</span>
                    </div>
                  )}
                  {quote.monthly > 0 && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Monthly</span>
                      <span className="font-semibold">${quote.monthly.toLocaleString()}/mo</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs text-text-muted mt-4">
                This is an estimate. Final pricing will be confirmed after we discuss your project in detail.
              </p>
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

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Start Your Project</h1>
            <p className="text-xl text-text-secondary">
              Tell us what you need and get an instant estimate.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-4">
              {[
                { num: 1, label: 'Services' },
                { num: 2, label: 'Details' },
                { num: 3, label: 'Review' },
              ].map((s, i) => (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <button
                      onClick={() => s.num < step && setStep(s.num)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                        step === s.num
                          ? 'bg-accent text-white'
                          : step > s.num
                            ? 'bg-green-500 text-white cursor-pointer'
                            : 'bg-surface border border-border text-text-secondary'
                      }`}
                    >
                      {step > s.num ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : s.num}
                    </button>
                    <span className="text-xs text-text-secondary mt-1 hidden sm:block">{s.label}</span>
                  </div>
                  {i < 2 && (
                    <div className={`w-12 sm:w-16 h-1 mx-2 rounded ${step > s.num ? 'bg-green-500' : 'bg-border'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              {/* Step 1: Select Services */}
              {step === 1 && (
                <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="text-2xl font-bold mb-2">What do you need?</h2>
                  <p className="text-text-secondary mb-6">Select all that apply</p>

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
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            formData.selectedServices.includes(service.id)
                              ? 'bg-accent text-white'
                              : 'bg-background text-text-secondary'
                          }`}>
                            <ServiceIcon type={service.icon} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{service.label}</div>
                            <div className="text-sm text-text-secondary">{service.description}</div>
                            <div className="text-xs text-text-muted mt-1">
                              Starting at ${service.basePrice.toLocaleString()}{service.isMonthly ? '/mo' : ''}
                            </div>
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

                  <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Company</label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                        className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                        placeholder="Your company name"
                      />
                    </div>
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

              {/* Step 2: Service Details */}
              {step === 2 && (
                <div className="space-y-6">
                  {formData.selectedServices.map((serviceId) => {
                    const service = SERVICES.find(s => s.id === serviceId)
                    const config = formData.serviceConfigs[serviceId]
                    const features = FEATURES[serviceId as keyof typeof FEATURES] || []

                    if (!service || !config) return null

                    return (
                      <div key={serviceId} className="bg-surface border border-border rounded-2xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 rounded-lg bg-accent text-white">
                            <ServiceIcon type={service.icon} />
                          </div>
                          <h2 className="text-xl font-bold">{service.label}</h2>
                        </div>

                        {/* Complexity */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-3">Project complexity</label>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {COMPLEXITY_LEVELS.map((level) => (
                              <button
                                key={level.id}
                                type="button"
                                onClick={() => updateServiceConfig(serviceId, 'complexity', level.id)}
                                className={`p-3 text-left rounded-lg border transition-all ${
                                  config.complexity === level.id
                                    ? 'border-accent bg-accent/10'
                                    : 'border-border hover:border-accent/50'
                                }`}
                              >
                                <div className="font-medium text-sm">{level.label}</div>
                                <div className="text-xs text-text-secondary">{level.description}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Features */}
                        {features.length > 0 && (
                          <div className="mb-6">
                            <label className="block text-sm font-medium mb-3">Features needed</label>
                            <div className="flex flex-wrap gap-2">
                              {features.map((feature) => (
                                <button
                                  key={feature.id}
                                  type="button"
                                  onClick={() => toggleServiceFeature(serviceId, feature.id)}
                                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                                    config.features.includes(feature.id)
                                      ? 'border-accent bg-accent/10 text-accent'
                                      : 'border-border hover:border-accent/50'
                                  }`}
                                >
                                  {feature.label}
                                  {feature.priceAdd > 0 && !feature.requiresQuote && (
                                    <span className="text-text-muted ml-1">
                                      (+${feature.priceAdd.toLocaleString()}{feature.monthly ? '/mo' : ''})
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Design */}
                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-3">Do you have designs?</label>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => updateServiceConfig(serviceId, 'hasDesign', true)}
                              className={`flex-1 py-3 rounded-lg border transition-all text-sm ${
                                config.hasDesign === true
                                  ? 'border-accent bg-accent/10'
                                  : 'border-border hover:border-accent/50'
                              }`}
                            >
                              Yes, I have designs
                            </button>
                            <button
                              type="button"
                              onClick={() => updateServiceConfig(serviceId, 'hasDesign', false)}
                              className={`flex-1 py-3 rounded-lg border transition-all text-sm ${
                                config.hasDesign === false
                                  ? 'border-accent bg-accent/10'
                                  : 'border-border hover:border-accent/50'
                              }`}
                            >
                              No, I need design help
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Tell us more about this {service.label.toLowerCase()}
                          </label>
                          <textarea
                            value={config.description}
                            onChange={(e) => updateServiceConfig(serviceId, 'description', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none resize-none text-sm"
                            placeholder="Describe what you're looking to build..."
                          />
                        </div>
                      </div>
                    )
                  })}

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

              {/* Step 3: Review & Timeline */}
              {step === 3 && (
                <div className="bg-surface border border-border rounded-2xl p-6 md:p-8">
                  <h2 className="text-2xl font-bold mb-6">Almost done!</h2>

                  {/* Timeline */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-3">When do you need this?</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TIMELINES.map((timeline) => (
                        <button
                          key={timeline.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, timeline: timeline.id }))}
                          className={`py-3 px-4 rounded-lg border text-sm transition-all ${
                            formData.timeline === timeline.id
                              ? 'border-accent bg-accent/10'
                              : 'border-border hover:border-accent/50'
                          }`}
                        >
                          {timeline.label}
                          {timeline.multiplier !== 1 && (
                            <span className="block text-xs text-text-muted">
                              {timeline.multiplier > 1 ? '+25% rush fee' : timeline.multiplier === 0.95 ? '5% discount' : '10% discount'}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reference Links */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">
                      Reference websites or apps (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.referenceLinks}
                      onChange={(e) => setFormData(prev => ({ ...prev, referenceLinks: e.target.value }))}
                      className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:border-accent focus:outline-none"
                      placeholder="e.g., stripe.com, airbnb.com"
                    />
                  </div>

                  {/* Additional Info */}
                  <div className="mb-8">
                    <label className="block text-sm font-medium mb-2">Anything else we should know?</label>
                    <textarea
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
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

            {/* Quote Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-surface border border-border rounded-2xl p-6 sticky top-24">
                <h3 className="text-lg font-bold mb-4">Your Estimate</h3>

                {formData.selectedServices.length === 0 ? (
                  <p className="text-text-secondary text-sm">
                    Select services to see an estimate.
                  </p>
                ) : quote.requiresCustomQuote ? (
                  <div>
                    <p className="text-2xl font-bold mb-2">Custom Quote</p>
                    <p className="text-text-secondary text-sm mb-4">
                      Your project requires a custom quote. We&apos;ll review your requirements and get back to you with detailed pricing.
                    </p>
                  </div>
                ) : (
                  <div>
                    {quote.oneTime > 0 && (
                      <div className="mb-4">
                        <p className="text-3xl font-bold">${quote.oneTime.toLocaleString()}</p>
                        <p className="text-text-secondary text-sm">one-time</p>
                      </div>
                    )}
                    {quote.monthly > 0 && (
                      <div className="mb-4">
                        <p className="text-2xl font-bold">${quote.monthly.toLocaleString()}<span className="text-lg font-normal text-text-secondary">/mo</span></p>
                        <p className="text-text-secondary text-sm">recurring</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Breakdown */}
                {formData.selectedServices.length > 0 && (
                  <div className="border-t border-border pt-4 mt-4">
                    <p className="text-sm font-medium mb-3">Selected Services</p>
                    <ul className="space-y-2">
                      {formData.selectedServices.map(serviceId => {
                        const service = SERVICES.find(s => s.id === serviceId)
                        const breakdownItem = quote.breakdown.find(b => b.service === service?.label)
                        return (
                          <li key={serviceId} className="flex justify-between text-sm">
                            <span className="text-text-secondary">{service?.label}</span>
                            {breakdownItem?.note ? (
                              <span className="text-text-muted text-xs">{breakdownItem.note}</span>
                            ) : breakdownItem ? (
                              <span>${breakdownItem.amount.toLocaleString()}{breakdownItem.isMonthly ? '/mo' : ''}</span>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-xs text-text-muted">
                    This is an estimate based on your selections. Final pricing will be confirmed after we discuss your project requirements in detail.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
