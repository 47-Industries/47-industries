"use client"

import { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolder, faFile, faTrash } from '@fortawesome/free-solid-svg-icons'

interface UploadedFile {
  name: string
  size: number
  url: string
}

// Pricing calculator
const MATERIAL_PRICES = {
  'PLA': 0.02,
  'ABS': 0.025,
  'PETG': 0.03,
  'Nylon': 0.05,
  'TPU (Flexible)': 0.06,
  'Resin': 0.08,
}

const FINISH_MULTIPLIERS = {
  'Standard': 1,
  'Smooth': 1.3,
  'High Detail': 1.5,
  'Painted': 2,
}

const COLOR_PRICES = {
  'Black': 0,
  'White': 0,
  'Gray': 0,
  'Red': 2,
  'Blue': 2,
  'Green': 2,
  'Yellow': 2,
  'Custom': 5,
}

export default function Custom3DPrintingForm() {
  const [formData, setFormData] = useState({
    website_url: '', // Honeypot field
    name: '',
    email: '',
    phone: '',
    company: '',
    material: 'PLA',
    finish: 'Standard',
    color: 'Black',
    quantity: 1,
    notes: '',
    description: '', // New: text description when no file
    // Add-ons
    expedited: false,
    assembly: false,
    packaging: false,
  })
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [requestNumber, setRequestNumber] = useState('')
  const [estimatedCost, setEstimatedCost] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // Calculate estimated cost
  useEffect(() => {
    const materialCost = MATERIAL_PRICES[formData.material as keyof typeof MATERIAL_PRICES] || 0.02
    const finishMultiplier = FINISH_MULTIPLIERS[formData.finish as keyof typeof FINISH_MULTIPLIERS] || 1
    const colorCost = COLOR_PRICES[formData.color as keyof typeof COLOR_PRICES] || 0

    // Base cost calculation (simplified - actual would use file volume)
    const baseCost = uploadedFile ? 15 : 10 // Lower base if no file (just consultation)
    const cost = (baseCost + colorCost) * finishMultiplier * materialCost * 100 * formData.quantity

    let addOnCost = 0
    if (formData.expedited) addOnCost += cost * 0.5 // 50% rush fee
    if (formData.assembly) addOnCost += formData.quantity * 10
    if (formData.packaging) addOnCost += formData.quantity * 5

    setEstimatedCost(Math.ceil(cost + addOnCost))
  }, [formData.material, formData.finish, formData.color, formData.quantity, formData.expedited, formData.assembly, formData.packaging, uploadedFile])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB')
      return
    }

    // Validate file type
    const validExtensions = ['.stl', '.obj', '.step', '.stp']
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    if (!validExtensions.includes(ext)) {
      setError('Please upload a valid 3D file (.STL, .OBJ, .STEP)')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload-3d-file', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setUploadedFile({
          name: file.name,
          size: file.size,
          url: data.url,
        })
      } else {
        setError(data.error || 'Failed to upload file')
      }
    } catch {
      setError('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Either file OR description is required
    if (!uploadedFile && !formData.description.trim()) {
      setError('Please upload a 3D file OR provide a detailed description of what you need')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/custom-print-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileUrl: uploadedFile?.url || null,
          fileName: uploadedFile?.name || null,
          fileSize: uploadedFile?.size || null,
          estimatedCost,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setRequestNumber(data.requestNumber)
        setFormData({
          website_url: '',
          name: '',
          email: '',
          phone: '',
          company: '',
          material: 'PLA',
          finish: 'Standard',
          color: 'Black',
          quantity: 1,
          notes: '',
          description: '',
          expedited: false,
          assembly: false,
          packaging: false,
        })
        setUploadedFile(null)
      } else {
        setError(data.error || 'Failed to submit request. Please try again.')
      }
    } catch {
      setError('Failed to submit request. Please try again.')
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
        <h3 className="text-2xl font-bold mb-2">Quote Request Submitted!</h3>
        <p className="text-text-secondary mb-4">
          We will review your request and get back to you within 24-48 hours with a detailed quote.
        </p>
        <p className="text-sm text-text-muted mb-2">
          Reference: {requestNumber}
        </p>
        <p className="text-lg font-semibold text-accent">
          Estimated: ${estimatedCost}
        </p>
        <p className="text-xs text-text-muted mb-6">
          (Final quote may vary based on specifications)
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 px-6 py-2 border border-border rounded-lg hover:bg-surface transition-all"
        >
          Submit Another Request
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot field - hidden from humans, bots will fill it */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website_url_3d">Website URL</label>
        <input
          type="text"
          id="website_url_3d"
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
              placeholder="Company Name"
              disabled={submitting}
            />
          </div>
        </div>
      </div>

      {/* File Upload OR Description */}
      <div className="border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Your Design</h3>
        <p className="text-sm text-text-secondary mb-4">
          Upload a 3D file if you have one, or describe what you need and we'll help design it.
        </p>

        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">3D File (Optional)</label>
          {uploadedFile ? (
            <div className="border border-border rounded-lg p-4 flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <div className="text-2xl text-accent">
                  <FontAwesomeIcon icon={faFile} />
                </div>
                <div>
                  <p className="font-medium">{uploadedFile.name}</p>
                  <p className="text-sm text-text-secondary">{formatFileSize(uploadedFile.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
                disabled={submitting}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          ) : (
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${uploading ? 'border-accent bg-accent/5' : 'border-border hover:border-accent cursor-pointer'}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".stl,.obj,.step,.stp"
                className="hidden"
                id="file-upload"
                onChange={handleFileUpload}
                disabled={uploading || submitting}
              />
              <label htmlFor="file-upload" className={uploading ? '' : 'cursor-pointer'}>
                <div className="text-3xl mb-3 text-zinc-400">
                  <FontAwesomeIcon icon={faFolder} />
                </div>
                {uploading ? (
                  <p className="text-sm font-medium mb-2">Uploading...</p>
                ) : (
                  <>
                    <p className="text-sm font-medium mb-1">Drop your file here or click to browse</p>
                    <p className="text-xs text-text-secondary">Supports .STL, .OBJ, .STEP files (Max 50MB)</p>
                  </>
                )}
              </label>
            </div>
          )}
        </div>

        {/* Description Field (shows when no file) */}
        {!uploadedFile && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Or Describe What You Need {!uploadedFile && '*'}
            </label>
            <textarea
              required={!uploadedFile}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
              placeholder="Describe your project in detail: dimensions, purpose, features, materials, etc. We'll help you go from idea to product!"
              disabled={submitting}
            />
            <p className="text-xs text-text-muted mt-2">
              No 3D file? No problem! Describe your vision and we'll handle the design and manufacturing.
            </p>
          </div>
        )}
      </div>

      {/* Print Specifications */}
      <div className="border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Specifications</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Material *</label>
            <select
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
              disabled={submitting}
            >
              <option>PLA</option>
              <option>ABS</option>
              <option>PETG</option>
              <option>Nylon</option>
              <option>TPU (Flexible)</option>
              <option>Resin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Finish *</label>
            <select
              value={formData.finish}
              onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
              disabled={submitting}
            >
              <option>Standard</option>
              <option>Smooth</option>
              <option>High Detail</option>
              <option>Painted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Color *</label>
            <select
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
              disabled={submitting}
            >
              <option>Black</option>
              <option>White</option>
              <option>Gray</option>
              <option>Red</option>
              <option>Blue</option>
              <option>Green</option>
              <option>Yellow</option>
              <option>Custom</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Quantity *</label>
          <input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
            disabled={submitting}
          />
        </div>
      </div>

      {/* Add-On Services */}
      <div className="border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Add-On Services</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.expedited}
              onChange={(e) => setFormData({ ...formData, expedited: e.target.checked })}
              className="w-5 h-5 rounded border-border bg-surface accent-accent"
              disabled={submitting}
            />
            <div className="flex-1">
              <div className="font-medium">Expedited Production (+50%)</div>
              <div className="text-sm text-text-secondary">Rush delivery in 3-5 business days</div>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.assembly}
              onChange={(e) => setFormData({ ...formData, assembly: e.target.checked })}
              className="w-5 h-5 rounded border-border bg-surface accent-accent"
              disabled={submitting}
            />
            <div className="flex-1">
              <div className="font-medium">Assembly Services (+$10/unit)</div>
              <div className="text-sm text-text-secondary">We'll assemble multi-part prints for you</div>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.packaging}
              onChange={(e) => setFormData({ ...formData, packaging: e.target.checked })}
              className="w-5 h-5 rounded border-border bg-surface accent-accent"
              disabled={submitting}
            />
            <div className="flex-1">
              <div className="font-medium">Premium Packaging (+$5/unit)</div>
              <div className="text-sm text-text-secondary">Custom branded packaging for your parts</div>
            </div>
          </label>
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium mb-2">Additional Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent resize-none"
          placeholder="Any special requirements, deadlines, or questions..."
          disabled={submitting}
        />
      </div>

      {/* Estimated Cost */}
      {estimatedCost > 0 && (
        <div className="border border-accent/30 bg-accent/5 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Estimated Total</h3>
              <p className="text-sm text-text-secondary">Final quote will be provided within 24-48 hours</p>
            </div>
            <div className="text-3xl font-bold text-accent">
              ${estimatedCost}
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full py-4 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Get Custom Quote'}
      </button>

      <p className="text-xs text-text-muted text-center">
        By submitting this form, you agree to our terms of service and privacy policy.
      </p>
    </form>
  )
}
