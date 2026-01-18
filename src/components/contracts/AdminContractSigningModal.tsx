'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues
const InteractivePdfSigner = dynamic(
  () => import('./InteractivePdfSigner'),
  { ssr: false }
)

interface Admin {
  id: string
  email: string
  name: string | null
  title: string | null
  role: string
  signatureUrl?: string | null
  initialsUrl?: string | null
}

interface SignatureField {
  id: string
  type: string
  pageNumber: number
  xPercent: number
  yPercent: number
  widthPercent: number
  heightPercent: number
  assignedTo: string
  assignedUserId?: string | null
  label?: string | null
  isSigned: boolean
  signatureUrl?: string | null
  signedValue?: string | null
  signedByName?: string | null
  signedAt?: string | null
}

interface AdminContractSigningModalProps {
  contractId: string
  contractTitle: string
  contractFileUrl: string
  signatureType: 'admin' | 'client' | 'partner' // admin = countersign, client/partner = primary signature
  apiEndpoint: string // e.g., '/api/admin/contracts/[id]/sign-pdf' or '/api/admin/partners/[id]/contract/sign-pdf'
  clientId?: string // Client ID for fetching signers
  onSuccess: () => void
  onClose: () => void
}

export default function AdminContractSigningModal({
  contractId,
  contractTitle,
  contractFileUrl,
  signatureType,
  apiEndpoint,
  clientId,
  onSuccess,
  onClose,
}: AdminContractSigningModalProps) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [showPdfSigner, setShowPdfSigner] = useState(false)
  const [savedSignatureDataUrl, setSavedSignatureDataUrl] = useState<string | null>(null)
  const [savedInitialsDataUrl, setSavedInitialsDataUrl] = useState<string | null>(null)
  const [savedTitle, setSavedTitle] = useState<string | null>(null)
  const [loadingSignature, setLoadingSignature] = useState(false)
  const [error, setError] = useState('')
  const [existingSignatureFields, setExistingSignatureFields] = useState<SignatureField[]>([])

  useEffect(() => {
    fetchAdmins()
    fetchExistingSignatureFields()
  }, [])

  // Fetch existing signature fields from the contract
  const fetchExistingSignatureFields = async () => {
    try {
      const res = await fetch(`/api/admin/contracts/${contractId}/signature-fields`)
      if (res.ok) {
        const data = await res.json()
        setExistingSignatureFields(data.signatureFields || [])
      }
    } catch (err) {
      console.error('Error fetching signature fields:', err)
    }
  }

  // Load saved signature, initials, and title when admin is selected
  useEffect(() => {
    if (selectedAdmin) {
      loadSavedSignature(selectedAdmin.id)
    } else {
      setSavedSignatureDataUrl(null)
      setSavedInitialsDataUrl(null)
      setSavedTitle(null)
    }
  }, [selectedAdmin])

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/users/admins')
      if (res.ok) {
        const data = await res.json()
        setAdmins(data.admins)
        // Auto-select first admin if only one
        if (data.admins.length === 1) {
          setSelectedAdmin(data.admins[0])
        }
      }
    } catch (err) {
      console.error('Error fetching admins:', err)
      setError('Failed to load admin users')
    } finally {
      setLoadingAdmins(false)
    }
  }

  const loadSavedSignature = async (userId: string) => {
    setLoadingSignature(true)
    setSavedSignatureDataUrl(null)
    setSavedInitialsDataUrl(null)
    setSavedTitle(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/signature`)
      if (res.ok) {
        const data = await res.json()

        // Load saved title
        if (data.title) {
          setSavedTitle(data.title)
        }

        // Load signature image
        if (data.signatureUrl) {
          // Convert URL to data URL for the signature pad
          const imgRes = await fetch(`/api/proxy/pdf?url=${encodeURIComponent(data.signatureUrl)}`)
          if (imgRes.ok) {
            const blob = await imgRes.blob()
            const reader = new FileReader()
            reader.onloadend = () => {
              setSavedSignatureDataUrl(reader.result as string)
            }
            reader.readAsDataURL(blob)
          }
        }

        // Load initials image
        if (data.initialsUrl) {
          const initialsRes = await fetch(`/api/proxy/pdf?url=${encodeURIComponent(data.initialsUrl)}`)
          if (initialsRes.ok) {
            const blob = await initialsRes.blob()
            const reader = new FileReader()
            reader.onloadend = () => {
              setSavedInitialsDataUrl(reader.result as string)
            }
            reader.readAsDataURL(blob)
          }
        }
      }
    } catch (err) {
      console.error('Error loading signature:', err)
    } finally {
      setLoadingSignature(false)
    }
  }

  const handleProceed = () => {
    if (!selectedAdmin) {
      setError('Please select who is signing')
      return
    }
    setShowPdfSigner(true)
  }

  const handleSave = async (
    signerName: string,
    signerTitle: string,
    signatureDataUrl: string,
    adminSignedElements: Array<{
      id: string
      type: string
      pageNumber: number
      x: number
      y: number
      width: number
      height?: number
      dataUrl?: string
      text?: string
      assignedTo?: string
      assignedUserId?: string
      label?: string
    }>,
    placeholderElements: Array<{
      id: string
      type: string
      pageNumber: number
      x: number
      y: number
      width: number
      height?: number
      assignedTo?: string
      assignedUserId?: string
      label?: string
    }>,
    initialsDataUrl?: string
  ) => {
    // Send JSON body with signatures and placeholders
    const res = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signerName,
        signerTitle,
        signatureDataUrl,
        signatureType: signatureType === 'partner' ? 'partner' : signatureType,
        adminSignedElements,
        placeholderElements,
      }),
    })

    if (!res.ok) {
      const result = await res.json()
      throw new Error(result.error || 'Failed to save signed contract')
    }

    // Save signature, initials, and title to user account if changed
    if (selectedAdmin) {
      const hasNewSignature = signatureDataUrl && signatureDataUrl !== savedSignatureDataUrl
      const hasNewInitials = initialsDataUrl && initialsDataUrl !== savedInitialsDataUrl
      const hasNewTitle = signerTitle && signerTitle !== savedTitle

      if (hasNewSignature || hasNewInitials || hasNewTitle) {
        try {
          const updateData: Record<string, string> = {}
          if (hasNewSignature) updateData.signatureDataUrl = signatureDataUrl
          if (hasNewInitials) updateData.initialsDataUrl = initialsDataUrl!
          if (hasNewTitle) updateData.title = signerTitle

          await fetch(`/api/admin/users/${selectedAdmin.id}/signature`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
          })
        } catch (err) {
          console.error('Failed to save signature data to account:', err)
          // Don't fail the whole operation for this
        }
      }
    }

    onSuccess()
  }

  // Show PDF signer if admin is selected and user clicked proceed
  if (showPdfSigner) {
    return (
      <InteractivePdfSigner
        pdfUrl={contractFileUrl}
        contractTitle={`${contractTitle} - Signing as ${selectedAdmin?.name || selectedAdmin?.email}`}
        contractId={contractId}
        clientId={clientId}
        onSave={handleSave}
        onClose={() => setShowPdfSigner(false)}
        initialSignerName={selectedAdmin?.name || ''}
        initialSignerTitle={savedTitle || selectedAdmin?.title || ''}
        initialSignatureDataUrl={savedSignatureDataUrl}
        initialInitialsDataUrl={savedInitialsDataUrl}
        existingSignatureFields={existingSignatureFields}
      />
    )
  }

  // Admin selection screen
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">
            {signatureType === 'admin' ? 'Admin Signature' : 'Sign Contract'}
          </h2>
          <p className="text-zinc-400 text-sm mt-1">{contractTitle}</p>
        </div>

        <div className="p-6">
          {loadingAdmins ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-zinc-400">Loading...</p>
            </div>
          ) : (
            <>
              <p className="text-zinc-300 mb-4">
                Select who is signing this contract:
              </p>

              {/* Admin Selection */}
              <div className="space-y-2 mb-6">
                {admins.map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => setSelectedAdmin(admin)}
                    className={`w-full p-4 rounded-lg border text-left transition-colors ${
                      selectedAdmin?.id === admin.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">
                          {admin.name || admin.email}
                        </p>
                        <p className="text-sm text-zinc-400">{admin.email}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {admin.signatureUrl && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            Signature
                          </span>
                        )}
                        {admin.initialsUrl && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                            Initials
                          </span>
                        )}
                        {admin.title && (
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                            {admin.title}
                          </span>
                        )}
                        {admin.role === 'SUPER_ADMIN' && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                            Super Admin
                          </span>
                        )}
                        {selectedAdmin?.id === admin.id && (
                          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProceed}
                  disabled={!selectedAdmin}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    selectedAdmin
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  Proceed to Sign
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
