'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Cookies from 'js-cookie'

// Cookie names matching server-side constants
const AFFILIATE_COOKIE_NAME = 'affiliate_code'
const AFFILIATE_SESSION_COOKIE_NAME = 'affiliate_session'
const AFFILIATE_COOKIE_EXPIRY_DAYS = 30

function generateSessionId(): string {
  return `aff_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

/**
 * AffiliateTracker component
 *
 * This component should be included in shop pages to track affiliate referrals.
 * It reads the `ref` parameter from the URL and stores it in a cookie for
 * attribution during checkout.
 *
 * Usage:
 * ```tsx
 * import AffiliateTracker from '@/components/affiliate/AffiliateTracker'
 *
 * export default function ShopPage() {
 *   return (
 *     <>
 *       <AffiliateTracker />
 *       {/ * rest of page * /}
 *     </>
 *   )
 * }
 * ```
 */
export default function AffiliateTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check for ref parameter in URL
    const refCode = searchParams.get('ref')

    if (refCode) {
      // Store the affiliate code in a cookie
      Cookies.set(AFFILIATE_COOKIE_NAME, refCode, {
        expires: AFFILIATE_COOKIE_EXPIRY_DAYS,
        path: '/',
        sameSite: 'lax',
      })

      // Also store a non-httpOnly version for client access
      Cookies.set('affiliate_ref', refCode, {
        expires: AFFILIATE_COOKIE_EXPIRY_DAYS,
        path: '/',
        sameSite: 'lax',
      })

      // Generate and store session ID if not present
      if (!Cookies.get(AFFILIATE_SESSION_COOKIE_NAME)) {
        const sessionId = generateSessionId()
        Cookies.set(AFFILIATE_SESSION_COOKIE_NAME, sessionId, {
          expires: AFFILIATE_COOKIE_EXPIRY_DAYS,
          path: '/',
          sameSite: 'lax',
        })
      }

      // Track the click via API (fire and forget)
      trackAffiliateClick(refCode)
    }
  }, [searchParams])

  // This component doesn't render anything
  return null
}

/**
 * Track affiliate click via API
 */
async function trackAffiliateClick(code: string) {
  try {
    // Get session ID
    const sessionId = Cookies.get(AFFILIATE_SESSION_COOKIE_NAME) || generateSessionId()

    // Track the click - using a simple GET request to record it
    // We do this client-side to avoid blocking page load
    await fetch(`/api/affiliate/click?code=${encodeURIComponent(code)}&session=${encodeURIComponent(sessionId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        sessionId,
        referrer: document.referrer || null,
        url: window.location.href,
      }),
    })
  } catch (error) {
    // Silently fail - don't block user experience
    console.debug('Affiliate click tracking failed:', error)
  }
}

/**
 * Hook to get current affiliate code from cookie
 */
export function useAffiliateCode(): string | null {
  if (typeof window === 'undefined') return null
  return Cookies.get('affiliate_ref') || Cookies.get(AFFILIATE_COOKIE_NAME) || null
}

/**
 * Get affiliate code from cookies (for use in non-hook contexts)
 */
export function getAffiliateCode(): string | null {
  if (typeof window === 'undefined') return null
  return Cookies.get('affiliate_ref') || Cookies.get(AFFILIATE_COOKIE_NAME) || null
}
