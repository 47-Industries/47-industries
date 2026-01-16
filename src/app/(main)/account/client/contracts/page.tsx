'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const ContractSigningModal = dynamic(
  () => import('@/components/contracts/ContractSigningModal'),
  { ssr: false }
)

interface Amendment {
  id: string
  amendmentNumber: string
  title: string
  description?: string
  additionalValue: number
  additionalMonthlyValue?: number
  fileUrl?: string
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'ACTIVE'
  signedAt?: string
  signedByName?: string
  createdAt: string
  clientContract?: {
    id: string
    title: string
    contractNumber: string
  }
}

interface Contract {
  id: string
  contractNumber: string
  title: string
  description?: string
  totalValue: number
  monthlyValue?: number
  status: string
  signedAt?: string
  fileUrl?: string
  createdAt: string
}

export default function ClientContractsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [amendments, setAmendments] = useState<Amendment[]>([])
  const [loading, setLoading] = useState(true)
  const [signingAmendment, setSigningAmendment] = useState<Amendment | null>(null)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/client/contracts')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchContracts()
      fetchAmendments()
    }
  }, [session])

  async function fetchContracts() {
    try {
      const res = await fetch('/api/account/client/contracts')
      if (res.ok) {
        const data = await res.json()
        setContracts(data.contracts)
      }
    } catch (err) {
      console.error('Error fetching contracts:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAmendments() {
    try {
      const res = await fetch('/api/account/client/amendments')
      if (res.ok) {
        const data = await res.json()
        setAmendments(data.amendments)
      }
    } catch (err) {
      console.error('Error fetching amendments:', err)
    }
  }

  async function handleSignAmendment(data: { signedByName: string; signatureDataUrl: string }) {
    if (!signingAmendment) return

    try {
      setSigning(true)
      const res = await fetch(`/api/account/client/amendments/${signingAmendment.id}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setSigningAmendment(null)
        fetchAmendments()
      } else {
        const result = await res.json()
        throw new Error(result.error || 'Failed to sign amendment')
      }
    } catch (err) {
      throw err
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SIGNED: 'bg-green-500/20 text-green-500',
      ACTIVE: 'bg-green-500/20 text-green-500',
      SENT: 'bg-blue-500/20 text-blue-500',
      DRAFT: 'bg-gray-500/20 text-gray-500',
      COMPLETED: 'bg-purple-500/20 text-purple-500',
      CANCELLED: 'bg-red-500/20 text-red-500',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account/client" className="text-text-secondary hover:text-white text-sm mb-4 inline-block">
            Back to Client Portal
          </Link>
          <h1 className="text-3xl font-bold mb-2">Contracts</h1>
          <p className="text-text-secondary">
            View and sign your contracts
          </p>
        </div>

        {/* Contracts List */}
        {contracts.length === 0 ? (
          <div className="border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary mb-4">No contracts found</p>
            <Link
              href="/account/client"
              className="text-accent hover:underline"
            >
              Back to dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="border border-border rounded-xl p-6 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{contract.title}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                        {contract.status}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm mb-2">{contract.contractNumber}</p>
                    {contract.description && (
                      <p className="text-text-secondary text-sm">{contract.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{formatCurrency(Number(contract.totalValue))}</p>
                    {contract.monthlyValue && Number(contract.monthlyValue) > 0 && (
                      <p className="text-sm text-text-secondary">
                        +{formatCurrency(Number(contract.monthlyValue))}/mo
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-text-secondary">
                    {contract.signedAt ? (
                      <span className="text-green-500">Signed {formatDate(contract.signedAt)}</span>
                    ) : (
                      <span>Created {formatDate(contract.createdAt)}</span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {contract.fileUrl && (
                      <a
                        href={contract.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:border-accent transition-colors"
                      >
                        View PDF
                      </a>
                    )}
                    {contract.status === 'SENT' && (
                      <Link
                        href={`/contract/${contract.contractNumber}`}
                        className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                      >
                        Review & Sign
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Amendments Section */}
        {amendments.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Contract Amendments</h2>
            <div className="space-y-4">
              {amendments.map((amendment) => (
                <div
                  key={amendment.id}
                  className={`border rounded-xl p-6 transition-colors ${
                    amendment.status === 'SENT'
                      ? 'border-yellow-500/50 bg-yellow-500/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{amendment.title}</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(amendment.status)}`}>
                          {amendment.status === 'SENT' ? 'Awaiting Signature' : amendment.status}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm mb-1">{amendment.amendmentNumber}</p>
                      {amendment.clientContract && (
                        <p className="text-text-secondary text-sm">
                          For: {amendment.clientContract.title}
                        </p>
                      )}
                      {amendment.description && (
                        <p className="text-text-secondary text-sm mt-2">{amendment.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-green-500">
                        +{formatCurrency(Number(amendment.additionalValue))}
                      </p>
                      {amendment.additionalMonthlyValue && Number(amendment.additionalMonthlyValue) > 0 && (
                        <p className="text-sm text-text-secondary">
                          +{formatCurrency(Number(amendment.additionalMonthlyValue))}/mo
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="text-sm text-text-secondary">
                      {amendment.signedAt ? (
                        <span className="text-green-500">
                          Signed by {amendment.signedByName} on {formatDate(amendment.signedAt)}
                        </span>
                      ) : (
                        <span>Created {formatDate(amendment.createdAt)}</span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {amendment.fileUrl && (
                        <a
                          href={amendment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:border-accent transition-colors"
                        >
                          View PDF
                        </a>
                      )}
                      {amendment.status === 'SENT' && (
                        <button
                          onClick={() => setSigningAmendment(amendment)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Review & Sign
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Amendment Signing Modal */}
      {signingAmendment && signingAmendment.fileUrl && (
        <ContractSigningModal
          contractTitle={`Amendment: ${signingAmendment.title}`}
          contractFileUrl={signingAmendment.fileUrl}
          onSign={handleSignAmendment}
          onClose={() => setSigningAmendment(null)}
        />
      )}
    </div>
  )
}
