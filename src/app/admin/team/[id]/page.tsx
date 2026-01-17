'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Permission = 'products' | 'orders' | 'users' | 'settings' | 'email' | 'custom_requests' | 'analytics' | 'expenses'

const AVAILABLE_PERMISSIONS: { key: Permission; label: string; description: string }[] = [
  { key: 'products', label: 'Products', description: 'Manage products and categories' },
  { key: 'orders', label: 'Orders', description: 'View and manage orders' },
  { key: 'users', label: 'Users', description: 'Manage user accounts' },
  { key: 'settings', label: 'Settings', description: 'Access site settings' },
  { key: 'email', label: 'Email', description: 'Access company email' },
  { key: 'custom_requests', label: 'Custom Requests', description: 'Manage 3D printing requests' },
  { key: 'analytics', label: 'Analytics', description: 'View analytics dashboard' },
  { key: 'expenses', label: 'Expenses', description: 'View household bills and notifications' },
]

const COMPANY_EMAILS = [
  'support@47industries.com',
  'sales@47industries.com',
  'admin@47industries.com',
  'info@47industries.com',
]

interface TeamMember {
  id: string
  employeeNumber: string
  name: string
  email: string
  phone: string | null
  address: string | null
  dateOfBirth: string | null
  title: string
  department: string | null
  startDate: string
  endDate: string | null
  status: string
  salaryType: string
  salaryAmount: number | null
  salaryFrequency: string | null
  equityPercentage: number | null
  equityNotes: string | null
  userId: string | null
  user: {
    id: string
    email: string
    name: string | null
    username: string | null
    role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'
    permissions: Permission[] | null
    emailAccess: string[] | null
    orders: {
      id: string
      orderNumber: string
      status: string
      total: number
      createdAt: string
    }[]
    _count: { orders: number }
  } | null
  contracts: Contract[]
  documents: Document[]
  payments: Payment[]
  totalPaid: number
  createdAt: string
}

interface Contract {
  id: string
  title: string
  type: string
  fileUrl: string | null
  fileName: string | null
  status: string
  signedAt: string | null
  effectiveDate: string | null
  expirationDate: string | null
  createdAt: string
}

interface Document {
  id: string
  name: string
  type: string
  fileUrl: string
  fileName: string
  uploadedBy: string
  createdAt: string
}

interface Payment {
  id: string
  paymentNumber: string
  type: string
  amount: number
  description: string | null
  periodStart: string | null
  periodEnd: string | null
  method: string | null
  reference: string | null
  status: string
  paidAt: string | null
  createdAt: string
}

