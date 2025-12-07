"use client"

import { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolder, faFile, faTrash } from '@fortawesome/free-solid-svg-icons'

interface UploadedFile {
  name: string
  size: number
  url: string
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
  })
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [requestNumber, setRequestNumber] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

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
      formData.append('folder', 'custom-requests')

      const res = await fetch('/api/upload', {
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

    if (!uploadedFile) {
      setError('Please upload a 3D file')
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
          fileUrl: uploadedFile.url,
          fileName: uploadedFile.name,
          fileSize: uploadedFile.size,
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
          We will review your request and get back to you within 24-48 hours.
        </p>
        <p className="text-sm text-text-muted">
          Reference: {requestNumber}
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
      <div className="grid md:grid-cols-2 gap-6">
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
      </div>

      <div className="grid md:grid-cols-2 gap-6">
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

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium mb-2">3D File *</label>
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
          <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${uploading ? 'border-accent bg-accent/5' : 'border-border hover:border-accent cursor-pointer'}`}>
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
              <div className="text-4xl mb-4 text-zinc-400">
                <FontAwesomeIcon icon={faFolder} />
              </div>
              {uploading ? (
                <p className="text-lg font-medium mb-2">Uploading...</p>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">Drop your file here or click to browse</p>
                  <p className="text-sm text-text-secondary">Supports .STL, .OBJ, .STEP files (Max 50MB)</p>
                </>
              )}
            </label>
          </div>
        )}
      </div>

      {/* Print Specifications */}
      <div className="grid md:grid-cols-3 gap-6">
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

      <div>
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

      <button
        type="submit"
        disabled={submitting || uploading}
        className="w-full py-4 bg-text-primary text-background rounded-lg font-semibold hover:bg-text-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit Quote Request'}
      </button>
    </form>
  )
}
