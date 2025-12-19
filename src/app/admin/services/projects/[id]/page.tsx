'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const CATEGORIES = [
  { value: 'WEB_DEVELOPMENT', label: 'Web Development' },
  { value: 'WEB_APP', label: 'Web Application' },
  { value: 'IOS_APP', label: 'iOS App' },
  { value: 'ANDROID_APP', label: 'Android App' },
  { value: 'CROSS_PLATFORM_APP', label: 'Cross-Platform App' },
  { value: 'AI_AUTOMATION', label: 'AI Automation' },
  { value: 'DESKTOP_APP', label: 'Desktop App' },
  { value: 'THREE_D_PRINTING', label: '3D Printing' },
]

interface ProjectImage {
  url: string
  type: 'mobile' | 'desktop'
}

interface ProjectData {
  id: string
  title: string
  slug: string
  category: string
  categories: string[] | null
  clientName: string
  clientLogo: string | null
  description: string
  challenge: string | null
  solution: string | null
  results: string | null
  thumbnailUrl: string | null
  images: (string | ProjectImage)[] | null
  videoUrl: string | null
  liveUrl: string | null
  accentColor: string | null
  technologies: string[] | null
  testimonial: string | null
  testimonialAuthor: string | null
  testimonialRole: string | null
  isFeatured: boolean
  showInNavbar: boolean
  isActive: boolean
  sortOrder: number
}

