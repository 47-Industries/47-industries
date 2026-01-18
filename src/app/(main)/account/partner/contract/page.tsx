'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// Dynamically import the signing modal to avoid SSR issues
const ClientContractSigningModal = dynamic(
  () => import('@/components/contracts/ClientContractSigningModal'),
  { ssr: false }
)

interface Contract {
  id: string
  title: string
  description?: string
  fileUrl?: string
  fileName?: string
  status: string
  signedAt?: string
  signedByName?: string
  signatureUrl?: string
  // Countersignature fields (only visible when ACTIVE)
  countersignedAt?: string
  countersignedByName?: string
  countersignatureUrl?: string
  createdAt: string
}

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
}

interface CommissionRates {
  firstSaleRate: number
  recurringRate: number
  commissionType: string
}

interface PartnerInfo {
  name: string
  email: string
  title?: string
  company?: string
}

export default function PartnerContractPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [amendments, setAmendments] = useState<Amendment[]>([])
  const [rates, setRates] = useState<CommissionRates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSigningModal, setShowSigningModal] = useState(false)
  const [signingAmendment, setSigningAmendment] = useState<Amendment | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/partner/contract')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchContract()
      fetchAmendments()
      fetchPartnerInfo()
    }
  }, [session])

  async function fetchPartnerInfo() {
    try {
      const res = await fetch('/api/account/partner')
      if (res.ok) {
        const data = await res.json()
        if (data.partner) {
          // Use user's name/email/title if available, fall back to partner fields
          setPartnerInfo({
            name: data.partner.user?.name || data.partner.name,
            email: data.partner.user?.email || data.partner.email,
            title: data.partner.user?.title || '',
            company: data.partner.company || data.partner.name,
          })
        }
      }
    } catch (err) {
      console.error('Error fetching partner info:', err)
    }
  }

  async function fetchContract() {
    try {
      setLoading(true)
      const res = await fetch('/api/account/partner/contract')
      if (res.ok) {
        const data = await res.json()
        setContract(data.contract)
        setRates(data.commissionRates)
      } else if (res.status === 404) {
        const data = await res.json()
        if (data.error === 'Not a partner') {
          router.push('/account/partner')
        } else {
          setError('no_contract')
        }
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      setError('error')
    } finally {
      setLoading(false)
    }
  }

  async function fetchAmendments() {
    try {
      const res = await fetch('/api/account/partner/amendments')
      if (res.ok) {
        const data = await res.json()
        setAmendments(data.amendments)
      }
    } catch (err) {
      console.error('Error fetching amendments:', err)
    }
  }

  const handleSign = async (data: {
    signedByName: string
    signedByTitle: string
    signedByCompany: string
    signedByEmail: string
    signatureDataUrl: string
  }) => {
    const res = await fetch('/api/account/partner/contract/sign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Failed to sign contract')
    }

    // Refresh contract data
    await fetchContract()
    setShowSigningModal(false)
  }

  const handleSignAmendment = async (data: {
    signedByName: string
    signedByTitle: string
    signedByCompany: string
    signedByEmail: string
    signatureDataUrl: string
  }) => {
    if (!signingAmendment) return

    const res = await fetch(`/api/account/partner/amendments/${signingAmendment.id}/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const errorData = await res.json()
      throw new Error(errorData.error || 'Failed to sign amendment')
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
      DRAFT: 'bg-gray-500/20 text-gray-500',
      SENT: 'bg-yellow-500/20 text-yellow-500',
      SIGNED: 'bg-green-500/20 text-green-500',
      ACTIVE: 'bg-green-500/20 text-green-500',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      DRAFT: 'Draft',
      SENT: 'Awaiting Signature',
      SIGNED: 'Signed',
      ACTIVE: 'Active',
    }
    return texts[status] || status
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
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account/partner" className="text-sm text-text-secondary hover:text-accent mb-2 inline-block">
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold">Partner Agreement</h1>
        </div>

        {error === 'no_contract' ? (
          <div className="border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary mb-2">No contract on file</p>
            <p className="text-sm text-text-secondary">
              Contact us to set up your partner agreement.
            </p>
          </div>
        ) : contract ? (
          <>
            {/* Sign Contract Banner - Show when status is SENT */}
            {contract.status === 'SENT' && contract.fileUrl && (
              <div className="mb-6 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-yellow-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-500 mb-1">Your signature is required</h3>
                    <p className="text-text-secondary text-sm mb-4">
                      Please review the contract below and sign it electronically to activate your partner agreement.
                    </p>
                    <button
                      onClick={() => setShowSigningModal(true)}
                      className="px-6 py-3 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors inline-flex items-center gap-2"
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Review & Sign Contract
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Info */}
            <div className="border border-border rounded-xl overflow-hidden mb-8">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{contract.title}</h2>
                  <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(contract.status)}`}>
                    {getStatusText(contract.status)}
                  </span>
                </div>
                {contract.signedAt && (
                  <p className="text-text-secondary text-sm">
                    Signed on {formatDate(contract.signedAt)}
                    {contract.signedByName && ` by ${contract.signedByName}`}
                  </p>
                )}
              </div>

              {/* Signature Display - Show when signed */}
              {(contract.status === 'SIGNED' || contract.status === 'ACTIVE') && contract.signatureUrl && (
                <div className="p-6 border-b border-border bg-green-500/5">
                  <div className="flex items-center gap-3 mb-4">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-green-500">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-medium text-green-500">
                      {contract.status === 'ACTIVE' ? 'Contract Fully Executed' : 'Contract Signed'}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Partner Signature */}
                    <div>
                      <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">Your Signature</p>
                      <div className="flex items-center gap-4">
                        <div className="bg-white rounded-lg p-3 border border-border">
                          <img
                            src={contract.signatureUrl}
                            alt="Your signature"
                            className="h-12 w-auto"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{contract.signedByName}</p>
                          <p className="text-sm text-text-secondary">
                            {contract.signedAt && formatDate(contract.signedAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 47 Industries Countersignature - Only show when ACTIVE */}
                    {contract.status === 'ACTIVE' && contract.countersignatureUrl && (
                      <div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">47 Industries</p>
                        <div className="flex items-center gap-4">
                          <div className="bg-white rounded-lg p-3 border border-border">
                            <img
                              src={contract.countersignatureUrl}
                              alt="Company signature"
                              className="h-12 w-auto"
                            />
                          </div>
                          <div>
                            <p className="font-medium">{contract.countersignedByName}</p>
                            <p className="text-sm text-text-secondary">
                              {contract.countersignedAt && formatDate(contract.countersignedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Waiting for countersignature message */}
                    {contract.status === 'SIGNED' && (
                      <p className="text-sm text-text-secondary mt-2">
                        Awaiting countersignature from 47 Industries. You will be notified when the contract is fully executed.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {contract.description && (
                <div className="p-6 border-b border-border">
                  <h3 className="font-medium mb-3">Agreement Terms</h3>
                  <p className="text-text-secondary whitespace-pre-wrap leading-relaxed">
                    {contract.description}
                  </p>
                </div>
              )}

              {contract.fileUrl && (
                <div className="p-6">
                  <h3 className="font-medium mb-4">Contract Document</h3>
                  <div className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border">
                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-red-500">
                        <path fill="currentColor" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                        <path stroke="white" strokeWidth="1.5" d="M14 2v6h6"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{contract.fileName || 'Partner Agreement.pdf'}</p>
                      <p className="text-sm text-text-secondary">PDF Document</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={contract.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </a>
                      <a
                        href={contract.fileUrl}
                        download
                        className="px-4 py-2 bg-surface border border-border rounded-lg hover:border-accent transition-colors flex items-center gap-2"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Commission Rates */}
            {rates && (
              <div className="border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Your Commission Rates</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-surface rounded-lg">
                    <p className="text-sm text-text-secondary mb-1">First Sale Commission</p>
                    <p className="text-3xl font-bold text-accent">{rates.firstSaleRate}%</p>
                    <p className="text-xs text-text-secondary mt-2">
                      Applied to the first payment from a lead you refer
                    </p>
                  </div>
                  <div className="p-4 bg-surface rounded-lg">
                    <p className="text-sm text-text-secondary mb-1">Recurring Commission</p>
                    <p className="text-3xl font-bold text-purple-500">{rates.recurringRate}%</p>
                    <p className="text-xs text-text-secondary mt-2">
                      Applied to all subsequent payments from the same client
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Amendments */}
            {amendments.length > 0 && (
              <div className="border border-border rounded-xl p-6 mt-8">
                <h2 className="text-xl font-semibold mb-4">Contract Amendments</h2>
                <div className="space-y-4">
                  {amendments.map((amendment) => (
                    <div
                      key={amendment.id}
                      className={`p-4 rounded-lg border ${
                        amendment.status === 'SENT'
                          ? 'border-yellow-500/50 bg-yellow-500/5'
                          : 'border-border bg-surface'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium">{amendment.title}</h3>
                            <span className={`px-2 py-0.5 text-xs rounded ${getStatusColor(amendment.status)}`}>
                              {amendment.status === 'SENT' ? 'Awaiting Signature' : amendment.status}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary">{amendment.amendmentNumber}</p>
                          {amendment.description && (
                            <p className="text-sm text-text-secondary mt-2">{amendment.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-500">
                            +{formatCurrency(Number(amendment.additionalValue))}
                          </p>
                          {amendment.additionalMonthlyValue && (
                            <p className="text-sm text-text-secondary">
                              +{formatCurrency(Number(amendment.additionalMonthlyValue))}/mo
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="text-sm text-text-secondary">
                          {amendment.signedAt && (
                            <span>Signed by {amendment.signedByName} on {formatDate(amendment.signedAt)}</span>
                          )}
                          {amendment.status === 'ACTIVE' && amendment.countersignedAt && (
                            <span className="ml-2 text-green-500">
                              | Countersigned by {amendment.countersignedByName}
                            </span>
                          )}
                          {amendment.status === 'SIGNED' && (
                            <span className="text-yellow-500"> | Awaiting admin countersignature</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {amendment.fileUrl && (
                            <a
                              href={amendment.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-sm border border-border rounded hover:border-accent transition-colors"
                            >
                              View PDF
                            </a>
                          )}
                          {amendment.status === 'SENT' && amendment.fileUrl && (
                            <button
                              onClick={() => setSigningAmendment(amendment)}
                              className="px-3 py-1.5 text-sm bg-yellow-500 text-black font-medium rounded hover:bg-yellow-400 transition-colors"
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
          </>
        ) : (
          <div className="border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary">Unable to load contract</p>
          </div>
        )}
      </div>

      {/* Signing Modal - Interactive PDF Signer */}
      {showSigningModal && contract && contract.fileUrl && (
        <ClientContractSigningModal
          contractId={contract.id}
          contractTitle={contract.title}
          contractFileUrl={contract.fileUrl}
          apiEndpoint="/api/account/partner/contract/sign"
          onSuccess={() => {
            fetchContract()
            setShowSigningModal(false)
          }}
          onClose={() => setShowSigningModal(false)}
          defaultName={partnerInfo?.name}
          defaultTitle={partnerInfo?.title}
          defaultEmail={partnerInfo?.email}
          defaultCompany={partnerInfo?.company}
        />
      )}

      {/* Amendment Signing Modal - Interactive PDF Signer */}
      {signingAmendment && signingAmendment.fileUrl && (
        <ClientContractSigningModal
          contractId={signingAmendment.id}
          contractTitle={`Amendment: ${signingAmendment.title}`}
          contractFileUrl={signingAmendment.fileUrl}
          apiEndpoint={`/api/account/partner/amendments/${signingAmendment.id}/sign`}
          onSuccess={() => {
            fetchAmendments()
            setSigningAmendment(null)
          }}
          onClose={() => setSigningAmendment(null)}
          defaultName={partnerInfo?.name}
          defaultTitle={partnerInfo?.title}
          defaultEmail={partnerInfo?.email}
          defaultCompany={partnerInfo?.company}
        />
      )}
    </div>
  )
}
