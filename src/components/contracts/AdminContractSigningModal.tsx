'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues
const InteractivePdfSigner = dynamic(
  () => import('./InteractivePdfSigner'),
  { ssr: false, loading: () => (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-zinc-400">Loading document...</p>
      </div>
    </div>
  )}
)

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
  const [existingSignatureFields, setExistingSignatureFields] = useState<SignatureField[]>([])

  useEffect(() => {
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
    initialsDataUrl?: string,
    _signerCompany?: string, // Not used for admin signing
    _signerEmail?: string // Not used for admin signing
  ) => {
    // Send JSON body with signatures and placeholders
    const res = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signerName,
        signerTitle,
        signatureDataUrl,
        initialsDataUrl,
        signatureType: signatureType === 'partner' ? 'partner' : signatureType,
        adminSignedElements,
        placeholderElements,
      }),
    })

    if (!res.ok) {
      const result = await res.json()
      throw new Error(result.error || 'Failed to save signed contract')
    }

    onSuccess()
  }

  // Go directly to the PDF signer - no admin selection needed
  return (
    <InteractivePdfSigner
      pdfUrl={contractFileUrl}
      contractTitle={contractTitle}
      contractId={contractId}
      clientId={clientId}
      onSave={handleSave}
      onClose={onClose}
      existingSignatureFields={existingSignatureFields}
    />
  )
}
