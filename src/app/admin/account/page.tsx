'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import SignaturePad from 'signature_pad'

type CreateMode = 'draw' | 'type' | 'upload'

const SIGNATURE_FONTS = [
  { name: 'Dancing Script', style: 'cursive' },
  { name: 'Great Vibes', style: 'cursive' },
  { name: 'Allura', style: 'cursive' },
  { name: 'Pacifico', style: 'cursive' },
]

interface User {
  id: string
  name: string | null
  email: string | null
  username: string | null
  phone: string | null
  title: string | null
  image: string | null
  role: string
  permissions: string[] | null
  emailAccess: string[] | null
  backupEmail: string | null
  isFounder: boolean
  emailVerified: string | null
  signatureUrl: string | null
  initialsUrl: string | null
  zohoConnected: boolean
  createdAt: string
  updatedAt: string
  lastSession: { expires: string } | null
  teamMember: {
    id: string
    employeeNumber: string
    name: string
    email: string
    workEmail: string | null
    phone: string | null
    address: string | null
    dateOfBirth: string | null
    title: string
    department: string | null
    startDate: string
    endDate: string | null
    status: string
    salaryType: string
    salaryAmount: number | null
    salaryFrequency: string | null
    equityPercentage: number | null
    equityNotes: string | null
  } | null
  client: {
    id: string
    clientNumber: string
    name: string
  } | null
  partner: {
    id: string
    partnerNumber: string
    name: string
  } | null
}

