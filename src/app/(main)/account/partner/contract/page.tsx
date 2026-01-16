'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Contract {
  id: string
  title: string
  description?: string
  fileUrl?: string
  fileName?: string
  status: string
  signedAt?: string
  createdAt: string
}

interface CommissionRates {
  firstSaleRate: number
  recurringRate: number
  commissionType: string
}

export default function PartnerContractPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [contract, setContract] = useState<Contract | null>(null)
  const [rates, setRates] = useState<CommissionRates | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/partner/contract')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchContract()
    }
  }, [session])

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
      SENT: 'bg-blue-500/20 text-blue-500',
      SIGNED: 'bg-green-500/20 text-green-500',
      ACTIVE: 'bg-green-500/20 text-green-500',
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
            {/* Contract Info */}
            <div className="border border-border rounded-xl overflow-hidden mb-8">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{contract.title}</h2>
                  <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusColor(contract.status)}`}>
                    {contract.status}
                  </span>
                </div>
                {contract.signedAt && (
                  <p className="text-text-secondary text-sm">
                    Signed on {formatDate(contract.signedAt)}
                  </p>
                )}
              </div>

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
          </>
        ) : (
          <div className="border border-border rounded-xl p-12 text-center">
            <p className="text-text-secondary">Unable to load contract</p>
          </div>
        )}
      </div>
    </div>
  )
}
