'use client'

import { useEffect, useState, use } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  type?: string
  status: string
  contractValue?: number
  monthlyRecurring?: number
  startDate?: string
  estimatedEndDate?: string
  completedAt?: string
  repositoryUrl?: string
  productionUrl?: string
  stagingUrl?: string
  createdAt: string
  updatedAt: string
  client: {
    id: string
    name: string
    industry?: string
  }
  contracts: {
    id: string
    contractNumber: string
    title: string
    status: string
    totalValue: number
    signedAt?: string
  }[]
}

interface Partner {
  id: string
  name: string
  firstSaleRate: number
  recurringRate: number
}

export default function PartnerProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/partner')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchProjectData()
    }
  }, [session, id])

  async function fetchProjectData() {
    try {
      setLoading(true)
      const res = await fetch(`/api/account/partner/projects/${id}`)
      if (res.ok) {
        const data = await res.json()
        setProject(data.project)
        setPartner(data.partner)
      } else if (res.status === 404) {
        setError('Project not found or you do not have access')
      } else if (res.status === 403) {
        setError('You do not have access to this project')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
      PENDING: 'bg-yellow-500/20 text-yellow-500',
      ACTIVE: 'bg-green-500/20 text-green-500',
      IN_PROGRESS: 'bg-blue-500/20 text-blue-500',
      COMPLETED: 'bg-green-500/20 text-green-500',
      ON_HOLD: 'bg-yellow-500/20 text-yellow-500',
      CANCELLED: 'bg-red-500/20 text-red-500',
      DRAFT: 'bg-gray-500/20 text-gray-500',
      SENT: 'bg-blue-500/20 text-blue-500',
      SIGNED: 'bg-green-500/20 text-green-500',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading project...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <p className="text-text-secondary mb-6">{error}</p>
            <Link
              href="/account/partner"
              className="inline-block px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!project || !partner) {
    return null
  }

  const firstSaleCommission = project.contractValue
    ? Number(project.contractValue) * (partner.firstSaleRate / 100)
    : 0

  const monthlyCommission = project.monthlyRecurring
    ? Number(project.monthlyRecurring) * (partner.recurringRate / 100)
    : 0

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Back Link */}
        <Link
          href="/account/partner"
          className="text-sm text-text-secondary hover:text-accent mb-4 inline-flex items-center gap-2"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
              <p className="text-text-secondary">
                Client: {project.client.name}
                {project.client.industry && ` | ${project.client.industry}`}
              </p>
            </div>
            <span className={`px-3 py-1.5 text-sm font-medium rounded-lg ${getStatusColor(project.status)}`}>
              {project.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Commission Summary */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="p-6 border border-border rounded-xl bg-surface">
            <p className="text-sm text-text-secondary mb-1">First Sale Commission ({partner.firstSaleRate}%)</p>
            <p className="text-3xl font-bold text-green-500">{formatCurrency(firstSaleCommission)}</p>
            {project.contractValue && (
              <p className="text-sm text-text-secondary mt-1">
                Based on {formatCurrency(Number(project.contractValue))} contract value
              </p>
            )}
          </div>
          {project.monthlyRecurring && Number(project.monthlyRecurring) > 0 && (
            <div className="p-6 border border-border rounded-xl bg-surface">
              <p className="text-sm text-text-secondary mb-1">Monthly Recurring ({partner.recurringRate}%)</p>
              <p className="text-3xl font-bold text-purple-500">{formatCurrency(monthlyCommission)}/mo</p>
              <p className="text-sm text-text-secondary mt-1">
                Based on {formatCurrency(Number(project.monthlyRecurring))}/mo MRR
              </p>
            </div>
          )}
        </div>

        {/* Project Details */}
        <div className="border border-border rounded-xl overflow-hidden mb-8">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Project Details</h2>
          </div>
          <div className="p-5">
            {project.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-text-secondary mb-2">Description</h3>
                <p className="text-text-primary whitespace-pre-wrap">{project.description}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {project.type && (
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-1">Project Type</h3>
                  <p>{project.type}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Created</h3>
                <p>{formatDate(project.createdAt)}</p>
              </div>

              {project.startDate && (
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-1">Start Date</h3>
                  <p>{formatDate(project.startDate)}</p>
                </div>
              )}

              {project.estimatedEndDate && (
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-1">Estimated Completion</h3>
                  <p>{formatDate(project.estimatedEndDate)}</p>
                </div>
              )}

              {project.completedAt && (
                <div>
                  <h3 className="text-sm font-medium text-text-secondary mb-1">Completed</h3>
                  <p>{formatDate(project.completedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border border-border rounded-xl overflow-hidden mb-8">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold">Financial Summary</h2>
          </div>
          <div className="p-5">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Contract Value</h3>
                <p className="text-xl font-semibold">
                  {project.contractValue ? formatCurrency(Number(project.contractValue)) : '-'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Monthly Recurring</h3>
                <p className="text-xl font-semibold">
                  {project.monthlyRecurring && Number(project.monthlyRecurring) > 0
                    ? `${formatCurrency(Number(project.monthlyRecurring))}/mo`
                    : '-'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-secondary mb-1">Your Commission Rate</h3>
                <p className="text-xl font-semibold">
                  {partner.firstSaleRate}% first / {partner.recurringRate}% recurring
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contracts */}
        {project.contracts && project.contracts.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden mb-8">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold">Associated Contracts</h2>
            </div>
            <div className="divide-y divide-border">
              {project.contracts.map((contract) => (
                <div key={contract.id} className="p-4 hover:bg-surface/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{contract.title}</p>
                      <p className="text-sm text-text-secondary">{contract.contractNumber}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(contract.status)}`}>
                        {contract.status}
                      </span>
                      <span className="font-semibold">{formatCurrency(Number(contract.totalValue))}</span>
                    </div>
                  </div>
                  {contract.signedAt && (
                    <p className="text-sm text-text-secondary mt-1">
                      Signed {formatDate(contract.signedAt)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Project Links */}
        {(project.productionUrl || project.stagingUrl) && (
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold">Project Links</h2>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-4">
                {project.productionUrl && (
                  <a
                    href={project.productionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 rounded-lg hover:bg-green-500/20 transition-colors"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Production Site
                  </a>
                )}
                {project.stagingUrl && (
                  <a
                    href={project.stagingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 rounded-lg hover:bg-blue-500/20 transition-colors"
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Staging Site
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
