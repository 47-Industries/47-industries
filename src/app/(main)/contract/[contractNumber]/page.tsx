'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'

// Dynamic imports to avoid SSR issues with PDF.js
const ContractViewer = dynamic(
  () => import('@/components/contracts/ContractViewer'),
  { ssr: false, loading: () => <div className="p-8 text-center text-zinc-400">Loading viewer...</div> }
)

const SignatureCapture = dynamic(
  () => import('@/components/contracts/SignatureCapture'),
  { ssr: false }
)

interface Contract {
  id: string
  contractNumber: string
  title: string
  description?: string
  fileUrl?: string
  totalValue: number
  monthlyValue?: number
  status: string
  signedAt?: string
  signedByName?: string
  annotations?: any[]
  client: {
    name: string
  }
}

interface Annotation {
  id: string
  page: number
  type: 'highlight' | 'comment'
  x: number
  y: number
  width?: number
  height?: number
  color?: string
  text?: string
  createdAt: string
}

export default function ContractSignPage({ params }: { params: Promise<{ contractNumber: string }> }) {
  const { contractNumber } = use(params)
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [showSignature, setShowSignature] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signing, setSigning] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)

  useEffect(() => {
    fetchContract()
  }, [contractNumber])

  async function fetchContract() {
    try {
      const res = await fetch(`/api/contracts/${contractNumber}`)
      if (res.ok) {
        const data = await res.json()
        setContract(data.contract)
        setAnnotations(data.contract.annotations || [])
      } else {
        setError('Contract not found')
      }
    } catch (err) {
      setError('Failed to load contract')
    } finally {
      setLoading(false)
    }
  }

  const handleAnnotationAdd = async (annotation: Omit<Annotation, 'id' | 'createdAt'>) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: `ann_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }

    const updatedAnnotations = [...annotations, newAnnotation]
    setAnnotations(updatedAnnotations)

    // Save to server
    try {
      await fetch(`/api/contracts/${contractNumber}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations: updatedAnnotations }),
      })
    } catch (err) {
      console.error('Failed to save annotation:', err)
    }
  }

  const handleSignatureCapture = (dataUrl: string) => {
    setSignatureData(dataUrl)
    setShowSignature(false)
  }

  const handleSign = async () => {
    if (!signerName.trim() || !signerEmail.trim() || !signatureData) return

    setSigning(true)
    try {
      const res = await fetch(`/api/contracts/${contractNumber}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerName: signerName.trim(),
          signerEmail: signerEmail.trim(),
          signatureData,
          annotations,
        }),
      })

      if (res.ok) {
        // Refresh contract data
        await fetchContract()
        setSignatureData(null)
        setSignerName('')
        setSignerEmail('')
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to sign contract')
      }
    } catch (err) {
      alert('Failed to sign contract')
    } finally {
      setSigning(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-400">Loading contract...</p>
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Contract not found'}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            Return home
          </Link>
        </div>
      </div>
    )
  }

  const isSigned = contract.status === 'SIGNED' || contract.status === 'ACTIVE'
  const canSign = contract.status === 'SENT' && contract.fileUrl

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{contract.title}</h1>
              <p className="text-zinc-400 text-sm">
                {contract.contractNumber} | {contract.client.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">{formatCurrency(Number(contract.totalValue))}</p>
              {contract.monthlyValue && Number(contract.monthlyValue) > 0 && (
                <p className="text-sm text-zinc-400">+{formatCurrency(Number(contract.monthlyValue))}/mo</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {isSigned && (
        <div className="bg-green-900/30 border-b border-green-800">
          <div className="container mx-auto px-6 py-3">
            <p className="text-green-400 text-sm">
              This contract was signed by {contract.signedByName} on{' '}
              {contract.signedAt && new Date(contract.signedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex" style={{ height: 'calc(100vh - 120px)' }}>
        {/* PDF Viewer */}
        <div className="flex-1">
          {contract.fileUrl ? (
            <ContractViewer
              fileUrl={contract.fileUrl}
              annotations={annotations}
              onAnnotationAdd={canSign ? handleAnnotationAdd : undefined}
              readOnly={isSigned}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-zinc-400">No PDF document attached to this contract</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {canSign && (
          <div className="w-80 border-l border-zinc-800 bg-zinc-950 p-6 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Sign Contract</h2>

            {contract.description && (
              <p className="text-zinc-400 text-sm mb-6">{contract.description}</p>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Your Full Name</label>
                <input
                  type="text"
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1">Your Email</label>
                <input
                  type="email"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Signature</label>
                {signatureData ? (
                  <div className="relative">
                    <img
                      src={signatureData}
                      alt="Your signature"
                      className="w-full bg-white rounded-lg"
                    />
                    <button
                      onClick={() => setSignatureData(null)}
                      className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSignature(true)}
                    className="w-full px-4 py-8 border-2 border-dashed border-zinc-700 rounded-lg text-zinc-400 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Click to add signature
                  </button>
                )}
              </div>

              <button
                onClick={handleSign}
                disabled={signing || !signerName.trim() || !signerEmail.trim() || !signatureData}
                className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                  signing || !signerName.trim() || !signerEmail.trim() || !signatureData
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {signing ? 'Signing...' : 'Sign Contract'}
              </button>

              <p className="text-xs text-zinc-500 text-center">
                By signing, you agree to the terms of this contract.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {showSignature && (
        <SignatureCapture
          onSave={handleSignatureCapture}
          onCancel={() => setShowSignature(false)}
        />
      )}
    </div>
  )
}
