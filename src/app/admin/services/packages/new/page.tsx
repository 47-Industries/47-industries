'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const CATEGORY_GROUPS = [
  {
    label: 'Web',
    options: [
      { value: 'WEBSITE', label: 'Website', desc: 'Marketing sites, landing pages, blogs' },
      { value: 'WEB_APP', label: 'Web Application', desc: 'SaaS, dashboards, portals' },
      { value: 'ECOMMERCE', label: 'E-Commerce', desc: 'Online stores, marketplaces' },
    ],
  },
  {
    label: 'Mobile',
    options: [
      { value: 'IOS_APP', label: 'iOS App', desc: 'Native iPhone/iPad apps' },
      { value: 'ANDROID_APP', label: 'Android App', desc: 'Native Android apps' },
      { value: 'CROSS_PLATFORM_APP', label: 'Cross-Platform App', desc: 'React Native, Flutter' },
    ],
  },
  {
    label: 'Desktop',
    options: [
      { value: 'DESKTOP_APP', label: 'Desktop Application', desc: 'Windows, macOS, Linux' },
    ],
  },
  {
    label: 'Other Services',
    options: [
      { value: 'AI_SOLUTIONS', label: 'AI Solutions', desc: 'AI/ML, chatbots, automation' },
      { value: 'UI_UX_DESIGN', label: 'UI/UX Design', desc: 'Design-only packages' },
      { value: 'THREE_D_PRINTING', label: '3D Printing', desc: 'Custom 3D printing services' },
      { value: 'MAINTENANCE', label: 'Maintenance', desc: 'Ongoing support plans' },
      { value: 'CONSULTATION', label: 'Consultation', desc: 'Strategy, consulting' },
    ],
  },
]

const BILLING_TYPES = [
  { value: 'one_time', label: 'One-Time Payment' },
  { value: 'monthly', label: 'Monthly Subscription' },
  { value: 'yearly', label: 'Yearly Subscription' },
  { value: 'hourly', label: 'Hourly Rate' },
  { value: 'retainer', label: 'Monthly Retainer' },
]

const PLATFORM_OPTIONS = ['iOS', 'Android', 'Web', 'Windows', 'macOS', 'Linux']

const COMMON_TECH = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte',
  'React Native', 'Flutter', 'Swift', 'Kotlin',
  'Electron', 'Tauri',
  'Node.js', 'Python', 'Go', 'Rust',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  'AWS', 'Google Cloud', 'Azure', 'Vercel',
  'Stripe', 'Firebase', 'Supabase', 'Prisma',
]

const COMMON_DELIVERABLES = [
  'Source code',
  'Design files (Figma)',
  'Documentation',
  'Deployment guide',
  'Admin panel',
  'API documentation',
  'User manual',
  'Training session',
  'App store submission',
  'Domain setup',
  'SSL certificate',
  'Analytics setup',
]

interface IncludeSection {
  title: string
  items: string[]
}

