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
  role: string
}

interface AdminContractSigningModalProps {
  contractId: string
  contractTitle: string
  contractFileUrl: string
  signatureType: 'admin' | 'client' | 'partner' // admin = countersign, client/partner = primary signature
  apiEndpoint: string // e.g., '/api/admin/contracts/[id]/sign-pdf' or '/api/admin/partners/[id]/contract/sign-pdf'
  onSuccess: () => void
  onClose: () => void
}

export default function AdminContractSigningModal({
  contractId,
  contractTitle,
  contractFileUrl,
  signatureType,
  apiEndpoint,
  onSuccess,
  onClose,
}: AdminContractSigningModalProps) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [showPdfSigner, setShowPdfSigner] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAdmins()
  }, [])

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

  const handleProceed = () => {
    if (!selectedAdmin) {
      setError('Please select who is signing')
      return
    }
    setShowPdfSigner(true)
  }

  const handleSave = async (signedPdfBlob: Blob, signerName: string, signatureDataUrl: string) => {
    const formData = new FormData()
    formData.append('signedPdf', signedPdfBlob, 'signed-contract.pdf')
    formData.append('signerName', signerName)
    formData.append('signatureDataUrl', signatureDataUrl)
    formData.append('signatureType', signatureType === 'partner' ? 'partner' : signatureType)

    const res = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const result = await res.json()
      throw new Error(result.error || 'Failed to save signed contract')
    }

    onSuccess()
  }

  // Show PDF signer if admin is selected and user clicked proceed
  if (showPdfSigner) {
    return (
      <InteractivePdfSigner
        pdfUrl={contractFileUrl}
        contractTitle={`${contractTitle} - Signing as ${selectedAdmin?.name || selectedAdmin?.email}`}
        onSave={handleSave}
        onClose={() => setShowPdfSigner(false)}
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
                      <div className="flex items-center gap-2">
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
