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

interface ClientContractSigningModalProps {
  contractId: string
  contractTitle: string
  contractFileUrl: string
  apiEndpoint: string // e.g., '/api/account/client/contracts/[id]/sign' or '/api/account/client/amendments/[id]/sign'
  onSuccess: () => void
  onClose: () => void
  defaultName?: string
  defaultEmail?: string
  defaultCompany?: string
}

export default function ClientContractSigningModal({
  contractId,
  contractTitle,
  contractFileUrl,
  apiEndpoint,
  onSuccess,
  onClose,
  defaultName = '',
  defaultEmail = '',
  defaultCompany = '',
}: ClientContractSigningModalProps) {
  const [existingSignatureFields, setExistingSignatureFields] = useState<SignatureField[]>([])

  useEffect(() => {
    fetchExistingSignatureFields()
  }, [apiEndpoint])

  // Fetch existing signature fields from the contract (e.g., placeholders set by admin)
  const fetchExistingSignatureFields = async () => {
    try {
      const res = await fetch(apiEndpoint)
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
    signedElements: Array<{
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
      fieldId?: string
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
    // Convert signed elements to the format expected by the API
    const signedFields = signedElements
      .filter(el => el.dataUrl || el.text)
      .map(el => ({
        fieldId: el.fieldId || el.id,
        signatureDataUrl: el.dataUrl,
        value: el.text,
      }))

    // Send to client signing API
    const res = await fetch(apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedByName: signerName,
        signedByTitle: signerTitle,
        signedByCompany: defaultCompany || signerName,
        signedByEmail: defaultEmail,
        signatureDataUrl,
        signedFields,
      }),
    })

    if (!res.ok) {
      const result = await res.json()
      throw new Error(result.error || 'Failed to sign contract')
    }

    onSuccess()
  }

  // Go directly to the PDF signer
  return (
    <InteractivePdfSigner
      pdfUrl={contractFileUrl}
      contractTitle={contractTitle}
      contractId={contractId}
      onSave={handleSave}
      onClose={onClose}
      initialSignerName={defaultName}
      initialSignerTitle=""
      existingSignatureFields={existingSignatureFields}
      mode="sign"
      currentUserRole="client"
    />
  )
}