export default function NewPackagePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    category: 'WEBSITE',
    // Pricing
    price: '',
    priceDisplay: '',
    billingType: 'one_time',
    priceNote: '',
    // Description
    shortDesc: '',
    description: '',
    features: [''],
    includes: [] as IncludeSection[],
    // Technical
    platforms: [] as string[],
    techStack: [] as string[],
    integrations: [] as string[],
    deliverables: [] as string[],
    // Support
    supportIncluded: '',
    revisionRounds: '',
    // Display
    isPopular: false,
    isActive: true,
    sortOrder: 0,
    badge: '',
    // Timing
    estimatedDays: '',
    estimatedWeeks: '',
  })

  const [newTech, setNewTech] = useState('')
  const [newIntegration, setNewIntegration] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  // Features
  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData(prev => ({ ...prev, features: newFeatures }))
  }

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }))
  }

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      setFormData(prev => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index),
      }))
    }
  }

  // Includes sections
  const addIncludeSection = () => {
    setFormData(prev => ({
      ...prev,
      includes: [...prev.includes, { title: '', items: [''] }],
    }))
  }

  const updateIncludeSectionTitle = (index: number, title: string) => {
    const newIncludes = [...formData.includes]
    newIncludes[index].title = title
    setFormData(prev => ({ ...prev, includes: newIncludes }))
  }

  const addIncludeItem = (sectionIndex: number) => {
    const newIncludes = [...formData.includes]
    newIncludes[sectionIndex].items.push('')
    setFormData(prev => ({ ...prev, includes: newIncludes }))
  }

  const updateIncludeItem = (sectionIndex: number, itemIndex: number, value: string) => {
    const newIncludes = [...formData.includes]
    newIncludes[sectionIndex].items[itemIndex] = value
    setFormData(prev => ({ ...prev, includes: newIncludes }))
  }

  const removeIncludeItem = (sectionIndex: number, itemIndex: number) => {
    const newIncludes = [...formData.includes]
    if (newIncludes[sectionIndex].items.length > 1) {
      newIncludes[sectionIndex].items.splice(itemIndex, 1)
      setFormData(prev => ({ ...prev, includes: newIncludes }))
    }
  }

  const removeIncludeSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      includes: prev.includes.filter((_, i) => i !== index),
    }))
  }

  // Platforms
  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }))
  }

  // Tech stack
  const addTech = (tech: string) => {
    if (tech.trim() && !formData.techStack.includes(tech.trim())) {
      setFormData(prev => ({ ...prev, techStack: [...prev.techStack, tech.trim()] }))
      setNewTech('')
    }
  }

  const removeTech = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech),
    }))
  }

  // Integrations
  const addIntegration = (integration: string) => {
    if (integration.trim() && !formData.integrations.includes(integration.trim())) {
      setFormData(prev => ({ ...prev, integrations: [...prev.integrations, integration.trim()] }))
      setNewIntegration('')
    }
  }

  const removeIntegration = (integration: string) => {
    setFormData(prev => ({
      ...prev,
      integrations: prev.integrations.filter(i => i !== integration),
    }))
  }

  // Deliverables
  const toggleDeliverable = (deliverable: string) => {
    setFormData(prev => ({
      ...prev,
      deliverables: prev.deliverables.includes(deliverable)
        ? prev.deliverables.filter(d => d !== deliverable)
        : [...prev.deliverables, deliverable],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Clean up includes - remove empty sections and items
      const cleanedIncludes = formData.includes
        .filter(section => section.title.trim())
        .map(section => ({
          title: section.title.trim(),
          items: section.items.filter(item => item.trim()),
        }))
        .filter(section => section.items.length > 0)

      const res = await fetch('/api/admin/services/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: formData.price ? parseFloat(formData.price) : null,
          features: formData.features.filter(f => f.trim()),
          includes: cleanedIncludes.length > 0 ? cleanedIncludes : null,
          platforms: formData.platforms.length > 0 ? formData.platforms : null,
          techStack: formData.techStack.length > 0 ? formData.techStack : null,
          integrations: formData.integrations.length > 0 ? formData.integrations : null,
          deliverables: formData.deliverables.length > 0 ? formData.deliverables : null,
          revisionRounds: formData.revisionRounds ? parseInt(formData.revisionRounds) : null,
          estimatedDays: formData.estimatedDays ? parseInt(formData.estimatedDays) : null,
          estimatedWeeks: formData.estimatedWeeks ? parseInt(formData.estimatedWeeks) : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create package')
      }

      router.push('/admin/services')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/services"
          className="p-2 hover:bg-surface rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Service Package</h1>
          <p className="text-text-secondary">Create a pricing package for websites, apps, or other services</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-xl p-4 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Package Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Starter, Professional, Enterprise"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Badge (optional)</label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  placeholder="e.g., Most Popular, Best Value"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Service Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              >
                {CATEGORY_GROUPS.map(group => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label} - {cat.desc}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Short Description *</label>
              <input
                type="text"
                name="shortDesc"
                required
                value={formData.shortDesc}
                onChange={handleChange}
                maxLength={500}
                placeholder="Brief one-liner about this package"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-text-secondary mt-1">{formData.shortDesc.length}/500 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Full Description *</label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Detailed description of what this package offers and who it's for"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Pricing</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Price (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">$</span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="Leave empty for custom quote"
                  className="w-full pl-8 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <p className="text-xs text-text-secondary mt-1">Leave empty to show &quot;Custom Quote&quot;</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Billing Type</label>
              <select
                name="billingType"
                value={formData.billingType}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              >
                {BILLING_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Display Price Override</label>
              <input
                type="text"
                name="priceDisplay"
                value={formData.priceDisplay}
                onChange={handleChange}
                placeholder='e.g., "Starting at $2,500" or "From $99/mo"'
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Price Note</label>
              <input
                type="text"
                name="priceNote"
                value={formData.priceNote}
                onChange={handleChange}
                placeholder='e.g., "Billed annually" or "Per user"'
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Key Features</h2>
              <p className="text-sm text-text-secondary">Bullet points shown on pricing cards</p>
            </div>
            <button
              type="button"
              onClick={addFeature}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              + Add Feature
            </button>
          </div>
          <div className="space-y-3">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(index, e.target.value)}
                  placeholder={`Feature ${index + 1}`}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">What&apos;s Included</h2>
              <p className="text-sm text-text-secondary">Detailed breakdown by category (e.g., Design, Development, Support)</p>
            </div>
            <button
              type="button"
              onClick={addIncludeSection}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              + Add Section
            </button>
          </div>
          {formData.includes.length === 0 ? (
            <p className="text-text-secondary text-sm py-4 text-center">
              No sections added yet. Click &quot;Add Section&quot; to create detailed breakdowns.
            </p>
          ) : (
            <div className="space-y-6">
              {formData.includes.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-border rounded-lg p-4">
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateIncludeSectionTitle(sectionIndex, e.target.value)}
                      placeholder="Section title (e.g., Design, Development)"
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => removeIncludeSection(sectionIndex)}
                      className="px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2 pl-4">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex gap-2">
                        <span className="text-text-secondary mt-2">•</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateIncludeItem(sectionIndex, itemIndex, e.target.value)}
                          placeholder={`Item ${itemIndex + 1}`}
                          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                        {section.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeIncludeItem(sectionIndex, itemIndex)}
                            className="px-2 py-1 text-red-400 hover:bg-red-500/10 rounded transition-colors text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addIncludeItem(sectionIndex)}
                      className="text-xs text-blue-400 hover:text-blue-300 pl-4"
                    >
                      + Add item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Details */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Technical Details</h2>

          {/* Platforms */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Target Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORM_OPTIONS.map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => togglePlatform(platform)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    formData.platforms.includes(platform)
                      ? 'bg-blue-500 text-white'
                      : 'bg-surface-elevated border border-border hover:border-blue-500/50'
                  }`}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Tech Stack</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTech}
                onChange={(e) => setNewTech(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTech(newTech))}
                placeholder="Add technology..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => addTech(newTech)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.techStack.map(tech => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center gap-2"
                >
                  {tech}
                  <button type="button" onClick={() => removeTech(tech)} className="hover:text-red-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {COMMON_TECH.filter(t => !formData.techStack.includes(t)).slice(0, 12).map(tech => (
                <button
                  key={tech}
                  type="button"
                  onClick={() => addTech(tech)}
                  className="px-2 py-1 text-xs bg-surface-elevated border border-border rounded hover:border-blue-500/50 transition-colors"
                >
                  + {tech}
                </button>
              ))}
            </div>
          </div>

          {/* Integrations */}
          <div>
            <label className="block text-sm font-medium mb-2">Integrations Included</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newIntegration}
                onChange={(e) => setNewIntegration(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIntegration(newIntegration))}
                placeholder="Add integration (e.g., Stripe, Firebase)..."
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => addIntegration(newIntegration)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
            </div>
            {formData.integrations.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.integrations.map(integration => (
                  <span
                    key={integration}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm flex items-center gap-2"
                  >
                    {integration}
                    <button type="button" onClick={() => removeIntegration(integration)} className="hover:text-red-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deliverables */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Deliverables</h2>
          <p className="text-sm text-text-secondary mb-3">What the client receives upon completion</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {COMMON_DELIVERABLES.map(deliverable => (
              <label
                key={deliverable}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  formData.deliverables.includes(deliverable)
                    ? 'bg-blue-500/20 border border-blue-500/50'
                    : 'bg-surface-elevated border border-border hover:border-blue-500/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.deliverables.includes(deliverable)}
                  onChange={() => toggleDeliverable(deliverable)}
                  className="sr-only"
                />
                <span className={`w-4 h-4 rounded flex items-center justify-center ${
                  formData.deliverables.includes(deliverable)
                    ? 'bg-blue-500 text-white'
                    : 'border border-border'
                }`}>
                  {formData.deliverables.includes(deliverable) && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm">{deliverable}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Support & Timeline */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Support & Timeline</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Support Included</label>
              <input
                type="text"
                name="supportIncluded"
                value={formData.supportIncluded}
                onChange={handleChange}
                placeholder="e.g., 30 days, 3 months, 1 year"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Revision Rounds</label>
              <input
                type="number"
                name="revisionRounds"
                value={formData.revisionRounds}
                onChange={handleChange}
                min="0"
                placeholder="e.g., 3"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Estimated Days</label>
              <input
                type="number"
                name="estimatedDays"
                value={formData.estimatedDays}
                onChange={handleChange}
                min="1"
                placeholder="e.g., 14"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Or Estimated Weeks</label>
              <input
                type="number"
                name="estimatedWeeks"
                value={formData.estimatedWeeks}
                onChange={handleChange}
                min="1"
                placeholder="e.g., 4-6"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Display Settings</h2>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sort Order</label>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-text-secondary mt-1">Lower numbers appear first</p>
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isPopular"
                checked={formData.isPopular}
                onChange={handleChange}
                className="w-5 h-5 rounded border-border bg-background text-blue-500 focus:ring-blue-500"
              />
              <span>Mark as Popular</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="w-5 h-5 rounded border-border bg-background text-blue-500 focus:ring-blue-500"
              />
              <span>Active (visible on site)</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Package'}
          </button>
          <Link
            href="/admin/services"
            className="px-6 py-3 bg-surface border border-border rounded-xl font-medium hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
