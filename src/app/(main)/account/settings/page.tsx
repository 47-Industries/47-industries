'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfile {
  id: string
  name: string | null
  email: string
  title: string | null
  createdAt: string
}

interface Address {
  id: string
  name: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

interface MotoRevStatus {
  connected: boolean
  hasAffiliate: boolean
  affiliate?: {
    id: string
    affiliateCode: string
    motorevUserId: string | null
    motorevEmail: string | null
    motorevUsername: string | null
    motorevProfilePicture: string | null
    connectedAt: string | null
    rewardPreference: string
    stats: {
      totalReferrals: number
      totalEarnings: number
      pendingEarnings: number
      proTimeEarnedDays: number
    }
    rates: {
      shopCommission: number
      proBonus: number
      retentionBonus: number
    }
    isPartner: boolean
  }
}

export default function AccountSettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [motorevStatus, setMotorevStatus] = useState<MotoRevStatus | null>(null)
  const [motorevLoading, setMotorevLoading] = useState(false)
  const [oauthPopup, setOauthPopup] = useState<Window | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')

  // Password change
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/settings')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchProfile()
      fetchMotorevStatus()
    }
  }, [session])

  async function fetchProfile() {
    try {
      const res = await fetch('/api/account/profile')
      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setName(data.user.name || '')
        setTitle(data.user.title || '')
        setAddresses(data.addresses || [])
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMotorevStatus() {
    try {
      const res = await fetch('/api/account/motorev')
      if (res.ok) {
        const data = await res.json()
        setMotorevStatus(data)
      }
    } catch (error) {
      console.error('Error fetching MotoRev status:', error)
    }
  }

  async function connectMotorev() {
    setMotorevLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/motorev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-token' }),
      })

      if (res.ok) {
        const data = await res.json()

        // Open OAuth popup to MotoRev
        const popupWidth = 480
        const popupHeight = 640
        const left = window.screenX + (window.outerWidth - popupWidth) / 2
        const top = window.screenY + (window.outerHeight - popupHeight) / 2

        const motorevConnectUrl = `https://motorevapp.com/connect-47i.html?token=${encodeURIComponent(data.token)}&state=${encodeURIComponent(session?.user?.id || '')}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/account/motorev/callback')}`

        const popup = window.open(
          motorevConnectUrl,
          'motorev-connect',
          `width=${popupWidth},height=${popupHeight},left=${left},top=${top},popup=yes,toolbar=no,menubar=no`
        )

        setOauthPopup(popup)

        // Listen for OAuth callback message from popup
        const handleMessage = async (event: MessageEvent) => {
          if (event.data?.type === 'motorev-oauth-success') {
            window.removeEventListener('message', handleMessage)
            setOauthPopup(null)
            setMotorevLoading(false)

            // Save the connection data
            await fetch('/api/account/motorev/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(event.data.data),
            })

            // Refresh status
            await fetchMotorevStatus()
            setMessage({ type: 'success', text: 'MotoRev account connected successfully!' })
          } else if (event.data?.type === 'motorev-oauth-cancel') {
            window.removeEventListener('message', handleMessage)
            setOauthPopup(null)
            setMotorevLoading(false)
            setMessage({ type: 'error', text: 'Connection cancelled' })
          }
        }

        window.addEventListener('message', handleMessage)

        // Also check if popup was closed without completing
        const checkPopupClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopupClosed)
            window.removeEventListener('message', handleMessage)
            setOauthPopup(null)
            setMotorevLoading(false)
          }
        }, 500)

      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to generate connection' })
        setMotorevLoading(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
      setMotorevLoading(false)
    }
  }

  async function disconnectMotorev() {
    if (!confirm('Are you sure you want to disconnect your MotoRev account?')) return

    setMotorevLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/motorev', {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchMotorevStatus()
        setConnectionLink(null)
        setMessage({ type: 'success', text: 'MotoRev account disconnected' })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to disconnect' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setMotorevLoading(false)
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, title }),
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(data.user)
        setMessage({ type: 'success', text: 'Profile updated successfully' })
        // Update session with new name
        await update({ name })
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setShowPasswordChange(false)
      } else {
        const error = await res.json()
        setMessage({ type: 'error', text: error.error || 'Failed to change password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || status === 'unauthenticated' || loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-2xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/account" className="text-sm text-text-secondary hover:text-accent transition-colors">
            ← Back to Account
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-text-secondary">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-500 border border-green-500/20'
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Form */}
        <div className="border border-border rounded-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-border bg-surface/50">
            <h2 className="text-lg font-semibold">Profile Information</h2>
          </div>
          <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Email</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-surface/50 border border-border rounded-lg text-text-secondary cursor-not-allowed"
              />
              <p className="text-xs text-text-secondary mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-sm text-text-secondary mb-2">Title / Position</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., President, CEO, Manager"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
              />
              <p className="text-xs text-text-secondary mt-1">Your title will be used when signing contracts</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Change */}
        <div className="border border-border rounded-xl overflow-hidden mb-8">
          <div className="p-6 border-b border-border bg-surface/50 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Password</h2>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="text-sm text-accent hover:underline"
            >
              {showPasswordChange ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {showPasswordChange ? (
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-text-secondary mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6">
              <p className="text-text-secondary text-sm">
                Click "Change Password" to update your password.
              </p>
            </div>
          )}
        </div>

        {/* Account Info */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border bg-surface/50">
            <h2 className="text-lg font-semibold">Account Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Member Since</p>
                <p className="font-medium">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-text-secondary">Account ID</p>
                <p className="font-medium font-mono text-xs">{profile?.id?.slice(0, 12)}...</p>
              </div>
            </div>
          </div>
        </div>

        {/* MotoRev Connection */}
        <div className="border border-border rounded-xl overflow-hidden mt-8">
          <div className="p-6 border-b border-border bg-surface/50">
            <div className="flex items-center gap-3">
              <img
                src="https://motorevapp.com/images/favicon.png"
                alt="MotoRev"
                className="w-10 h-10 rounded-xl"
              />
              <div>
                <h2 className="text-lg font-semibold">MotoRev Connection</h2>
                <p className="text-sm text-text-secondary">Link your MotoRev account to earn rewards</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            {motorevStatus?.connected ? (
              <div className="space-y-4">
                {/* Connected MotoRev Profile */}
                {motorevStatus.affiliate && (
                  <a
                    href={`https://motorevapp.com/rider/${motorevStatus.affiliate.motorevUsername || motorevStatus.affiliate.motorevUserId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-xl hover:border-[#0066FF]/40 transition-colors cursor-pointer"
                  >
                    {motorevStatus.affiliate.motorevProfilePicture ? (
                      <img
                        src={motorevStatus.affiliate.motorevProfilePicture}
                        alt="MotoRev Profile"
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#0066FF]/50"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-[#0066FF] flex items-center justify-center text-white text-xl font-bold">
                        {motorevStatus.affiliate.motorevUsername?.[0]?.toUpperCase() || 'M'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-bold">
                          @{motorevStatus.affiliate.motorevUsername || 'MotoRev User'}
                        </p>
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-text-secondary">{motorevStatus.affiliate.motorevEmail}</p>
                      <p className="text-xs text-text-secondary mt-1">Click to view profile in MotoRev</p>
                    </div>
                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}

                {/* Affiliate Info */}
                {motorevStatus.affiliate && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-text-secondary">Your Referral Code</p>
                        <p className="font-mono font-bold text-lg">{motorevStatus.affiliate.affiliateCode}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Connected Since</p>
                        <p className="font-medium">
                          {motorevStatus.affiliate.connectedAt
                            ? new Date(motorevStatus.affiliate.connectedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Reward Preference</p>
                        <p className="font-medium">
                          {motorevStatus.affiliate.rewardPreference === 'CASH' ? 'Cash Payout' : 'Pro Subscription Time'}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-surface/50 rounded-lg p-4">
                      <p className="text-sm text-text-secondary mb-3">Your Earnings</p>
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold">{motorevStatus.affiliate.stats.totalReferrals}</p>
                          <p className="text-xs text-text-secondary">Referrals</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-500">
                            ${motorevStatus.affiliate.stats.totalEarnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-text-secondary">Total Earned</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-yellow-500">
                            ${motorevStatus.affiliate.stats.pendingEarnings.toFixed(2)}
                          </p>
                          <p className="text-xs text-text-secondary">Pending</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-blue-500">
                            {motorevStatus.affiliate.stats.proTimeEarnedDays}d
                          </p>
                          <p className="text-xs text-text-secondary">Pro Time</p>
                        </div>
                      </div>
                    </div>

                    {/* Commission Rates */}
                    <div className="text-sm text-text-secondary">
                      <p>
                        Your rates: {motorevStatus.affiliate.rates.shopCommission}% shop orders,
                        ${motorevStatus.affiliate.rates.proBonus.toFixed(2)} per Pro conversion,
                        ${motorevStatus.affiliate.rates.retentionBonus.toFixed(2)}/mo retention
                        {motorevStatus.affiliate.isPartner && (
                          <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">Partner</span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={disconnectMotorev}
                      disabled={motorevLoading}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                    >
                      {motorevLoading ? 'Disconnecting...' : 'Disconnect MotoRev'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-text-secondary text-sm">
                  Connect your MotoRev account to earn rewards when you refer new users. Get commissions on Pro subscriptions and shop orders!
                </p>

                {motorevStatus?.hasAffiliate && motorevStatus?.affiliate && (
                  <div className="bg-surface/50 rounded-lg p-4">
                    <p className="text-sm text-text-secondary mb-1">Your Referral Code</p>
                    <p className="font-mono font-bold text-lg">{motorevStatus.affiliate.affiliateCode}</p>
                    <p className="text-xs text-text-secondary mt-1">
                      Share this code with friends to earn rewards
                    </p>
                  </div>
                )}

                {oauthPopup && (
                  <div className="bg-[#0066FF]/10 border border-[#0066FF]/20 rounded-lg p-4">
                    <p className="text-sm text-[#0066FF] mb-2">Complete the connection in the popup window</p>
                    <p className="text-xs text-text-secondary">
                      Sign in to your MotoRev account in the popup to complete the connection.
                    </p>
                  </div>
                )}

                <button
                  onClick={connectMotorev}
                  disabled={motorevLoading}
                  className="px-6 py-3 bg-[#0066FF] text-white rounded-lg hover:bg-[#0052CC] transition-colors disabled:opacity-50 font-medium"
                >
                  {motorevLoading ? 'Connecting...' : 'Connect MotoRev Account'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
