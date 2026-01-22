// Affiliate System Utilities
// Used for generating codes, building URLs, and calculating commissions

import { customAlphabet } from 'nanoid'

// Generate unique affiliate codes using alphanumeric characters (no ambiguous characters)
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8)

/**
 * Generate a unique affiliate code
 * @param length - Optional length (default 8)
 * @returns A unique alphanumeric code like "ABC12DEF"
 */
export function generateAffiliateCode(length: number = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length))
  }
  return result
}

/**
 * Generate a short link code for affiliate links
 * @returns A short code like "XYZ123"
 */
export function generateLinkCode(): string {
  return generateCode()
}

/**
 * Build affiliate URL for different platforms
 * @param platform - SHOP or MOTOREV
 * @param code - Affiliate code
 * @param targetId - Optional product slug or category
 * @returns Full affiliate URL
 */
export function getAffiliateUrl(
  platform: 'SHOP' | 'MOTOREV',
  code: string,
  targetId?: string | null
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'

  if (platform === 'MOTOREV') {
    // MotoRev app signup with referral
    return `https://motorevapp.com/signup?ref=${code}`
  }

  // Shop URLs
  if (targetId) {
    // Specific product or category
    return `${baseUrl}/shop/${targetId}?ref=${code}`
  }

  // General shop link
  return `${baseUrl}/shop?ref=${code}`
}

/**
 * Calculate commission for shop orders
 * @param orderTotal - Order total in dollars
 * @param rate - Commission rate as percentage (e.g., 5.00 for 5%)
 * @returns Commission amount in dollars
 */
export function calculateShopCommission(orderTotal: number, rate: number): number {
  return Math.round(orderTotal * (rate / 100) * 100) / 100
}

/**
 * Check if a Pro conversion is within the eligible window
 * @param signupDate - When the user signed up
 * @param conversionDate - When they converted to Pro
 * @param windowDays - Number of days window (default 30)
 * @returns true if conversion is within the window
 */
export function isWithinProWindow(
  signupDate: Date | string,
  conversionDate: Date | string,
  windowDays: number = 30
): boolean {
  const signup = new Date(signupDate)
  const conversion = new Date(conversionDate)
  const windowEnd = new Date(signup)
  windowEnd.setDate(windowEnd.getDate() + windowDays)

  return conversion <= windowEnd
}

/**
 * Calculate days remaining in Pro conversion window
 * @param signupDate - When the user signed up
 * @param windowDays - Number of days window (default 30)
 * @returns Days remaining (negative if expired)
 */
export function getDaysRemainingInWindow(
  signupDate: Date | string,
  windowDays: number = 30
): number {
  const signup = new Date(signupDate)
  const windowEnd = new Date(signup)
  windowEnd.setDate(windowEnd.getDate() + windowDays)

  const now = new Date()
  const diffMs = windowEnd.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

// Platform labels for display
export const AFFILIATE_PLATFORM_LABELS: Record<string, string> = {
  SHOP: 'Shop',
  MOTOREV: 'MotoRev',
}

// Event type labels for display
export const AFFILIATE_EVENT_LABELS: Record<string, string> = {
  ORDER: 'Order',
  SIGNUP: 'Signup',
  PRO_CONVERSION: 'Pro Conversion',
}

// Commission type labels
export const AFFILIATE_COMMISSION_TYPE_LABELS: Record<string, string> = {
  SHOP_ORDER: 'Shop Order',
  APP_PRO_CONVERSION: 'MotoRev Pro Conversion',
}

// Commission status labels
export const AFFILIATE_COMMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  PAID: 'Paid',
}

// Target type labels
export const AFFILIATE_TARGET_TYPE_LABELS: Record<string, string> = {
  STORE: 'All Products',
  PRODUCT: 'Specific Product',
  CATEGORY: 'Category',
}

/**
 * Cookie name for storing affiliate code
 */
export const AFFILIATE_COOKIE_NAME = 'affiliate_code'

/**
 * Cookie name for storing session ID (correlates clicks to conversions)
 */
export const AFFILIATE_SESSION_COOKIE_NAME = 'affiliate_session'

/**
 * Cookie expiry in days
 */
export const AFFILIATE_COOKIE_EXPIRY_DAYS = 30

/**
 * Generate a session ID for affiliate tracking
 */
export function generateAffiliateSessionId(): string {
  return `aff_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

/**
 * Parse affiliate code from URL or cookie
 * @param url - URL to parse
 * @returns Affiliate code if found, null otherwise
 */
export function parseAffiliateCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.searchParams.get('ref')
  } catch {
    return null
  }
}

/**
 * Default commission rates
 */
export const DEFAULT_COMMISSION_RATES = {
  shopCommissionRate: 5.00,     // 5% of order total
  motorevProBonus: 2.50,        // $2.50 per Pro conversion
  motorevProWindowDays: 30,     // 30 day window
}