// Helper to normalize images - handles both old string format and new object format
function normalizeImages(images: (string | ProjectImage)[] | null): ProjectImage[] {
  if (!images) return []
  return images.map(img => {
    if (typeof img === 'string') {
      return { url: img, type: 'mobile' as const }
    }
    return img
  })
}

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    category: 'WEB_DEVELOPMENT',
    categories: [] as string[],
    clientName: '',
    clientLogo: '',
    description: '',
    challenge: '',
    solution: '',
    results: '',
    thumbnailUrl: '',
    images: [] as ProjectImage[],
    videoUrl: '',
    liveUrl: '',
    accentColor: '',
    technologies: [] as string[],
    testimonial: '',
    testimonialAuthor: '',
    testimonialRole: '',
    isFeatured: false,
    showInNavbar: false,
    isActive: true,
    sortOrder: 0,
  })

  const [newTech, setNewTech] = useState('')
  const [uploadType, setUploadType] = useState<'mobile' | 'desktop'>('mobile')

  useEffect(() => {
    fetchProject()
  }, [id])

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/admin/services/projects/${id}`)
      if (!res.ok) {
        if (res.status === 404) {
          router.push('/admin/services')
          return
        }
        throw new Error('Failed to fetch project')
      }
      const data: ProjectData = await res.json()
      setFormData({
        title: data.title,
        category: data.category,
        categories: data.categories || [],
        clientName: data.clientName,
        clientLogo: data.clientLogo || '',
        description: data.description,
        challenge: data.challenge || '',
        solution: data.solution || '',
        results: data.results || '',
        thumbnailUrl: data.thumbnailUrl || '',
        images: normalizeImages(data.images),
        videoUrl: data.videoUrl || '',
        liveUrl: data.liveUrl || '',
        accentColor: data.accentColor || '',
        technologies: data.technologies || [],
        testimonial: data.testimonial || '',
        testimonialAuthor: data.testimonialAuthor || '',
        testimonialRole: data.testimonialRole || '',
        isFeatured: data.isFeatured,
        showInNavbar: data.showInNavbar,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const addTechnology = () => {
    if (newTech.trim() && !formData.technologies.includes(newTech.trim())) {
      setFormData(prev => ({ ...prev, technologies: [...prev.technologies, newTech.trim()] }))
      setNewTech('')
    }
  }

  const removeTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.filter(t => t !== tech),
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'thumbnailUrl' | 'clientLogo' | 'images') => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Determine the correct folder based on field type
    const folderMap: Record<string, string> = {
      thumbnailUrl: 'projects',
      clientLogo: 'logos',
      images: 'projects',
    }

    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formDataUpload = new FormData()
        formDataUpload.append('file', file)
        formDataUpload.append('folder', folderMap[field])

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formDataUpload,
        })

        if (!res.ok) throw new Error('Upload failed')

        const data = await res.json()

        if (field === 'images') {
          setFormData(prev => ({ ...prev, images: [...prev.images, { url: data.url, type: uploadType }] }))
        } else {
          setFormData(prev => ({ ...prev, [field]: data.url }))
        }
      }
    } catch (err) {
      setError('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img.url !== url),
    }))
  }

  const toggleImageType = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map(img =>
        img.url === url
          ? { ...img, type: img.type === 'mobile' ? 'desktop' : 'mobile' }
          : img
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/services/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          sortOrder: parseInt(String(formData.sortOrder)) || 0,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update project')
      }

      router.push('/admin/services')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/services/projects/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete project')
      }

      router.push('/admin/services')
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/services"
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Project</h1>
            <p className="text-text-secondary">{formData.title || 'Loading...'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Delete Project
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface border border-border rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Project?</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete &quot;{formData.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <label className="block text-sm font-medium mb-2">Project Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., E-Commerce Platform Redesign"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Primary Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multi-category selection */}
            <div>
              <label className="block text-sm font-medium mb-2">All Categories (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        categories: prev.categories.includes(cat.value)
                          ? prev.categories.filter(c => c !== cat.value)
                          : [...prev.categories, cat.value]
                      }))
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formData.categories.includes(cat.value)
                        ? 'bg-blue-500 text-white'
                        : 'bg-surface-elevated border border-border text-text-secondary hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-2">Select multiple categories if this project spans different service types</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client Name *</label>
                <input
                  type="text"
                  name="clientName"
                  required
                  value={formData.clientName}
                  onChange={handleChange}
                  placeholder="e.g., Acme Corporation"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Live URL</label>
                <input
                  type="url"
                  name="liveUrl"
                  value={formData.liveUrl}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Accent Color</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    name="accentColor"
                    value={formData.accentColor || '#3b82f6'}
                    onChange={handleChange}
                    className="h-12 w-20 rounded-lg cursor-pointer bg-background border border-border"
                  />
                  <input
                    type="text"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    placeholder="#3b82f6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1">Custom brand color for this project page (leave blank for default blue)</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Provide an overview of the project..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Case Study Details */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Case Study Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">The Challenge</label>
              <textarea
                name="challenge"
                value={formData.challenge}
                onChange={handleChange}
                rows={3}
                placeholder="What problems did the client face?"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">The Solution</label>
              <textarea
                name="solution"
                value={formData.solution}
                onChange={handleChange}
                rows={3}
                placeholder="How did you solve the problem?"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">The Results</label>
              <textarea
                name="results"
                value={formData.results}
                onChange={handleChange}
                rows={3}
                placeholder="What outcomes were achieved?"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Technologies */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Technologies Used</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTechnology())}
              placeholder="e.g., React, Node.js, AWS"
              className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={addTechnology}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add
            </button>
          </div>
          {formData.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.technologies.map(tech => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm flex items-center gap-2"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => removeTechnology(tech)}
                    className="hover:text-red-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Media */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Media</h2>
          <div className="space-y-6">
            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium mb-2">Thumbnail Image</label>
              <div className="flex items-start gap-4">
                {formData.thumbnailUrl ? (
                  <div className="relative w-40 h-24 rounded-lg overflow-hidden bg-surface-elevated">
                    <Image
                      src={formData.thumbnailUrl}
                      alt="Thumbnail"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, thumbnailUrl: '' }))}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="w-40 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                    <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-xs text-text-secondary mt-1">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'thumbnailUrl')}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="text-sm text-text-secondary">
                  <p>Recommended: 800x450px</p>
                  <p>Max 25MB, JPG or PNG</p>
                </div>
              </div>
            </div>

            {/* Client Logo */}
            <div>
              <label className="block text-sm font-medium mb-2">Client Logo</label>
              <div className="flex items-start gap-4">
                {formData.clientLogo ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-surface-elevated">
                    <Image
                      src={formData.clientLogo}
                      alt="Client Logo"
                      fill
                      className="object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, clientLogo: '' }))}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="w-24 h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                    <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="text-xs text-text-secondary mt-1">Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'clientLogo')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Gallery Images */}
            <div>
              <label className="block text-sm font-medium mb-2">Gallery Screenshots</label>
              <p className="text-xs text-text-secondary mb-3">Select whether each screenshot is from mobile or desktop before uploading</p>

              {/* Upload Type Selector */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setUploadType('mobile')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    uploadType === 'mobile'
                      ? 'bg-blue-500 text-white'
                      : 'bg-surface-elevated border border-border text-text-secondary hover:text-white'
                  }`}
                >
                  Mobile Screenshot
                </button>
                <button
                  type="button"
                  onClick={() => setUploadType('desktop')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    uploadType === 'desktop'
                      ? 'bg-blue-500 text-white'
                      : 'bg-surface-elevated border border-border text-text-secondary hover:text-white'
                  }`}
                >
                  Desktop Screenshot
                </button>
              </div>

              {/* Images Grid */}
              <div className="flex flex-wrap gap-4">
                {formData.images.map((img, index) => (
                  <div
                    key={index}
                    className={`relative rounded-lg overflow-hidden bg-surface-elevated ${
                      img.type === 'desktop' ? 'w-40 h-24' : 'w-16 h-28'
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={`Gallery ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {/* Type Badge */}
                    <button
                      type="button"
                      onClick={() => toggleImageType(img.url)}
                      className={`absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        img.type === 'desktop'
                          ? 'bg-purple-500/90 text-white'
                          : 'bg-green-500/90 text-white'
                      }`}
                      title="Click to change type"
                    >
                      {img.type === 'desktop' ? 'Desktop' : 'Mobile'}
                    </button>
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeImage(img.url)}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <label className={`border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors ${
                  uploadType === 'desktop' ? 'w-40 h-24' : 'w-16 h-28'
                }`}>
                  <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-[10px] text-text-secondary mt-1">{uploadType}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, 'images')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-sm font-medium mb-2">Video URL</label>
              <input
                type="url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
              <p className="text-xs text-text-secondary mt-1">YouTube or Vimeo URL</p>
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Client Testimonial</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Testimonial Quote</label>
              <textarea
                name="testimonial"
                value={formData.testimonial}
                onChange={handleChange}
                rows={3}
                placeholder="What did the client say about working with you?"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Author Name</label>
                <input
                  type="text"
                  name="testimonialAuthor"
                  value={formData.testimonialAuthor}
                  onChange={handleChange}
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Author Role</label>
                <input
                  type="text"
                  name="testimonialRole"
                  value={formData.testimonialRole}
                  onChange={handleChange}
                  placeholder="e.g., CEO at Acme Corp"
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Settings</h2>
          <div className="grid md:grid-cols-2 gap-4">
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
          <div className="flex flex-wrap gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                className="w-5 h-5 rounded border-border bg-background text-blue-500 focus:ring-blue-500"
              />
              <span>Featured Project</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="showInNavbar"
                checked={formData.showInNavbar}
                onChange={handleChange}
                className="w-5 h-5 rounded border-border bg-background text-blue-500 focus:ring-blue-500"
              />
              <span>Show in Navbar</span>
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
            disabled={saving || uploading}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : uploading ? 'Uploading...' : 'Save Changes'}
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
