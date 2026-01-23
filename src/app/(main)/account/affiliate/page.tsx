'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import {
  faCircleCheck,
  faStar,
  faCrown,
  faBolt,
  faShield,
  faShieldHalved,
  faFire,
  faHeart,
  faGift,
  faTrophy,
  faMedal,
  faAward,
  faMagic,
  faUserShield,
  faScrewdriverWrench,
  faHammer,
  faCar,
  faBicycle,
  faCertificate,
  faCopy,
  faCheck,
  faArrowRight,
  faPen,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'

interface AffiliateStats {
  affiliateCode: string
  points: {
    total: number
    available: number
    redeemed: number
    toNextReward: number
    progressPercent: number
  }
  stats: {
    totalReferrals: number
    proConversions: number
    proDaysEarned: number
    totalTransactions: number
    totalRedemptions: number
  }
  partnerEligible: boolean
  isPartner: boolean
  partnerId: string | null
  motorev: {
    userId: string
    email: string | null
    username: string | null
    profilePicture: string | null
    badge: {
      name: string
      icon: string | null
      color: string | null
    } | null
  } | null
  shareLink: string
}

interface PointTransaction {
  id: string
  type: string
  points: number
  description: string | null
  motorevEmail: string | null
  createdAt: string
}

// MotoRev badge mapping - SF Symbols to Font Awesome icons
const MOTOREV_BADGE_ICONS: Record<string, IconDefinition> = {
  'checkmark.seal.fill': faCircleCheck,
  'checkmark.seal': faCircleCheck,
  'star.fill': faStar,
  'crown.fill': faCrown,
  'bolt.fill': faBolt,
  'shield.fill': faShield,
  'shield.lefthalf.filled': faShieldHalved,
  'flame.fill': faFire,
  'heart.fill': faHeart,
  'gift.fill': faGift,
  'trophy.fill': faTrophy,
  'medal.fill': faMedal,
  'rosette': faAward,
  'sparkles': faMagic,
  'person.badge.shield.checkmark.fill': faUserShield,
  'wrench.and.screwdriver.fill': faScrewdriverWrench,
  'hammer.fill': faHammer,
  'car.fill': faCar,
  'bicycle': faBicycle,
}

// MotoRev badge colors
const MOTOREV_BADGE_COLORS: Record<string, string> = {
  purple: '#A855F7',
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  gold: '#F59E0B',
  orange: '#F97316',
  red: '#EF4444',
  pink: '#EC4899',
  cyan: '#06B6D4',
  teal: '#14B8A6',
  indigo: '#6366F1',
}

function getMotorevBadgeColor(color: string | null | undefined): string {
  if (!color) return '#3B82F6'
  if (color.startsWith('#')) return color
  return MOTOREV_BADGE_COLORS[color.toLowerCase()] || '#3B82F6'
}

function getMotorevBadgeIcon(icon: string | null | undefined): IconDefinition {
  if (!icon) return faCircleCheck
  return MOTOREV_BADGE_ICONS[icon] || faCertificate
}

function getTransactionTypeLabel(type: string): string {
  switch (type) {
    case 'VERIFIED_SIGNUP':
      return 'Signup'
    case 'PRO_CONVERSION':
      return 'Pro Conversion'
    case 'MANUAL_ADJUSTMENT':
      return 'Adjustment'
    default:
      return type
  }
}

