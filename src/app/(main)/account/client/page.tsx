'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ClientData {
  id: string
  clientNumber: string
  name: string
  type: string
  totalRevenue: number
  totalOutstanding: number
  autopayEnabled: boolean
  projects: {
    id: string
    name: string
    status: string
    monthlyRecurring?: number
  }[]
  invoices: {
    id: string
    invoiceNumber: string
    total: number
    status: string
    dueDate?: string
  }[]
  contracts: {
    id: string
    contractNumber: string
    title: string
    status: string
  }[]
}

export default function ClientDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [client, setClient] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState({ name: '', title: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/client')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchClientData()
    }
  }, [session])

  async function fetchClientData() {
    try {
      const res = await fetch('/api/account/client')
      if (res.ok) {
        const data = await res.json()
        setClient(data.client)

        // Check if profile is complete
        if (!data.isProfileComplete) {
          setProfileData({
            name: data.user?.name || '',
            title: data.user?.title || '',
          })
          setShowProfileModal(true)
        }
      } else if (res.status === 404) {
        setError('No client account linked')
      } else {
        setError('Failed to load client data')
      }
    } catch (err) {
      setError('Failed to load client data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProfile() {
    if (!profileData.name.trim() || !profileData.title.trim()) {
      setProfileError('Please fill in all fields')
      return
    }

    setSavingProfile(true)
    setProfileError('')

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileData.name.trim(),
          title: profileData.title.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      setShowProfileModal(false)
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
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
      ACTIVE: 'bg-blue-500/20 text-blue-500',
      COMPLETED: 'bg-green-500/20 text-green-500',
      PROPOSAL: 'bg-yellow-500/20 text-yellow-500',
      PAID: 'bg-green-500/20 text-green-500',
      SENT: 'bg-blue-500/20 text-blue-500',
      OVERDUE: 'bg-red-500/20 text-red-500',
      SIGNED: 'bg-green-500/20 text-green-500',
      DRAFT: 'bg-gray-500/20 text-gray-500',
    }
    return colors[status] || 'bg-gray-500/20 text-gray-500'
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading client portal...</div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Client Portal</h1>
            <p className="text-text-secondary mb-6">
              {error || 'Your account is not linked to a client profile.'}
            </p>
            <Link
              href="/account"
              className="inline-flex items-center px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              Back to Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const pendingInvoices = client.invoices.filter(inv => ['SENT', 'VIEWED', 'OVERDUE'].includes(inv.status))
  const monthlyTotal = client.projects.reduce((sum, p) => sum + Number(p.monthlyRecurring || 0), 0)

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-text-secondary hover:text-white text-sm mb-4 inline-block">
            Back to Account
          </Link>
          <h1 className="text-3xl font-bold mb-2">Client Portal</h1>
          <p className="text-text-secondary">
            {client.name} | {client.clientNumber}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 border border-border rounded-xl">
            <p className="text-text-secondary text-sm mb-1">Outstanding</p>
            <p className={`text-2xl font-bold ${Number(client.totalOutstanding) > 0 ? 'text-yellow-500' : 'text-white'}`}>
              {formatCurrency(Number(client.totalOutstanding))}
            </p>
          </div>
          <div className="p-5 border border-border rounded-xl">
            <p className="text-text-secondary text-sm mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-500">
              {formatCurrency(Number(client.totalRevenue))}
            </p>
          </div>
          <div className="p-5 border border-border rounded-xl">
            <p className="text-text-secondary text-sm mb-1">Monthly Service</p>
            <p className="text-2xl font-bold">
              {formatCurrency(monthlyTotal)}/mo
            </p>
          </div>
          <div className="p-5 border border-border rounded-xl">
            <p className="text-text-secondary text-sm mb-1">Payment Method</p>
            <p className="text-lg font-medium">
              {client.autopayEnabled ? (
                <span className="text-green-500">Autopay Active</span>
              ) : (
                <Link href="/account/client/billing" className="text-accent hover:underline">
                  Set Up Autopay
                </Link>
              )}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/account/client/invoices"
            className="p-6 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <div className="text-3xl mb-4 text-zinc-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">
              Invoices
            </h3>
            <p className="text-text-secondary text-sm">
              {pendingInvoices.length > 0 ? `${pendingInvoices.length} pending` : 'View all invoices'}
            </p>
          </Link>

          <Link
            href="/account/client/contracts"
            className="p-6 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <div className="text-3xl mb-4 text-zinc-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">
              Contracts
            </h3>
            <p className="text-text-secondary text-sm">
              View and sign contracts
            </p>
          </Link>

          <Link
            href="/account/client/billing"
            className="p-6 border border-border rounded-xl hover:border-accent transition-colors group"
          >
            <div className="text-3xl mb-4 text-zinc-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-accent transition-colors">
              Billing & Payment
            </h3>
            <p className="text-text-secondary text-sm">
              Manage payment methods
            </p>
          </Link>
        </div>

        {/* Pending Invoices */}
        {pendingInvoices.length > 0 && (
          <div className="border border-border rounded-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h2 className="text-xl font-bold">Pending Invoices</h2>
              <Link
                href="/account/client/invoices"
                className="text-sm text-accent hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-border">
              {pendingInvoices.slice(0, 3).map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoice/${invoice.invoiceNumber}`}
                  className="block p-6 hover:bg-surface transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-medium">{invoice.invoiceNumber}</span>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">
                      {invoice.dueDate ? `Due ${formatDate(invoice.dueDate)}` : 'No due date'}
                    </span>
                    <span className="font-bold text-lg">{formatCurrency(Number(invoice.total))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Active Projects */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold">Active Services</h2>
          </div>
          {client.projects.length === 0 ? (
            <div className="p-12 text-center text-text-secondary">
              No active services
            </div>
          ) : (
            <div className="divide-y divide-border">
              {client.projects.map((project) => (
                <div key={project.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">{project.name}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    {project.monthlyRecurring && Number(project.monthlyRecurring) > 0 && (
                      <div className="text-right">
                        <p className="text-text-secondary text-sm">Monthly fee</p>
                        <p className="font-bold">{formatCurrency(Number(project.monthlyRecurring))}/mo</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-2">Complete Your Profile</h2>
            <p className="text-text-secondary mb-6">
              Please provide your information to access the client portal and sign contracts.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-black border border-border rounded-lg focus:outline-none focus:border-accent"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Job Title / Position *</label>
                <input
                  type="text"
                  value={profileData.title}
                  onChange={(e) => setProfileData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 bg-black border border-border rounded-lg focus:outline-none focus:border-accent"
                  placeholder="CEO, Manager, etc."
                />
              </div>

              {profileError && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                  {profileError}
                </div>
              )}

              <button
                onClick={handleSaveProfile}
                disabled={savingProfile || !profileData.name.trim() || !profileData.title.trim()}
                className="w-full py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingProfile ? 'Saving...' : 'Continue to Portal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
