// User Affiliate System Utilities
// Used for MotoRev account linking, code generation, and commission calculations

import { customAlphabet } from 'nanoid'
import jwt from 'jsonwebtoken'

// Generate unique affiliate codes in MR-XXXXXX format (alphanumeric, no ambiguous characters)
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

/**
 * Generate a unique user affiliate code in MR-XXXXXX format
 * @returns A code like "MR-ABC123"
 */
export function generateUserAffiliateCode(): string {
  return `MR-${generateCode()}`
}

/**
 * Validate that a string matches the MR-XXXXXX format
 * @param code - The code to validate
 * @returns true if valid format
 */
export function isValidUserAffiliateCode(code: string): boolean {
  return /^MR-[A-Z0-9]{6}$/.test(code.toUpperCase())
}

/**
 * Normalize a user affiliate code to uppercase
 * @param code - The code to normalize
 * @returns Uppercase code
 */
export function normalizeUserAffiliateCode(code: string): string {
  return code.toUpperCase().trim()
}

// ============================================
// COMMISSION CALCULATIONS
// ============================================

/**
 * Default commission rates for user affiliates (MotoRev only)
 */
export const USER_AFFILIATE_RATES = {
  motorevProBonus: 1.00,        // $1.00 per Pro conversion
  retentionBonus: 0.25,         // $0.25 per month of retention
}

/**
 * Partner commission rates (higher than user affiliates)
 */
export const PARTNER_AFFILIATE_RATES = {
  motorevProBonus: 2.50,        // $2.50 per Pro conversion
  retentionBonus: 0.50,         // $0.50 per month of retention
}

/**
 * Pro conversion tracking
 */
export const MOTOREV_PRO_WINDOW_DAYS = 30 // Pro conversion must happen within 30 days of signup

/**
 * MotoRev Pro pricing constants
 */
export const MOTOREV_PRO_PRICING = {
  monthlyPrice: 4.99,           // $4.99/month
  yearlyPrice: 49.99,           // $49.99/year
  dailyRate: 4.99 / 30,         // ~$0.166/day based on monthly
}

/**
 * Convert cash amount to Pro subscription days
 * Based on monthly price of $4.99 = ~$0.166/day
 * @param amount - Cash amount in dollars
 * @returns Number of Pro days (rounded)
 */
export function cashToProDays(amount: number): number {
  const days = amount / MOTOREV_PRO_PRICING.dailyRate
  return Math.round(days)
}

/**
 * Convert Pro days to cash equivalent
 * @param days - Number of Pro days
 * @returns Cash equivalent in dollars
 */
export function proDaysToCash(days: number): number {
  return Math.round(days * MOTOREV_PRO_PRICING.dailyRate * 100) / 100
}

/**
 * Calculate Pro conversion commission based on reward preference
 * @param bonus - Flat bonus amount (e.g., $1.00)
 * @param rewardPreference - "CASH" or "PRO_TIME"
 * @returns Object with amount and proTimeDays
 */
export function calculateProConversionReward(
  bonus: number,
  rewardPreference: 'CASH' | 'PRO_TIME'
): { amount: number; proTimeDays: number | null } {
  if (rewardPreference === 'PRO_TIME') {
    return {
      amount: bonus,
      proTimeDays: cashToProDays(bonus),
    }
  }
  return {
    amount: bonus,
    proTimeDays: null,
  }
}

// ============================================
// ACCOUNT LINKING
// ============================================

interface ConnectionTokenPayload {
  userId: string
  email: string
  name?: string
  exp: number
}

/**
 * Generate a JWT token for MotoRev account connection
 * Token is valid for 10 minutes
 * @param userId - 47 Industries user ID
 * @param email - User's email
 * @param name - User's name (optional)
 * @returns JWT token string
 */