export default function UserAffiliateDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AffiliateStats | null>(null)
  const [transactions, setTransactions] = useState<PointTransaction[]>([])
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Custom code state
  const [showCustomCode, setShowCustomCode] = useState(false)
  const [customCode, setCustomCode] = useState('')
  const [customCodeError, setCustomCodeError] = useState<string | null>(null)
  const [customCodeAvailable, setCustomCodeAvailable] = useState<boolean | null>(null)
  const [checkingCode, setCheckingCode] = useState(false)
  const [settingCode, setSettingCode] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account/affiliate')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchAffiliateData()
    }
  }, [session])

  async function fetchAffiliateData() {
    try {
      const res = await fetch('/api/account/affiliate')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setTransactions(data.recentActivity || [])
      } else if (res.status === 404) {
        setError('no-affiliate')
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to load affiliate data')
      }
    } catch (err) {
      console.error('Error fetching affiliate data:', err)
      setError('Failed to load affiliate data')
    } finally {
      setLoading(false)
    }
  }

  async function copyShareLink() {
    if (!stats?.shareLink) return
    try {
      await navigator.clipboard.writeText(stats.shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  function handleCustomCodeChange(value: string) {
    // Only allow alphanumeric characters, auto-format with MR- prefix
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, '')

    // If user starts typing without MR-, add it
    let formatted = cleaned
    if (!cleaned.startsWith('MR-')) {
      formatted = 'MR-' + cleaned.replace(/^MR-?/i, '')
    }

    // Limit to MR- + 6 chars
    if (formatted.length > 9) {
      formatted = formatted.slice(0, 9)
    }

    setCustomCode(formatted)
    setCustomCodeError(null)
    setCustomCodeAvailable(null)
  }

  async function checkCodeAvailability() {
    if (customCode.length !== 9) {
      setCustomCodeError('Code must be MR- followed by 6 characters')
      return
    }

    setCheckingCode(true)
    setCustomCodeError(null)
    setCustomCodeAvailable(null)

    try {
      const res = await fetch(`/api/account/affiliate/custom-code?code=${encodeURIComponent(customCode)}`)
      const data = await res.json()

      if (data.available) {
        setCustomCodeAvailable(true)
      } else {
        setCustomCodeAvailable(false)
        setCustomCodeError(data.error || 'This code is already taken')
      }
    } catch (err) {
      setCustomCodeError('Failed to check code availability')
    } finally {
      setCheckingCode(false)
    }
  }

  async function setCustomReferralCode() {
    if (!customCodeAvailable || customCode.length !== 9) return

    setSettingCode(true)
    setCustomCodeError(null)

    try {
      const res = await fetch('/api/account/affiliate/custom-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: customCode }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Update local state
        setStats(prev => prev ? {
          ...prev,
          affiliateCode: data.affiliateCode,
          shareLink: `https://motorevapp.com/signup?ref=${data.affiliateCode}`,
        } : null)
        setShowCustomCode(false)
        setCustomCode('')
        setCustomCodeAvailable(null)
      } else {
        setCustomCodeError(data.error || 'Failed to set custom code')
      }
    } catch (err) {
      setCustomCodeError('Failed to set custom code')
    } finally {
      setSettingCode(false)
    }
  }

  if (status === 'loading' || status === 'unauthenticated' || loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  // No affiliate account yet
  if (error === 'no-affiliate') {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="mb-8">
            <Link href="/account" className="text-sm text-text-secondary hover:text-accent transition-colors">
              Back to Account
            </Link>
          </div>

          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center">
              <FontAwesomeIcon icon={faGift} className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Join the MotoRev Affiliate Program</h1>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Connect your MotoRev account to start earning points for referring new users.
              Points automatically convert to free Pro subscription time.
            </p>
            <Link
              href="/account/settings"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0066FF] text-white rounded-lg hover:bg-[#0052CC] transition-colors font-medium"
            >
              Connect MotoRev Account
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="mb-8">
            <Link href="/account" className="text-sm text-text-secondary hover:text-accent transition-colors">
              Back to Account
            </Link>
          </div>
          <div className="text-center py-12">
            <p className="text-red-500">{error || 'Something went wrong'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/account" className="text-sm text-text-secondary hover:text-accent transition-colors">
            Back to Account
          </Link>
        </div>

        {/* Header with MotoRev Profile */}
        <div className="mb-8 flex items-center gap-4">
          {stats.motorev?.profilePicture ? (
            <img
              src={stats.motorev.profilePicture}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-[#0066FF]/50"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#0066FF] flex items-center justify-center text-white text-xl font-bold">
              {stats.motorev?.username?.[0]?.toUpperCase() || 'M'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {stats.motorev?.username ? `@${stats.motorev.username}` : 'Your Affiliate Dashboard'}
              </h1>
              {stats.motorev?.badge?.icon && (
                <FontAwesomeIcon
                  icon={getMotorevBadgeIcon(stats.motorev.badge.icon)}
                  style={{
                    width: '20px',
                    height: '20px',
                    color: getMotorevBadgeColor(stats.motorev.badge.color)
                  }}
                />
              )}
            </div>
            <p className="text-text-secondary">MotoRev Affiliate Program</p>
          </div>
        </div>

        {/* Points Progress Card */}
        <div className="border border-border rounded-xl overflow-hidden mb-6">
          <div className="p-6 bg-gradient-to-br from-[#0066FF]/10 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Points</h2>
              <span className="text-3xl font-bold text-[#0066FF]">{stats.points.available}</span>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="h-3 bg-surface rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#0066FF] to-[#00AAFF] rounded-full transition-all duration-500"
                  style={{ width: `${stats.points.progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                {stats.points.toNextReward === 0
                  ? 'Ready to redeem!'
                  : `${stats.points.toNextReward} points to next reward`}
              </span>
              <span className="text-text-secondary">
                10 points = 7 days Pro
              </span>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.points.total}</p>
                <p className="text-xs text-text-secondary">Total Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{stats.stats.proDaysEarned}d</p>
                <p className="text-xs text-text-secondary">Pro Time Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.points.redeemed}</p>
                <p className="text-xs text-text-secondary">Points Redeemed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Share Link */}
        <div className="border border-border rounded-xl overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Share Your Link</h2>
            <p className="text-sm text-text-secondary mb-4">
              Share this link with friends. Earn 1 point per signup, 10 points when they upgrade to Pro.
            </p>
            <div className="flex gap-2">
              <div className="flex-1 px-4 py-3 bg-surface rounded-lg font-mono text-sm truncate">
                {stats.shareLink}
              </div>
              <button
                onClick={copyShareLink}
                className="px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-4 h-4" />
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-text-secondary">
                Referral Code: <span className="font-mono font-bold">{stats.affiliateCode}</span>
              </p>
              <button
                onClick={() => setShowCustomCode(!showCustomCode)}
                className="text-xs text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
              >
                <FontAwesomeIcon icon={faPen} className="w-3 h-3" />
                Customize Code
              </button>
            </div>

            {/* Custom Code Form */}
            {showCustomCode && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-2">Set Custom Referral Code</h3>
                <p className="text-xs text-text-secondary mb-3">
                  Choose a memorable code for your referral link. Format: MR-XXXXXX (6 alphanumeric characters)
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => handleCustomCodeChange(e.target.value)}
                    placeholder="MR-XXXXXX"
                    className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm font-mono uppercase focus:outline-none focus:border-accent"
                    maxLength={9}
                  />
                  <button
                    onClick={checkCodeAvailability}
                    disabled={customCode.length !== 9 || checkingCode}
                    className="px-4 py-2 bg-surface border border-border text-sm rounded-lg hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingCode ? (
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                    ) : (
                      'Check'
                    )}
                  </button>
                </div>

                {/* Status Messages */}
                {customCodeError && (
                  <p className="text-xs text-red-500 mt-2">{customCodeError}</p>
                )}

                {customCodeAvailable && (
                  <div className="mt-3">
                    <p className="text-xs text-green-500 mb-2 flex items-center gap-1">
                      <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                      Code is available!
                    </p>
                    <button
                      onClick={setCustomReferralCode}
                      disabled={settingCode}
                      className="px-4 py-2 bg-accent text-white text-sm rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {settingCode ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                          Setting...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                          Use This Code
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{stats.stats.totalReferrals}</p>
            <p className="text-xs text-text-secondary">Total Signups</p>
          </div>
          <div className="border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[#0066FF]">{stats.stats.proConversions}</p>
            <p className="text-xs text-text-secondary">Pro Conversions</p>
          </div>
          <div className="border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{stats.stats.totalTransactions}</p>
            <p className="text-xs text-text-secondary">Transactions</p>
          </div>
          <div className="border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold">{stats.stats.totalRedemptions}</p>
            <p className="text-xs text-text-secondary">Redemptions</p>
          </div>
        </div>

        {/* Partner CTA */}
        {stats.partnerEligible && (
          <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCrown} className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-400 mb-2">Become a Partner</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Congratulations! With {stats.stats.totalReferrals} referrals, you qualify for our Partner Program.
                  Partners get higher commission rates and exclusive benefits.
                </p>
                <Link
                  href="/partners/apply"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors font-medium text-sm"
                >
                  Apply for Partner Program
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Already a Partner */}
        {stats.isPartner && (
          <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCrown} className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-400">Partner Status Active</h3>
                <p className="text-sm text-text-secondary">
                  You are an official 47 Industries Partner with enhanced benefits.
                </p>
              </div>
              <Link
                href="/account/partner"
                className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors text-sm"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border bg-surface/50">
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          {transactions.length > 0 ? (
            <div className="divide-y divide-border">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.type === 'PRO_CONVERSION'
                        ? 'bg-[#0066FF]/20 text-[#0066FF]'
                        : tx.type === 'VERIFIED_SIGNUP'
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-surface text-text-secondary'
                    }`}>
                      {tx.type === 'PRO_CONVERSION' ? (
                        <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
                      ) : tx.type === 'VERIFIED_SIGNUP' ? (
                        <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4" />
                      ) : (
                        <FontAwesomeIcon icon={faGift} className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{getTransactionTypeLabel(tx.type)}</p>
                      <p className="text-xs text-text-secondary">
                        {tx.motorevEmail || tx.description || new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-bold ${tx.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-text-secondary">
              <FontAwesomeIcon icon={faGift} className="w-8 h-8 mb-3 opacity-50" />
              <p>No activity yet</p>
              <p className="text-sm mt-1">Share your link to start earning points</p>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mt-8 border border-border rounded-xl p-6">
          <h2 className="font-semibold mb-4">How Points Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center mb-2 text-accent font-bold">1</div>
              <p className="font-medium mb-1">Share Your Link</p>
              <p className="text-text-secondary">Friends sign up using your referral link</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center mb-2 text-accent font-bold">2</div>
              <p className="font-medium mb-1">Earn Points</p>
              <p className="text-text-secondary">1 point per signup, 10 points for Pro upgrades</p>
            </div>
            <div>
              <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center mb-2 text-accent font-bold">3</div>
              <p className="font-medium mb-1">Get Pro Time</p>
              <p className="text-text-secondary">10 points = 7 days Pro (auto-redeemed)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
