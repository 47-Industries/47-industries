'use client'

import { useState, useEffect } from 'react'

interface Amendment {
  id?: string
  title: string
  description?: string | null
  additionalValue: number | string
  additionalMonthlyValue?: number | string | null
  effectiveDate?: string | null
}

interface AmendmentFormModalProps {
  amendment?: Amendment | null
  onSave: (data: {
    title: string
    description?: string
    additionalValue: number
    additionalMonthlyValue?: number
    effectiveDate?: string
  }) => Promise<void>
  onClose: () => void
}

export default function AmendmentFormModal({
  amendment,
  onSave,
  onClose,
}: AmendmentFormModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [additionalValue, setAdditionalValue] = useState('')
  const [additionalMonthlyValue, setAdditionalMonthlyValue] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEditing = !!amendment?.id

  useEffect(() => {
    if (amendment) {
      setTitle(amendment.title || '')
      setDescription(amendment.description || '')
      setAdditionalValue(amendment.additionalValue?.toString() || '')
      setAdditionalMonthlyValue(amendment.additionalMonthlyValue?.toString() || '')
      setEffectiveDate(
        amendment.effectiveDate
          ? new Date(amendment.effectiveDate).toISOString().split('T')[0]
          : ''
      )
    }
  }, [amendment])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    const numAdditionalValue = parseFloat(additionalValue)
    if (isNaN(numAdditionalValue) || numAdditionalValue < 0) {
      setError('Additional value must be a valid positive number')
      return
    }

    try {
      setSaving(true)
      setError('')

      const data: {
        title: string
        description?: string
        additionalValue: number
        additionalMonthlyValue?: number
        effectiveDate?: string
      } = {
        title: title.trim(),
        additionalValue: numAdditionalValue,
      }

      if (description.trim()) {
        data.description = description.trim()
      }

      if (additionalMonthlyValue) {
        const numMonthly = parseFloat(additionalMonthlyValue)
        if (!isNaN(numMonthly) && numMonthly > 0) {
          data.additionalMonthlyValue = numMonthly
        }
      }

      if (effectiveDate) {
        data.effectiveDate = effectiveDate
      }

      await onSave(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save amendment')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-lg">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Edit Amendment' : 'Create Amendment'}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2"
              disabled={saving}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Additional Feature Development"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the additional work covered by this amendment..."
              rows={3}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
              disabled={saving}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                One-Time Value ($) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={additionalValue}
                onChange={(e) => setAdditionalValue(e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Monthly Value ($)
              </label>
              <input
                type="number"
                value={additionalMonthlyValue}
                onChange={(e) => setAdditionalMonthlyValue(e.target.value)}
                placeholder="0 (optional)"
                min="0"
                step="0.01"
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Effective Date
            </label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              disabled={saving}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : isEditing ? (
                'Update Amendment'
              ) : (
                'Create Amendment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