export function generateConnectionToken(
  userId: string,
  email: string,
  name?: string
): string {
  const secret = process.env.MOTOREV_AFFILIATE_API_KEY
  if (!secret) {
    throw new Error('MOTOREV_AFFILIATE_API_KEY is not configured')
  }

  const payload: Omit<ConnectionTokenPayload, 'exp'> = {
    userId,
    email,
    name,
  }

  return jwt.sign(payload, secret, { expiresIn: '30m' })
}

/**
 * Validate and decode a connection token
 * @param token - JWT token to validate
 * @returns Decoded payload or null if invalid
 */
export function validateConnectionToken(token: string): ConnectionTokenPayload | null {
  const secret = process.env.MOTOREV_AFFILIATE_API_KEY
  if (!secret) {
    throw new Error('MOTOREV_AFFILIATE_API_KEY is not configured')
  }

  try {
    return jwt.verify(token, secret) as ConnectionTokenPayload
  } catch {
    return null
  }
}

// ============================================
// URL GENERATION
// ============================================

/**
 * Build referral landing page URL
 * @param code - User affiliate code (MR-XXXXXX)
 * @returns Full URL to referral landing page
 */
export function getReferralLandingUrl(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'
  return `${baseUrl}/r/${code}`
}

/**
 * Build MotoRev deep link for referral
 * @param code - User affiliate code
 * @returns Deep link URL
 */
export function getMotoRevReferralDeepLink(code: string): string {
  return `motorev://referral?code=${code}`
}

// ============================================
// RETENTION TRACKING
// ============================================

/**
 * Check if a retention bonus is applicable
 * Retention bonuses are paid monthly for up to 12 months
 * @param signupDate - When the referred user signed up
 * @param currentMonth - Which month to check (1-12)
 * @returns true if within retention bonus period
 */
export function isRetentionBonusEligible(
  signupDate: Date | string,
  currentMonth: number
): boolean {
  if (currentMonth < 1 || currentMonth > 12) {
    return false
  }

  const signup = new Date(signupDate)
  const now = new Date()
  const monthsSinceSignup = Math.floor(
    (now.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )

  return monthsSinceSignup >= currentMonth
}

/**
 * Calculate the retention month number for a given date
 * @param signupDate - When the referred user signed up
 * @param checkDate - Date to check (defaults to now)
 * @returns Month number (1, 2, 3...) or 0 if not applicable
 */
export function getRetentionMonth(
  signupDate: Date | string,
  checkDate?: Date | string
): number {
  const signup = new Date(signupDate)
  const check = checkDate ? new Date(checkDate) : new Date()

  const monthsDiff = Math.floor(
    (check.getTime() - signup.getTime()) / (1000 * 60 * 60 * 24 * 30)
  )

  if (monthsDiff < 1) return 0
  if (monthsDiff > 12) return 0 // Cap at 12 months

  return monthsDiff
}

// ============================================
// DISPLAY HELPERS
// ============================================

/**
 * Format commission type for display
 */
export const COMMISSION_TYPE_LABELS: Record<string, string> = {
  PRO_CONVERSION: 'Pro Conversion',
  RETENTION_BONUS: 'Retention Bonus',
}

/**
 * Format reward type for display
 */
export const REWARD_TYPE_LABELS: Record<string, string> = {
  CASH: 'Cash Payout',
  PRO_TIME: 'Pro Subscription Time',
}

/**
 * Format commission status for display
 */
export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  PAID: 'Paid',
  APPLIED: 'Applied',
}

/**
 * Format platform for display
 */
export const PLATFORM_LABELS: Record<string, string> = {
  MOTOREV: 'MotoRev',
}

/**
 * Format Pro time duration for display
 * @param days - Number of days
 * @returns Formatted string like "1mo 15d" or "45 days"
 */
export function formatProTimeDuration(days: number): string {
  if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''}`
  }

  const months = Math.floor(days / 30)
  const remainingDays = days % 30

  if (remainingDays === 0) {
    return `${months}mo`
  }

  return `${months}mo ${remainingDays}d`
}

/**
 * Format currency amount
 * @param amount - Amount in dollars
 * @returns Formatted string like "$12.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
