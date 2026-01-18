'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const ClientContractSigningModal = dynamic(
  () => import('@/components/contracts/ClientContractSigningModal'),
  { ssr: false }
)

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
  countersignedAt?: string
  countersignedByName?: string
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
  signedByName?: string
  signatureUrl?: string
  countersignedAt?: string
  countersignedByName?: string
  countersignatureUrl?: string
  fileUrl?: string
  createdAt: string
}

interface ClientInfo {
  companyName: string   // Client.name - the company/business name
  email: string         // Client.email
}

interface UserInfo {
  name: string | null    // User.name - the person's name
  email: string | null   // User.email
  title: string | null   // User.title - the person's title/position
}

export default function ClientContractsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [amendments, setAmendments] = useState<Amendment[]>([])
  const [loading, setLoading] = useState(true)
  const [signingContract, setSigningContract] = useState<Contract | null>(null)
  const [signingAmendment, setSigningAmendment] = useState<Amendment | null>(null)
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/client/contracts')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchContracts()
      fetchAmendments()
      fetchClientInfo()
    }
  }, [session])

  async function fetchClientInfo() {
    try {
      const res = await fetch('/api/account/client')
      if (res.ok) {
        const data = await res.json()
        if (data.client) {
          setClientInfo({ companyName: data.client.name, email: data.client.email })
        }
        if (data.user) {
          setUserInfo({
            name: data.user.name,
            email: data.user.email,
            title: data.user.title,
          })
        }
      }
    } catch (err) {
      console.error('Error fetching client info:', err)
    }
  }

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

  async function handleSignContract(data: {
    signedByName: string
    signedByTitle: string
    signedByCompany: string
    signedByEmail: string
    signatureDataUrl: string
  }) {
    if (!signingContract) return

    const res = await fetch(`/api/account/client/contracts/${signingContract.id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const result = await res.json()
      throw new Error(result.error || 'Failed to sign contract')
    }

    await fetchContracts()
    setSigningContract(null)
  }

  async function handleSignAmendment(data: {
    signedByName: string
    signedByTitle: string
    signedByCompany: string
    signedByEmail: string
    signatureDataUrl: string
  }) {
    if (!signingAmendment) return

    const res = await fetch(`/api/account/client/amendments/${signingAmendment.id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const result = await res.json()
      throw new Error(result.error || 'Failed to sign amendment')
    }

    await fetchAmendments()
    setSigningAmendment(null)
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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      SIGNED: 'bg-blue-500/20 text-blue-500',
      ACTIVE: 'bg-green-500/20 text-green-500',
      SENT: 'bg-yellow-500/20 text-yellow-500',
      DRAFT: 'bg-gray-500/20 text-gray-500',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Awaiting Your Signature',
      SIGNED: 'Awaiting Countersignature',
      ACTIVE: 'Fully Executed',
    }
    return texts[status] || status
  }

  // Check if any contracts need signature
  const contractsNeedingSignature = contracts.filter(c => c.status === 'SENT' && c.fileUrl)

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
            View and sign your service agreements
          </p>
        </div>

        {/* Signature Required Banner */}
        {contractsNeedingSignature.length > 0 && (
          <div className="mb-6 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-yellow-500">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-500 mb-1">
                  {contractsNeedingSignature.length === 1 ? 'Contract requires your signature' : `${contractsNeedingSignature.length} contracts require your signature`}
                </h3>
                <p className="text-text-secondary text-sm mb-4">
                  Please review and sign your service agreement(s) below to proceed.
                </p>
              </div>
            </div>
          </div>
        )}

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
          <div className="space-y-6">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className={`border rounded-xl overflow-hidden transition-colors ${
                  contract.status === 'SENT' ? 'border-yellow-500/50' : 'border-border'
                }`}
              >
                {/* Contract Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{contract.title}</h3>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm">{contract.contractNumber}</p>
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

                  {/* Signature Display - Show when signed */}
                  {(contract.status === 'SIGNED' || contract.status === 'ACTIVE') && contract.signatureUrl && (
                    <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-green-500">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-500">
                          {contract.status === 'ACTIVE' ? 'Contract Fully Executed' : 'You have signed this contract'}
                        </span>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Your Signature */}
                        <div>
                          <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">Your Signature</p>
                          <div className="flex items-center gap-3">
                            <div className="bg-white rounded p-2 border border-border">
                              <img src={contract.signatureUrl} alt="Your signature" className="h-10 w-auto" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{contract.signedByName}</p>
                              <p className="text-xs text-text-secondary">{contract.signedAt && formatDate(contract.signedAt)}</p>
                            </div>
                          </div>
                        </div>

                        {/* 47 Industries Countersignature - Only show when ACTIVE */}
                        {contract.status === 'ACTIVE' && contract.countersignatureUrl && (
                          <div>
                            <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">47 Industries</p>
                            <div className="flex items-center gap-3">
                              <div className="bg-white rounded p-2 border border-border">
                                <img src={contract.countersignatureUrl} alt="Company signature" className="h-10 w-auto" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{contract.countersignedByName}</p>
                                <p className="text-xs text-text-secondary">{contract.countersignedAt && formatDate(contract.countersignedAt)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {contract.status === 'SIGNED' && (
                        <p className="text-xs text-yellow-500 mt-3">
                          Awaiting countersignature from 47 Industries. You will be notified when fully executed.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                    <div className="text-sm text-text-secondary">
                      Created {formatDate(contract.createdAt)}
                    </div>
                    <div className="flex gap-3">
                      {contract.fileUrl && (
                        <a
                          href={contract.status === 'SIGNED' || contract.status === 'ACTIVE'
                            ? `/api/account/client/contracts/${contract.id}/pdf`
                            : contract.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:border-accent transition-colors"
                        >
                          View PDF
                        </a>
                      )}
                      {contract.status === 'SENT' && contract.fileUrl && (
                        <button
                          onClick={() => setSigningContract(contract)}
                          className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors flex items-center gap-2"
                        >
                          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Review & Sign
                        </button>
                      )}
                    </div>
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
                          {getStatusText(amendment.status)}
                        </span>
                      </div>
                      <p className="text-text-secondary text-sm mb-1">{amendment.amendmentNumber}</p>
                      {amendment.clientContract && (
                        <p className="text-text-secondary text-sm">
                          For: {amendment.clientContract.title}
                        </p>
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
                          {amendment.status === 'ACTIVE' && amendment.countersignedByName && (
                            <> | Countersigned by {amendment.countersignedByName}</>
                          )}
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
                      {amendment.status === 'SENT' && amendment.fileUrl && (
                        <button
                          onClick={() => setSigningAmendment(amendment)}
                          className="px-4 py-2 bg-yellow-500 text-black rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors"
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

      {/* Contract Signing Modal - Interactive PDF Signer */}
      {signingContract && signingContract.fileUrl && (
        <ClientContractSigningModal
          contractId={signingContract.id}
          contractTitle={signingContract.title}
          contractFileUrl={signingContract.fileUrl}
          apiEndpoint={`/api/account/client/contracts/${signingContract.id}/sign`}
          onSuccess={() => {
            fetchContracts()
            setSigningContract(null)
          }}
          onClose={() => setSigningContract(null)}
          defaultName={userInfo?.name || ''}
          defaultTitle={userInfo?.title || ''}
          defaultEmail={userInfo?.email || ''}
          defaultCompany={clientInfo?.companyName || ''}
        />
      )}

      {/* Amendment Signing Modal - Interactive PDF Signer */}
      {signingAmendment && signingAmendment.fileUrl && (
        <ClientContractSigningModal
          contractId={signingAmendment.id}
          contractTitle={`Amendment: ${signingAmendment.title}`}
          contractFileUrl={signingAmendment.fileUrl}
          apiEndpoint={`/api/account/client/amendments/${signingAmendment.id}/sign`}
          onSuccess={() => {
            fetchAmendments()
            setSigningAmendment(null)
          }}
          onClose={() => setSigningAmendment(null)}
          defaultName={userInfo?.name || ''}
          defaultTitle={userInfo?.title || ''}
          defaultEmail={userInfo?.email || ''}
          defaultCompany={clientInfo?.companyName || ''}
        />
      )}
    </div>
  )
}
