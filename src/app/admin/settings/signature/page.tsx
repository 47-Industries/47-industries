'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import SignaturePad from 'signature_pad'

type CreateMode = 'draw' | 'type' | 'upload'

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', style: 'cursive' },
  { name: 'Great Vibes', style: 'cursive' },
  { name: 'Allura', style: 'cursive' },
  { name: 'Pacifico', style: 'cursive' },
]

export default function SignatureSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // User data
  const [title, setTitle] = useState('')
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [initialsUrl, setInitialsUrl] = useState<string | null>(null)
  const [userName, setUserName] = useState('')

  // Edit mode
  const [editingSignature, setEditingSignature] = useState(false)
  const [editingInitials, setEditingInitials] = useState(false)
  const [createMode, setCreateMode] = useState<CreateMode>('draw')

  // Signature pad
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const initialsCanvasRef = useRef<HTMLCanvasElement>(null)
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null)
  const [initialsPad, setInitialsPad] = useState<SignaturePad | null>(null)

  // Typed signature
  const [typedSignature, setTypedSignature] = useState('')
  const [typedInitials, setTypedInitials] = useState('')
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].name)

  // Upload
  const signatureFileRef = useRef<HTMLInputElement>(null)
  const initialsFileRef = useRef<HTMLInputElement>(null)
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null)
  const [uploadedInitials, setUploadedInitials] = useState<string | null>(null)

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script&family=Great+Vibes&family=Allura&family=Pacifico&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // Initialize signature pads when editing
  useEffect(() => {
    if (editingSignature && createMode === 'draw' && signatureCanvasRef.current && !signaturePad) {
      const canvas = signatureCanvasRef.current
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(2, 2)
      }

      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      })
      setSignaturePad(pad)
    }
  }, [editingSignature, createMode, signaturePad])

  useEffect(() => {
    if (editingInitials && createMode === 'draw' && initialsCanvasRef.current && !initialsPad) {
      const canvas = initialsCanvasRef.current
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(2, 2)
      }

      const pad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
      })
      setInitialsPad(pad)
    }
  }, [editingInitials, createMode, initialsPad])

  // Fetch current user's signature data
  useEffect(() => {
    fetchSignatureData()
  }, [])

  const fetchSignatureData = async () => {
    try {
      const res = await fetch('/api/account/signature')
      if (res.ok) {
        const data = await res.json()
        setTitle(data.title || '')
        setSignatureUrl(data.signatureUrl || null)
        setInitialsUrl(data.initialsUrl || null)
        setUserName(data.name || '')
      }
    } catch (error) {
      console.error('Error fetching signature data:', error)
      setMessage({ type: 'error', text: 'Failed to load signature data' })
    } finally {
      setLoading(false)
    }
  }

  const saveTitle = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/account/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Title saved successfully' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save title' })
      }
    } catch (error) {
      console.error('Error saving title:', error)
      setMessage({ type: 'error', text: 'Failed to save title' })
    } finally {
      setSaving(false)
    }
  }

  const textToDataUrl = (text: string, font: string, width: number = 400, height: number = 100): string => {
    const canvas = document.createElement('canvas')
    canvas.width = width * 2
    canvas.height = height * 2
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''

    ctx.scale(2, 2)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = 'black'
    ctx.font = `48px "${font}"`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, height / 2)

    return canvas.toDataURL('image/png')
  }

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setUploaded: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setUploaded(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const saveSignature = async () => {
    setSaving(true)
    setMessage(null)

    let dataUrl: string | null = null

    if (createMode === 'draw' && signaturePad) {
      if (signaturePad.isEmpty()) {
        setMessage({ type: 'error', text: 'Please draw your signature' })
        setSaving(false)
        return
      }
      dataUrl = signaturePad.toDataURL('image/png')
    } else if (createMode === 'type') {
      if (!typedSignature.trim()) {
        setMessage({ type: 'error', text: 'Please enter your signature' })
        setSaving(false)
        return
      }
      dataUrl = textToDataUrl(typedSignature, selectedFont)
    } else if (createMode === 'upload') {
      if (!uploadedSignature) {
        setMessage({ type: 'error', text: 'Please upload a signature image' })
        setSaving(false)
        return
      }
      dataUrl = uploadedSignature
    }

    if (!dataUrl) {
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/account/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signatureDataUrl: dataUrl }),
      })

      if (res.ok) {
        const data = await res.json()
        setSignatureUrl(data.signatureUrl)
        setEditingSignature(false)
        resetSignatureForm()
        setMessage({ type: 'success', text: 'Signature saved successfully' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save signature' })
      }
    } catch (error) {
      console.error('Error saving signature:', error)
      setMessage({ type: 'error', text: 'Failed to save signature' })
    } finally {
      setSaving(false)
    }
  }

  const saveInitials = async () => {
    setSaving(true)
    setMessage(null)

    let dataUrl: string | null = null

    if (createMode === 'draw' && initialsPad) {
      if (initialsPad.isEmpty()) {
        setMessage({ type: 'error', text: 'Please draw your initials' })
        setSaving(false)
        return
      }
      dataUrl = initialsPad.toDataURL('image/png')
    } else if (createMode === 'type') {
      if (!typedInitials.trim()) {
        setMessage({ type: 'error', text: 'Please enter your initials' })
        setSaving(false)
        return
      }
      dataUrl = textToDataUrl(typedInitials, selectedFont, 200, 100)
    } else if (createMode === 'upload') {
      if (!uploadedInitials) {
        setMessage({ type: 'error', text: 'Please upload an initials image' })
        setSaving(false)
        return
      }
      dataUrl = uploadedInitials
    }

    if (!dataUrl) {
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/account/signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialsDataUrl: dataUrl }),
      })

      if (res.ok) {
        const data = await res.json()
        setInitialsUrl(data.initialsUrl)
        setEditingInitials(false)
        resetInitialsForm()
        setMessage({ type: 'success', text: 'Initials saved successfully' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to save initials' })
      }
    } catch (error) {
      console.error('Error saving initials:', error)
      setMessage({ type: 'error', text: 'Failed to save initials' })
    } finally {
      setSaving(false)
    }
  }

  const deleteSignature = async () => {
    if (!confirm('Are you sure you want to delete your saved signature?')) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/signature', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'signature' }),
      })

      if (res.ok) {
        setSignatureUrl(null)
        setMessage({ type: 'success', text: 'Signature deleted' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to delete signature' })
      }
    } catch (error) {
      console.error('Error deleting signature:', error)
      setMessage({ type: 'error', text: 'Failed to delete signature' })
    } finally {
      setSaving(false)
    }
  }

  const deleteInitials = async () => {
    if (!confirm('Are you sure you want to delete your saved initials?')) return

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/signature', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'initials' }),
      })

      if (res.ok) {
        setInitialsUrl(null)
        setMessage({ type: 'success', text: 'Initials deleted' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to delete initials' })
      }
    } catch (error) {
      console.error('Error deleting initials:', error)
      setMessage({ type: 'error', text: 'Failed to delete initials' })
    } finally {
      setSaving(false)
    }
  }

  const resetSignatureForm = () => {
    setSignaturePad(null)
    setTypedSignature('')
    setUploadedSignature(null)
    setCreateMode('draw')
    if (signatureFileRef.current) {
      signatureFileRef.current.value = ''
    }
  }

  const resetInitialsForm = () => {
    setInitialsPad(null)
    setTypedInitials('')
    setUploadedInitials(null)
    setCreateMode('draw')
    if (initialsFileRef.current) {
      initialsFileRef.current.value = ''
    }
  }

  const cancelEditSignature = () => {
    setEditingSignature(false)
    resetSignatureForm()
  }

  const cancelEditInitials = () => {
    setEditingInitials(false)
    resetInitialsForm()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/settings"
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Signature Settings</h1>
          <p className="text-zinc-400 text-sm">Manage your signing credentials for contracts</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/30 text-green-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Title Section */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h2 className="text-lg font-semibold text-white mb-4">Job Title / Position</h2>
        <p className="text-zinc-400 text-sm mb-4">
          This title will appear below your name when you sign contracts (e.g., &quot;President&quot;, &quot;CEO&quot;, &quot;Managing Director&quot;).
        </p>
        <div className="flex gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter your job title"
            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={saveTitle}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
          >
            {saving ? 'Saving...' : 'Save Title'}
          </button>
        </div>
      </div>

      {/* Signature Section */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h2 className="text-lg font-semibold text-white mb-4">Signature</h2>
        <p className="text-zinc-400 text-sm mb-4">
          Your saved signature will be used when you sign contracts. You can draw, type, or upload your signature.
        </p>

        {!editingSignature ? (
          <div className="space-y-4">
            {signatureUrl ? (
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-lg p-4">
                  <img
                    src={signatureUrl}
                    alt="Your signature"
                    className="max-h-20 w-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingSignature(true)}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    onClick={deleteSignature}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingSignature(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Signature
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCreateMode('draw')
                  setSignaturePad(null)
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  createMode === 'draw'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Draw
              </button>
              <button
                onClick={() => setCreateMode('type')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  createMode === 'type'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Type
              </button>
              <button
                onClick={() => setCreateMode('upload')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  createMode === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Upload
              </button>
            </div>

            {/* Draw Mode */}
            {createMode === 'draw' && (
              <div className="space-y-3">
                <div className="relative bg-white rounded-lg" style={{ height: '150px' }}>
                  <canvas
                    ref={signatureCanvasRef}
                    className="w-full h-full rounded-lg cursor-crosshair"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <button
                  onClick={() => signaturePad?.clear()}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Type Mode */}
            {createMode === 'type' && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder={userName || 'Your name'}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                />
                <div className="flex gap-2 flex-wrap">
                  {SIGNATURE_FONTS.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => setSelectedFont(font.name)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedFont === font.name
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                      style={{ fontFamily: `"${font.name}", ${font.style}` }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
                {typedSignature && (
                  <div className="bg-white rounded-lg p-4 text-center">
                    <span
                      className="text-4xl text-black"
                      style={{ fontFamily: `"${selectedFont}", cursive` }}
                    >
                      {typedSignature}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Upload Mode */}
            {createMode === 'upload' && (
              <div className="space-y-4">
                <input
                  ref={signatureFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setUploadedSignature)}
                  className="hidden"
                />
                <button
                  onClick={() => signatureFileRef.current?.click()}
                  className="w-full px-6 py-8 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  Click to upload signature image (PNG, JPG)
                </button>
                {uploadedSignature && (
                  <div className="bg-white rounded-lg p-4 flex justify-center">
                    <img
                      src={uploadedSignature}
                      alt="Uploaded signature"
                      className="max-h-24 w-auto"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={cancelEditSignature}
                className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSignature}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? 'Saving...' : 'Save Signature'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Initials Section */}
      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h2 className="text-lg font-semibold text-white mb-4">Initials</h2>
        <p className="text-zinc-400 text-sm mb-4">
          Your saved initials can be used to initial individual pages of a contract.
        </p>

        {!editingInitials ? (
          <div className="space-y-4">
            {initialsUrl ? (
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-lg p-4">
                  <img
                    src={initialsUrl}
                    alt="Your initials"
                    className="max-h-16 w-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingInitials(true)}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    onClick={deleteInitials}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingInitials(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Initials
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCreateMode('draw')
                  setInitialsPad(null)
                }}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  createMode === 'draw'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Draw
              </button>
              <button
                onClick={() => setCreateMode('type')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  createMode === 'type'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Type
              </button>
              <button
                onClick={() => setCreateMode('upload')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  createMode === 'upload'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                Upload
              </button>
            </div>

            {/* Draw Mode */}
            {createMode === 'draw' && (
              <div className="space-y-3">
                <div className="relative bg-white rounded-lg" style={{ height: '100px', maxWidth: '200px' }}>
                  <canvas
                    ref={initialsCanvasRef}
                    className="w-full h-full rounded-lg cursor-crosshair"
                    style={{ touchAction: 'none' }}
                  />
                </div>
                <button
                  onClick={() => initialsPad?.clear()}
                  className="text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Type Mode */}
            {createMode === 'type' && (
              <div className="space-y-4">
                <input
                  type="text"
                  value={typedInitials}
                  onChange={(e) => setTypedInitials(e.target.value.toUpperCase())}
                  placeholder="e.g., JD"
                  maxLength={4}
                  className="w-32 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 uppercase"
                />
                <div className="flex gap-2 flex-wrap">
                  {SIGNATURE_FONTS.map((font) => (
                    <button
                      key={font.name}
                      onClick={() => setSelectedFont(font.name)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        selectedFont === font.name
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                      style={{ fontFamily: `"${font.name}", ${font.style}` }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
                {typedInitials && (
                  <div className="bg-white rounded-lg p-4 inline-block">
                    <span
                      className="text-3xl text-black"
                      style={{ fontFamily: `"${selectedFont}", cursive` }}
                    >
                      {typedInitials}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Upload Mode */}
            {createMode === 'upload' && (
              <div className="space-y-4">
                <input
                  ref={initialsFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setUploadedInitials)}
                  className="hidden"
                />
                <button
                  onClick={() => initialsFileRef.current?.click()}
                  className="px-6 py-8 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
                  style={{ maxWidth: '200px' }}
                >
                  Click to upload initials image
                </button>
                {uploadedInitials && (
                  <div className="bg-white rounded-lg p-4 inline-block">
                    <img
                      src={uploadedInitials}
                      alt="Uploaded initials"
                      className="max-h-16 w-auto"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={cancelEditInitials}
                className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveInitials}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? 'Saving...' : 'Save Initials'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