export default function MyAccountPage() {
  const { update: updateSession } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'signatures' | 'account'>('profile')

  // Profile form state
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [backupEmail, setBackupEmail] = useState('')

  // Profile image state
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [pendingImageUpload, setPendingImageUpload] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Signature state
  const [editingSignature, setEditingSignature] = useState(false)
  const [editingInitials, setEditingInitials] = useState(false)
  const [createMode, setCreateMode] = useState<CreateMode>('draw')

  // Signature pad refs
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null)
  const initialsCanvasRef = useRef<HTMLCanvasElement>(null)
  const [signaturePad, setSignaturePad] = useState<SignaturePad | null>(null)
  const [initialsPad, setInitialsPad] = useState<SignaturePad | null>(null)

  // Typed signature state
  const [typedSignature, setTypedSignature] = useState('')
  const [typedInitials, setTypedInitials] = useState('')
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].name)

  // Upload state
  const signatureFileRef = useRef<HTMLInputElement>(null)
  const initialsFileRef = useRef<HTMLInputElement>(null)
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null)
  const [uploadedInitials, setUploadedInitials] = useState<string | null>(null)

  // MotoRev state
  const [motorevStatus, setMotorevStatus] = useState<{
    connected: boolean
    hasAffiliate: boolean
    affiliate?: {
      id: string
      affiliateCode: string
      motorevUserId: string | null
      motorevEmail: string | null
      motorevUsername: string | null
      motorevProfilePicture: string | null
      connectedAt: string | null
      rewardPreference: string
      stats: {
        totalReferrals: number
        totalEarnings: number
        pendingEarnings: number
        proTimeEarnedDays: number
      }
      rates: {
        shopCommission: number
        proBonus: number
        retentionBonus: number
      }
      isPartner: boolean
    }
  } | null>(null)
  const [motorevLoading, setMotorevLoading] = useState(false)
  const [oauthPopup, setOauthPopup] = useState<Window | null>(null)

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

  // Fetch user profile
  useEffect(() => {
    fetchProfile()
    fetchMotorevStatus()
  }, [])

  const fetchMotorevStatus = async () => {
    try {
      const res = await fetch('/api/account/motorev')
      if (res.ok) {
        const data = await res.json()
        setMotorevStatus(data)
      }
    } catch (error) {
      console.error('Error fetching MotoRev status:', error)
    }
  }

  const connectMotorev = async () => {
    setMotorevLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/motorev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-token' }),
      })

      if (res.ok) {
        const data = await res.json()

        // Open OAuth popup to MotoRev
        const popupWidth = 480
        const popupHeight = 640
        const left = window.screenX + (window.outerWidth - popupWidth) / 2
        const top = window.screenY + (window.outerHeight - popupHeight) / 2

        const motorevConnectUrl = `https://motorevapp.com/connect-47i.html?token=${encodeURIComponent(data.token)}&state=${encodeURIComponent(user?.id || '')}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/account/motorev/callback')}`

        const popup = window.open(
          motorevConnectUrl,
          'motorev-connect',
          `width=${popupWidth},height=${popupHeight},left=${left},top=${top},popup=yes,toolbar=no,menubar=no`
        )

        setOauthPopup(popup)

        // Listen for OAuth callback message from popup
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'motorev-oauth-success') {
            window.removeEventListener('message', handleMessage)
            setOauthPopup(null)
            setMotorevLoading(false)

            // Save the connection data
            await fetch('/api/account/motorev/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(event.data.data),
            })

            // Refresh status
            await fetchMotorevStatus()
            setMessage({ type: 'success', text: 'MotoRev account connected successfully!' })
          } else if (event.data?.type === 'motorev-oauth-cancel') {
            window.removeEventListener('message', handleMessage)
            setOauthPopup(null)
            setMotorevLoading(false)
            setMessage({ type: 'error', text: 'Connection cancelled' })
          }
        }

        window.addEventListener('message', handleMessage)

        // Also check if popup was closed without completing
        const checkPopupClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopupClosed)
            window.removeEventListener('message', handleMessage)
            setOauthPopup(null)
            setMotorevLoading(false)
          }
        }, 500)

      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to generate connection' })
        setMotorevLoading(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
      setMotorevLoading(false)
    }
  }

  const disconnectMotorev = async () => {
    if (!confirm('Are you sure you want to disconnect your MotoRev account?')) return

    setMotorevLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/motorev', {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchMotorevStatus()
        setConnectionLink(null)
        setMessage({ type: 'success', text: 'MotoRev account disconnected' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to disconnect' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setMotorevLoading(false)
    }
  }

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

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/account/profile')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setName(data.user.name || '')
        setUsername(data.user.username || '')
        setPhone(data.user.phone || '')
        setTitle(data.user.title || '')
        setBackupEmail(data.user.backupEmail || '')
        setPreviewImage(data.user.image || null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 5MB' })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setPreviewImage(result)
      setPendingImageUpload(result)
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          username: username.trim(),
          phone: phone.trim(),
          title: title.trim(),
          backupEmail: backupEmail.trim(),
          imageDataUrl: pendingImageUpload,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setUser(prev => prev ? { ...prev, ...data.user } : null)
        setPendingImageUpload(null)
        setMessage({ type: 'success', text: 'Profile updated successfully' })
        // Refresh session to update header profile picture
        await updateSession()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
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
        setUser(prev => prev ? { ...prev, signatureUrl: data.signatureUrl } : null)
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
        setUser(prev => prev ? { ...prev, initialsUrl: data.initialsUrl } : null)
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
        setUser(prev => prev ? { ...prev, signatureUrl: null } : null)
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
        setUser(prev => prev ? { ...prev, initialsUrl: null } : null)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Failed to load account data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Account</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage your profile, signing credentials, and account settings</p>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'profile'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('signatures')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'signatures'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Signatures
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'account'
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Account Info
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Picture */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <div className="relative">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="w-24 h-24 rounded-xl object-cover border border-zinc-700"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-2xl font-bold">
                    {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </div>
                )}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <div className="text-sm text-zinc-400">
                <p>Click the camera icon to upload a new profile picture.</p>
                <p className="mt-1">Max file size: 5MB. Supported formats: JPG, PNG, GIF</p>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  placeholder="Your username"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Personal Email</label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-400 cursor-not-allowed"
                />
                <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Work Email</label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={user.teamMember?.workEmail || ''}
                    disabled
                    className="flex-1 px-4 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg text-zinc-400 cursor-not-allowed"
                    placeholder="No work email"
                  />
                  {user.teamMember?.workEmail && (
                    user.zohoConnected ? (
                      <span className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-400 whitespace-nowrap">
                        Zoho Connected
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded bg-zinc-700 text-zinc-400 whitespace-nowrap">
                        Not Connected
                      </span>
                    )
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  placeholder="Your phone number"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Job Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g., President, CEO"
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signatures Tab */}
      {activeTab === 'signatures' && (
        <div className="space-y-6">
          {/* Job Title for Signing */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4">Job Title / Position</h2>
            <p className="text-zinc-400 text-sm mb-4">
              This title will appear below your name when you sign contracts (e.g., "President", "CEO", "Managing Director").
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

          {/* Signature */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4">Signature</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Your saved signature will be used when you sign contracts. You can draw, type, or upload your signature.
            </p>

            {!editingSignature ? (
              <div className="space-y-4">
                {user.signatureUrl ? (
                  <div className="flex items-center gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <img
                        src={user.signatureUrl}
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
                      placeholder={user.name || 'Your name'}
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
                    onClick={() => {
                      setEditingSignature(false)
                      resetSignatureForm()
                    }}
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

          {/* Initials */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4">Initials</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Your saved initials can be used to initial individual pages of a contract.
            </p>

            {!editingInitials ? (
              <div className="space-y-4">
                {user.initialsUrl ? (
                  <div className="flex items-center gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <img
                        src={user.initialsUrl}
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
                    onClick={() => {
                      setEditingInitials(false)
                      resetInitialsForm()
                    }}
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
      )}

      {/* Account Info Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Role & Access */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4">Role & Access</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Account Role</label>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-md text-sm font-medium ${
                    user.role === 'SUPER_ADMIN'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {user.role.replace('_', ' ')}
                  </span>
                  {user.isFounder && (
                    <span className="px-3 py-1 rounded-md text-sm font-medium bg-amber-500/20 text-amber-400">
                      Founder
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email Verified</label>
                <span className={`text-sm ${user.emailVerified ? 'text-green-400' : 'text-zinc-500'}`}>
                  {user.emailVerified ? 'Verified' : 'Not verified'}
                </span>
              </div>
            </div>

            {user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm text-zinc-400 mb-2">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((permission: string) => (
                    <span
                      key={permission}
                      className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.emailAccess && Array.isArray(user.emailAccess) && user.emailAccess.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm text-zinc-400 mb-2">Email Access</label>
                <div className="flex flex-wrap gap-2">
                  {user.emailAccess.map((email: string) => (
                    <span
                      key={email}
                      className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Employment Details - Only for team members */}
          {user.teamMember && (
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold text-white mb-4">Employment Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Title</label>
                  <p className="text-white">{user.teamMember.title}</p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Department</label>
                  <p className="text-white">{user.teamMember.department || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Start Date</label>
                  <p className="text-white">
                    {new Date(user.teamMember.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">End Date</label>
                  <p className="text-white">
                    {user.teamMember.endDate
                      ? new Date(user.teamMember.endDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'UTC',
                        })
                      : 'Current'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Status</label>
                  <span className={`px-2 py-1 rounded text-sm ${
                    user.teamMember.status === 'ACTIVE'
                      ? 'bg-green-500/20 text-green-400'
                      : user.teamMember.status === 'ON_LEAVE'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-zinc-700 text-zinc-400'
                  }`}>
                    {user.teamMember.status}
                  </span>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Employee Number</label>
                  <p className="text-white font-mono">{user.teamMember.employeeNumber}</p>
                </div>
              </div>
            </div>
          )}

          {/* Compensation - Only for team members */}
          {user.teamMember && (
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold text-white mb-4">Compensation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Salary Type</label>
                  <p className="text-white">{user.teamMember.salaryType || 'NONE'}</p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Salary Amount</label>
                  <p className="text-white text-xl font-semibold">
                    {user.teamMember.salaryAmount
                      ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(user.teamMember.salaryAmount))
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Frequency</label>
                  <p className="text-white">{user.teamMember.salaryFrequency || '-'}</p>
                </div>
                {user.teamMember.equityPercentage && (
                  <div>
                    <label className="block text-sm text-zinc-400 mb-1">Equity</label>
                    <p className="text-white">{user.teamMember.equityPercentage}%</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Account Status */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4">Account Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Account Created</label>
                <p className="text-white">
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Last Updated</label>
                <p className="text-white">
                  {new Date(user.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              {user.lastSession && (
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Session Expires</label>
                  <p className="text-white">
                    {new Date(user.lastSession.expires).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Zoho Integration</label>
                <span className={`text-sm ${user.zohoConnected ? 'text-green-400' : 'text-zinc-500'}`}>
                  {user.zohoConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>
            </div>
          </div>

          {/* Linked Accounts */}
          {(user.teamMember || user.client || user.partner) && (
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-lg font-semibold text-white mb-4">Linked Accounts</h2>
              <div className="space-y-3">
                {user.teamMember && (
                  <Link
                    href={`/admin/team/${user.teamMember.id}`}
                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Team Member</p>
                        <p className="text-sm text-zinc-400">
                          {user.teamMember.employeeNumber} - {user.teamMember.title}
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
                {user.client && (
                  <Link
                    href={`/admin/clients/${user.client.id}`}
                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Client Account</p>
                        <p className="text-sm text-zinc-400">
                          {user.client.clientNumber} - {user.client.name}
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
                {user.partner && (
                  <Link
                    href={`/admin/partners/${user.partner.id}`}
                    className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium">Partner Account</p>
                        <p className="text-sm text-zinc-400">
                          {user.partner.partnerNumber} - {user.partner.name}
                        </p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* MotoRev Connection */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://motorevapp.com/images/favicon.png"
                alt="MotoRev"
                className="w-10 h-10 rounded-xl"
              />
              <div>
                <h2 className="text-lg font-semibold text-white">MotoRev Connection</h2>
                <p className="text-sm text-zinc-400">Link your MotoRev account to earn rewards</p>
              </div>
            </div>

            {motorevStatus?.connected ? (
              <div className="space-y-4">
                {/* Connected MotoRev Profile */}
                {motorevStatus.affiliate && (
                  <a
                    href={`https://motorevapp.com/rider/${motorevStatus.affiliate.motorevUsername || motorevStatus.affiliate.motorevUserId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-xl hover:border-[#0066FF]/50 transition-colors cursor-pointer"
                  >
                    {motorevStatus.affiliate.motorevProfilePicture ? (
                      <img
                        src={motorevStatus.affiliate.motorevProfilePicture}
                        alt="MotoRev Profile"
                        className="w-14 h-14 rounded-full object-cover border-2 border-[#0066FF]/50"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#0066FF] flex items-center justify-center text-white text-lg font-bold">
                        {motorevStatus.affiliate.motorevUsername?.[0]?.toUpperCase() || 'M'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-white font-bold">
                          @{motorevStatus.affiliate.motorevUsername || 'MotoRev User'}
                        </p>
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-zinc-400">{motorevStatus.affiliate.motorevEmail}</p>
                    </div>
                    <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                {motorevStatus.affiliate && (
                  <>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-zinc-400">Referral Code</p>
                        <p className="font-mono font-bold text-lg text-white">{motorevStatus.affiliate.affiliateCode}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Connected Since</p>
                        <p className="text-white">
                          {motorevStatus.affiliate.connectedAt
                            ? new Date(motorevStatus.affiliate.connectedAt).toLocaleDateString()
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-400">Reward Preference</p>
                        <p className="text-white">
                          {motorevStatus.affiliate.rewardPreference === 'CASH' ? 'Cash' : 'Pro Time'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-zinc-800 rounded-lg p-4">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-white">{motorevStatus.affiliate.stats.totalReferrals}</p>
                          <p className="text-xs text-zinc-400">Referrals</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-400">
                            ${motorevStatus.affiliate.stats.totalEarnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-zinc-400">Earned</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-yellow-400">
                            ${motorevStatus.affiliate.stats.pendingEarnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-zinc-400">Pending</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-400">
                            {motorevStatus.affiliate.stats.proTimeEarnedDays}d
                          </p>
                          <p className="text-xs text-zinc-400">Pro Time</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={disconnectMotorev}
                      disabled={motorevLoading}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      {motorevLoading ? 'Disconnecting...' : 'Disconnect MotoRev'}
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-zinc-400 text-sm">
                  Connect your MotoRev account to earn rewards when you refer new users.
                </p>

                {motorevStatus?.hasAffiliate && motorevStatus?.affiliate && (
                  <div className="bg-zinc-800 rounded-lg p-4">
                    <p className="text-sm text-zinc-400 mb-1">Your Referral Code</p>
                    <p className="font-mono font-bold text-lg text-white">{motorevStatus.affiliate.affiliateCode}</p>
                  </div>
                )}

                {oauthPopup && (
                  <div className="bg-[#0066FF]/10 border border-[#0066FF]/30 rounded-lg p-4">
                    <p className="text-sm text-[#0066FF] mb-2">Complete the connection in the popup window</p>
                    <p className="text-xs text-zinc-400">
                      Sign in to your MotoRev account in the popup to complete the connection.
                    </p>
                  </div>
                )}

                <button
                  onClick={connectMotorev}
                  disabled={motorevLoading}
                  className="px-6 py-2 bg-[#0066FF] text-white rounded-lg hover:bg-[#0052CC] transition-colors disabled:opacity-50 font-medium"
                >
                  {motorevLoading ? 'Connecting...' : 'Connect MotoRev Account'}
                </button>
              </div>
            )}
          </div>

          {/* Account ID */}
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <h2 className="text-lg font-semibold text-white mb-4">Technical Details</h2>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">User ID</label>
              <code className="text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">{user.id}</code>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