export default function TeamMemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showContractModal, setShowContractModal] = useState(false)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)

  // Account access state
  const [accountSaving, setAccountSaving] = useState(false)
  const [accountError, setAccountError] = useState('')
  const [accountRole, setAccountRole] = useState<'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN'>('CUSTOMER')
  const [accountPermissions, setAccountPermissions] = useState<Permission[]>([])
  const [accountEmailAccess, setAccountEmailAccess] = useState<string[]>([])
  const [accountUsername, setAccountUsername] = useState('')

  useEffect(() => {
    fetchTeamMember()
  }, [params.id])

  // Sync account state when teamMember loads
  useEffect(() => {
    if (teamMember?.user) {
      setAccountRole(teamMember.user.role)
      setAccountPermissions(teamMember.user.permissions || [])
      setAccountEmailAccess(teamMember.user.emailAccess || [])
      setAccountUsername(teamMember.user.username || '')
    }
  }, [teamMember])

  const fetchTeamMember = async () => {
    try {
      const res = await fetch(`/api/admin/team/${params.id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setTeamMember(data.teamMember)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-400'
      case 'INACTIVE':
        return 'bg-zinc-500/10 text-zinc-400'
      case 'TERMINATED':
        return 'bg-red-500/10 text-red-400'
      case 'ON_LEAVE':
        return 'bg-yellow-500/10 text-yellow-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  const getContractStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'SIGNED':
        return 'bg-green-500/10 text-green-400'
      case 'DRAFT':
        return 'bg-zinc-500/10 text-zinc-400'
      case 'SENT':
        return 'bg-blue-500/10 text-blue-400'
      case 'EXPIRED':
        return 'bg-red-500/10 text-red-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-500/10 text-green-400'
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400'
      default:
        return 'bg-zinc-500/10 text-zinc-400'
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      W9: 'W-9',
      I9: 'I-9',
      TAX_FORM: 'Tax Form',
      ID: 'ID',
      DIRECT_DEPOSIT: 'Direct Deposit',
      OTHER: 'Other',
    }
    return labels[type] || type
  }

  const getContractTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      EMPLOYMENT: 'Employment',
      NDA: 'NDA',
      NON_COMPETE: 'Non-Compete',
      EQUITY: 'Equity',
      OTHER: 'Other',
    }
    return labels[type] || type
  }

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SALARY: 'Salary',
      BONUS: 'Bonus',
      REIMBURSEMENT: 'Reimbursement',
      EQUITY_PAYOUT: 'Equity Payout',
    }
    return labels[type] || type
  }

  const togglePermission = (perm: Permission) => {
    setAccountPermissions(prev =>
      prev.includes(perm)
        ? prev.filter(p => p !== perm)
        : [...prev, perm]
    )
  }

  const toggleEmailAccess = (email: string) => {
    setAccountEmailAccess(prev =>
      prev.includes(email)
        ? prev.filter(e => e !== email)
        : [...prev, email]
    )
  }

  const handleUpdateAccountAccess = async () => {
    if (!teamMember?.user) return

    setAccountSaving(true)
    setAccountError('')

    try {
      const res = await fetch(`/api/admin/team/${teamMember.id}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          role: accountRole,
          permissions: accountPermissions,
          emailAccess: accountEmailAccess,
          username: accountUsername || null,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update account')

      fetchTeamMember()
    } catch (err: any) {
      setAccountError(err.message)
    } finally {
      setAccountSaving(false)
    }
  }

  const handleUnlinkAccount = async () => {
    if (!teamMember?.user) return
    if (!confirm('Are you sure you want to unlink this user account? The user will no longer be associated with this team member.')) return

    setAccountSaving(true)
    setAccountError('')

    try {
      const res = await fetch(`/api/admin/team/${teamMember.id}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlink' }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to unlink account')

      fetchTeamMember()
    } catch (err: any) {
      setAccountError(err.message)
    } finally {
      setAccountSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-zinc-800 rounded w-64"></div>
          <div className="h-64 bg-zinc-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (!teamMember) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-zinc-400">Team member not found</p>
          <Link href="/admin/team" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            Back to Team
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/team"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{teamMember.name}</h1>
            <p className="text-zinc-400">{teamMember.employeeNumber} - {teamMember.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(teamMember.status)}`}>
            {teamMember.status}
          </span>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Member
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800 mb-6">
        <div className="flex gap-6">
          {['overview', 'account', 'orders', 'contracts', 'documents', 'payments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab === 'account' ? 'Account Access' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'orders' && teamMember.user && ` (${teamMember.user._count?.orders || 0})`}
              {tab === 'contracts' && ` (${teamMember.contracts.length})`}
              {tab === 'documents' && ` (${teamMember.documents.length})`}
              {tab === 'payments' && ` (${teamMember.payments.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-500">Full Name</label>
                <p className="text-white">{teamMember.name}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Email</label>
                <p className="text-white">{teamMember.email}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Phone</label>
                <p className="text-white">{teamMember.phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Address</label>
                <p className="text-white whitespace-pre-wrap">{teamMember.address || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Date of Birth</label>
                <p className="text-white">
                  {teamMember.dateOfBirth ? formatDate(teamMember.dateOfBirth) : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Username</label>
                <p className="text-white font-mono">
                  {teamMember.user?.username ? `@${teamMember.user.username}` : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">User Account</label>
                <p className="text-white">{teamMember.user?.email || 'Not linked'}</p>
              </div>
            </div>
          </div>

          {/* Employment Info */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Employment Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-500">Title</label>
                <p className="text-white">{teamMember.title}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Department</label>
                <p className="text-white">{teamMember.department || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Start Date</label>
                <p className="text-white">{formatDate(teamMember.startDate)}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">End Date</label>
                <p className="text-white">
                  {teamMember.endDate ? formatDate(teamMember.endDate) : 'Current'}
                </p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Status</label>
                <p>
                  <span className={`px-2 py-1 rounded text-sm ${getStatusColor(teamMember.status)}`}>
                    {teamMember.status}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Employee Number</label>
                <p className="text-white font-mono">{teamMember.employeeNumber}</p>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Compensation</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-500">Salary Type</label>
                <p className="text-white">{teamMember.salaryType}</p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Salary Amount</label>
                <p className="text-white text-xl font-semibold">
                  {teamMember.salaryAmount ? formatCurrency(teamMember.salaryAmount) : '-'}
                </p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Frequency</label>
                <p className="text-white">{teamMember.salaryFrequency || '-'}</p>
              </div>
              <div className="pt-4 border-t border-zinc-800">
                <label className="text-sm text-zinc-500">Total Paid Out</label>
                <p className="text-green-400 text-xl font-semibold">
                  {formatCurrency(teamMember.totalPaid)}
                </p>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Equity</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-zinc-500">Equity Percentage</label>
                <p className="text-white text-xl font-semibold">
                  {teamMember.equityPercentage ? `${teamMember.equityPercentage}%` : 'None'}
                </p>
              </div>
              <div>
                <label className="text-sm text-zinc-500">Notes</label>
                <p className="text-white whitespace-pre-wrap">
                  {teamMember.equityNotes || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Access Tab */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {accountError && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {accountError}
            </div>
          )}

          {!teamMember.user ? (
            // No user account linked
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-8 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="text-lg font-semibold text-white mb-2">No User Account Linked</h3>
              <p className="text-zinc-400 mb-6">
                This team member does not have a user account for admin access. Create one to grant system access.
              </p>
              <button
                onClick={() => setShowCreateAccountModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create User Account
              </button>
            </div>
          ) : (
            // User account exists
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Info */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Account Information</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowResetPasswordModal(true)}
                      className="px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-lg text-sm hover:bg-amber-500/20 transition-colors"
                    >
                      Reset Password
                    </button>
                    <button
                      onClick={handleUnlinkAccount}
                      disabled={accountSaving}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      Unlink
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-zinc-500">Email</label>
                    <p className="text-white">{teamMember.user.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-zinc-500 mb-1 block">Username</label>
                    <input
                      type="text"
                      value={accountUsername}
                      onChange={(e) => setAccountUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                      placeholder="e.g., johndoe"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white font-mono text-sm"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Lowercase letters and numbers only. Used for login.</p>
                  </div>
                  <div>
                    <label className="text-sm text-zinc-500">Current Role</label>
                    <p>
                      <span className={`inline-block px-2 py-1 rounded text-sm ${
                        teamMember.user.role === 'SUPER_ADMIN'
                          ? 'bg-purple-500/20 text-purple-400'
                          : teamMember.user.role === 'ADMIN'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {teamMember.user.role === 'SUPER_ADMIN' ? 'Super Admin' : teamMember.user.role === 'ADMIN' ? 'Admin' : 'Customer'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">System Role</h2>
                <p className="text-sm text-zinc-400 mb-4">
                  Determines what level of admin access this user has.
                </p>
                <div className="flex gap-2">
                  {(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setAccountRole(role)}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        accountRole === role
                          ? role === 'SUPER_ADMIN'
                            ? 'bg-purple-500/20 border-2 border-purple-500 text-purple-400'
                            : role === 'ADMIN'
                            ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400'
                            : 'bg-zinc-500/20 border-2 border-zinc-500 text-zinc-300'
                          : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Admin' : 'No Admin Access'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-3">
                  {accountRole === 'SUPER_ADMIN' && 'Full access to all features including user management and settings.'}
                  {accountRole === 'ADMIN' && 'Access based on permissions below. Cannot manage other admins.'}
                  {accountRole === 'CUSTOMER' && 'No admin panel access. Standard customer account only.'}
                </p>
              </div>

              {/* Permissions */}
              {accountRole !== 'CUSTOMER' && (
                <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Permissions</h2>
                  <p className="text-sm text-zinc-400 mb-4">
                    Select which areas this admin can access.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <button
                        key={perm.key}
                        onClick={() => togglePermission(perm.key)}
                        className={`p-3 rounded-lg text-left transition-all ${
                          accountPermissions.includes(perm.key)
                            ? 'bg-green-500/10 border-2 border-green-500'
                            : 'bg-zinc-900 border border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        <div className={`text-sm font-medium ${accountPermissions.includes(perm.key) ? 'text-green-400' : 'text-white'}`}>
                          {perm.label}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">{perm.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Email Access */}
              {accountRole !== 'CUSTOMER' && (
                <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Company Email Access</h2>
                  <p className="text-sm text-zinc-400 mb-4">
                    Select which company email inboxes this admin can access.
                  </p>
                  <div className="space-y-2">
                    {COMPANY_EMAILS.map(email => (
                      <button
                        key={email}
                        onClick={() => toggleEmailAccess(email)}
                        className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                          accountEmailAccess.includes(email)
                            ? 'bg-blue-500/10 border-2 border-blue-500'
                            : 'bg-zinc-900 border border-zinc-700 hover:border-zinc-500'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          accountEmailAccess.includes(email) ? 'bg-blue-500' : 'border border-zinc-600'
                        }`}>
                          {accountEmailAccess.includes(email) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm ${accountEmailAccess.includes(email) ? 'text-blue-400' : 'text-white'}`}>
                          {email}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Save Button */}
          {teamMember.user && (
            <div className="flex justify-end">
              <button
                onClick={handleUpdateAccountAccess}
                disabled={accountSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {accountSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Purchase History</h2>
          {!teamMember.user ? (
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-400">No user account linked - cannot view orders</p>
            </div>
          ) : !teamMember.user.orders || teamMember.user.orders.length === 0 ? (
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-400">No orders found</p>
            </div>
          ) : (
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Order</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Total</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {teamMember.user.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-blue-400">{order.orderNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-sm">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          order.status === 'DELIVERED' ? 'bg-green-500/20 text-green-400' :
                          order.status === 'SHIPPED' ? 'bg-purple-500/20 text-purple-400' :
                          order.status === 'PROCESSING' ? 'bg-blue-500/20 text-blue-400' :
                          order.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                          order.status === 'REFUNDED' ? 'bg-zinc-500/20 text-zinc-400' :
                          'bg-amber-500/20 text-amber-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-white">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`/admin/orders/${order.id}`}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Contracts</h2>
            <button
              onClick={() => setShowContractModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Add Contract
            </button>
          </div>
          {teamMember.contracts.length === 0 ? (
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-400">No contracts found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamMember.contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="bg-[#18181b] border border-zinc-800 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-white">{contract.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-zinc-400">
                          {getContractTypeLabel(contract.type)}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getContractStatusColor(contract.status)}`}>
                          {contract.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-zinc-400">
                      {contract.effectiveDate && (
                        <p>Effective: {formatDate(contract.effectiveDate)}</p>
                      )}
                      {contract.expirationDate && (
                        <p>Expires: {formatDate(contract.expirationDate)}</p>
                      )}
                    </div>
                  </div>
                  {contract.fileUrl && (
                    <div className="mt-3 pt-3 border-t border-zinc-800">
                      <a
                        href={contract.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {contract.fileName || 'View Document'}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Documents</h2>
            <button
              onClick={() => setShowDocumentModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Upload Document
            </button>
          </div>
          {teamMember.documents.length === 0 ? (
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-400">No documents found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teamMember.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-[#18181b] border border-zinc-800 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-white">{doc.name}</h3>
                      <span className="text-sm text-zinc-400">
                        {getDocumentTypeLabel(doc.type)}
                      </span>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                  <div className="mt-3 pt-3 border-t border-zinc-800">
                    <p className="text-xs text-zinc-500">
                      Uploaded {formatDate(doc.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Payments</h2>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Record Payment
            </button>
          </div>
          {teamMember.payments.length === 0 ? (
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-8 text-center">
              <p className="text-zinc-400">No payments recorded</p>
            </div>
          ) : (
            <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-900">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Payment #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Period</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-400">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Method</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {teamMember.payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-zinc-900/50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-white">{payment.paymentNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-white">
                        {getPaymentTypeLabel(payment.type)}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-sm">
                        {payment.periodStart && payment.periodEnd ? (
                          <>
                            {formatDate(payment.periodStart)} - {formatDate(payment.periodEnd)}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-white">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-zinc-400">
                        {payment.method || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${getPaymentStatusColor(payment.status)}`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 text-sm">
                        {payment.paidAt ? formatDate(payment.paidAt) : formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Team Member Modal */}
      {showEditModal && (
        <EditTeamMemberModal
          teamMember={teamMember}
          onClose={() => setShowEditModal(false)}
          onSaved={() => {
            setShowEditModal(false)
            fetchTeamMember()
          }}
        />
      )}

      {/* Add Contract Modal */}
      {showContractModal && (
        <AddContractModal
          teamMemberId={teamMember.id}
          onClose={() => setShowContractModal(false)}
          onSaved={() => {
            setShowContractModal(false)
            fetchTeamMember()
          }}
        />
      )}

      {/* Upload Document Modal */}
      {showDocumentModal && (
        <UploadDocumentModal
          teamMemberId={teamMember.id}
          onClose={() => setShowDocumentModal(false)}
          onSaved={() => {
            setShowDocumentModal(false)
            fetchTeamMember()
          }}
        />
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <RecordPaymentModal
          teamMemberId={teamMember.id}
          onClose={() => setShowPaymentModal(false)}
          onSaved={() => {
            setShowPaymentModal(false)
            fetchTeamMember()
          }}
        />
      )}

      {/* Create Account Modal */}
      {showCreateAccountModal && (
        <CreateAccountModal
          teamMember={teamMember}
          onClose={() => setShowCreateAccountModal(false)}
          onSaved={() => {
            setShowCreateAccountModal(false)
            fetchTeamMember()
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && teamMember.user && (
        <ResetPasswordModal
          user={teamMember.user}
          onClose={() => setShowResetPasswordModal(false)}
          onSaved={() => {
            setShowResetPasswordModal(false)
          }}
        />
      )}
    </div>
  )
}

// Edit Team Member Modal
function EditTeamMemberModal({
  teamMember,
  onClose,
  onSaved,
}: {
  teamMember: TeamMember
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: teamMember.name,
    email: teamMember.email,
    phone: teamMember.phone || '',
    address: teamMember.address || '',
    dateOfBirth: teamMember.dateOfBirth ? teamMember.dateOfBirth.split('T')[0] : '',
    title: teamMember.title,
    department: teamMember.department || '',
    startDate: teamMember.startDate.split('T')[0],
    endDate: teamMember.endDate ? teamMember.endDate.split('T')[0] : '',
    status: teamMember.status,
    salaryType: teamMember.salaryType,
    salaryAmount: teamMember.salaryAmount?.toString() || '',
    salaryFrequency: teamMember.salaryFrequency || '',
    equityPercentage: teamMember.equityPercentage?.toString() || '',
    equityNotes: teamMember.equityNotes || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/team/${teamMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to update')
      onSaved()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to update team member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Edit Team Member</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Personal Info */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-zinc-400 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Employment Info */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Employment Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-zinc-400 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="TERMINATED">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Compensation */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Compensation</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Salary Type</label>
                <select
                  value={formData.salaryType}
                  onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                >
                  <option value="SALARY">Salary</option>
                  <option value="HOURLY">Hourly</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salaryAmount}
                  onChange={(e) => setFormData({ ...formData, salaryAmount: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Frequency</label>
                <select
                  value={formData.salaryFrequency}
                  onChange={(e) => setFormData({ ...formData, salaryFrequency: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                >
                  <option value="">Select...</option>
                  <option value="ANNUAL">Annual</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="BIWEEKLY">Bi-weekly</option>
                  <option value="HOURLY">Hourly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Equity */}
          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">Equity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Equity Percentage</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.equityPercentage}
                  onChange={(e) => setFormData({ ...formData, equityPercentage: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  placeholder="e.g., 2.5"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Equity Notes</label>
                <input
                  type="text"
                  value={formData.equityNotes}
                  onChange={(e) => setFormData({ ...formData, equityNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                  placeholder="e.g., Vesting over 4 years"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Contract Modal
function AddContractModal({
  teamMemberId,
  onClose,
  onSaved,
}: {
  teamMemberId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: 'EMPLOYMENT',
    status: 'DRAFT',
    fileUrl: '',
    fileName: '',
    effectiveDate: '',
    expirationDate: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/team/${teamMemberId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to create')
      onSaved()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to add contract')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Add Contract</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="e.g., Employment Agreement"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
            >
              <option value="EMPLOYMENT">Employment</option>
              <option value="NDA">NDA</option>
              <option value="NON_COMPETE">Non-Compete</option>
              <option value="EQUITY">Equity</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="SIGNED">Signed</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Effective Date</label>
              <input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Expiration Date</label>
              <input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">File URL</label>
            <input
              type="text"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Contract'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Upload Document Modal
function UploadDocumentModal({
  teamMemberId,
  onClose,
  onSaved,
}: {
  teamMemberId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'OTHER',
    fileUrl: '',
    fileName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/team/${teamMemberId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to upload')
      onSaved()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Upload Document</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Document Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="e.g., W-9 Form 2026"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
            >
              <option value="W9">W-9</option>
              <option value="I9">I-9</option>
              <option value="TAX_FORM">Tax Form</option>
              <option value="ID">ID</option>
              <option value="DIRECT_DEPOSIT">Direct Deposit</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">File URL *</label>
            <input
              type="text"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="https://..."
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">File Name *</label>
            <input
              type="text"
              value={formData.fileName}
              onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="e.g., w9-2026.pdf"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Record Payment Modal
function RecordPaymentModal({
  teamMemberId,
  onClose,
  onSaved,
}: {
  teamMemberId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: 'SALARY',
    amount: '',
    description: '',
    periodStart: '',
    periodEnd: '',
    method: '',
    reference: '',
    status: 'PENDING',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/team/${teamMemberId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Failed to record')
      onSaved()
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Record Payment</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              >
                <option value="SALARY">Salary</option>
                <option value="BONUS">Bonus</option>
                <option value="REIMBURSEMENT">Reimbursement</option>
                <option value="EQUITY_PAYOUT">Equity Payout</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Amount *</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="e.g., January 2026 Salary"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Period Start</label>
              <input
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Period End</label>
              <input
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Method</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              >
                <option value="">Select...</option>
                <option value="CHECK">Check</option>
                <option value="DIRECT_DEPOSIT">Direct Deposit</option>
                <option value="ZELLE">Zelle</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Reference</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                placeholder="e.g., Check #1234"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
            >
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Create Account Modal
function CreateAccountModal({
  teamMember,
  onClose,
  onSaved,
}: {
  teamMember: TeamMember
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: teamMember.email,
    username: '',
    password: '',
    confirmPassword: '',
    role: 'ADMIN' as 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN',
    permissions: [] as Permission[],
    emailAccess: [] as string[],
  })

  const togglePermission = (perm: Permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }))
  }

  const toggleEmailAccess = (email: string) => {
    setFormData(prev => ({
      ...prev,
      emailAccess: prev.emailAccess.includes(email)
        ? prev.emailAccess.filter(e => e !== email)
        : [...prev.emailAccess, email]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/admin/team/${teamMember.id}/account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          email: formData.email,
          username: formData.username || undefined,
          password: formData.password,
          role: formData.role,
          permissions: formData.permissions,
          emailAccess: formData.emailAccess,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create account')
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Create User Account</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Create a user account for {teamMember.name}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Username (optional)</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="e.g., johndoe"
            />
            <p className="text-xs text-zinc-500 mt-1">Lowercase letters and numbers only</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                placeholder="Min 8 characters"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Confirm Password *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Role</label>
            <div className="flex gap-2">
              {(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'] as const).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, role }))}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                    formData.role === role
                      ? 'bg-blue-500/20 border-2 border-blue-500 text-blue-400'
                      : 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                  }`}
                >
                  {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'ADMIN' ? 'Admin' : 'Customer'}
                </button>
              ))}
            </div>
          </div>

          {formData.role !== 'CUSTOMER' && (
            <>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <button
                      key={perm.key}
                      type="button"
                      onClick={() => togglePermission(perm.key)}
                      className={`p-2 rounded-lg text-left text-sm transition-all ${
                        formData.permissions.includes(perm.key)
                          ? 'bg-green-500/10 border border-green-500 text-green-400'
                          : 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                      }`}
                    >
                      {perm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Email Access</label>
                <div className="space-y-2">
                  {COMPANY_EMAILS.map(email => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => toggleEmailAccess(email)}
                      className={`w-full p-2 rounded-lg text-left text-sm transition-all flex items-center gap-2 ${
                        formData.emailAccess.includes(email)
                          ? 'bg-blue-500/10 border border-blue-500 text-blue-400'
                          : 'bg-zinc-900 border border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center ${
                        formData.emailAccess.includes(email) ? 'bg-blue-500' : 'border border-zinc-600'
                      }`}>
                        {formData.emailAccess.includes(email) && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      {email}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Reset Password Modal
function ResetPasswordModal({
  user,
  onClose,
  onSaved,
}: {
  user: { id: string; email: string; name: string | null }
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sendNotification, setSendNotification] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: password,
          sendNotification,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')

      alert('Password reset successfully' + (data.notificationSent ? ' - notification email sent' : ''))
      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-md">
        <div className="p-6 border-b border-zinc-800">
          <h2 className="text-xl font-semibold text-white">Reset Password</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Reset password for {user.name || user.email}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              placeholder="Min 8 characters"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
              required
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendNotification}
                onChange={(e) => setSendNotification(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-zinc-400">Send email notification to user</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
