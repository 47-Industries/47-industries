/**
 * Spam protection utilities for form submissions
 *
 * Two layers of protection:
 * 1. Honeypot field - hidden field that bots fill but humans don't see
 * 2. Content validation - detect gibberish/spam patterns
 */

/**
 * Validates the honeypot field
 * Returns true if the submission is legitimate (honeypot is empty)
 * Returns false if it's likely a bot (honeypot was filled)
 */
export function validateHoneypot(honeypotValue: string | undefined | null): boolean {
  // If honeypot field has any value, it's a bot
  return !honeypotValue || honeypotValue.trim() === ''
}

/**
 * Check if a string looks like random gibberish
 * Common patterns in bot spam: random characters, too many consonants in a row
 */
function isGibberish(text: string): boolean {
  if (!text || text.length < 3) return false

  const cleaned = text.toLowerCase().replace(/[^a-z]/g, '')
  if (cleaned.length < 3) return false

  // Check for too many consecutive consonants (more than 5)
  const consonantStreak = /[bcdfghjklmnpqrstvwxyz]{6,}/i
  if (consonantStreak.test(cleaned)) return true

  // Check vowel ratio - normal text has ~35-45% vowels
  const vowels = cleaned.match(/[aeiou]/g)?.length || 0
  const vowelRatio = vowels / cleaned.length

  // If very few vowels (less than 15%) or too many (more than 70%), likely gibberish
  if (vowelRatio < 0.15 || vowelRatio > 0.70) return true

  // Check for repeating patterns like "abcabc" or "xyzxyz"
  if (cleaned.length >= 6) {
    const half = Math.floor(cleaned.length / 2)
    const firstHalf = cleaned.substring(0, half)
    const secondHalf = cleaned.substring(half, half * 2)
    if (firstHalf === secondHalf && firstHalf.length >= 3) return true
  }

  // Check for alternating case pattern (bots sometimes do AaBbCc)
  const mixedCasePattern = /([A-Z][a-z]){4,}|([a-z][A-Z]){4,}/
  if (mixedCasePattern.test(text)) return true

  return false
}

/**
 * Check if name looks like a real human name
 */
function isValidName(name: string): boolean {
  if (!name || name.trim().length < 2) return false

  const cleaned = name.trim()

  // Name too long (probably spam)
  if (cleaned.length > 100) return false

  // Check if it's gibberish
  if (isGibberish(cleaned)) return false

  // Names shouldn't have numbers
  if (/\d/.test(cleaned)) return false

  // Check for common spam patterns in names
  const spamPatterns = [
    /^[a-z]{15,}$/i, // Single very long word
    /(.)\1{3,}/, // Same character repeated 4+ times
    /[!@#$%^&*()+=\[\]{}|\\:;"'<>,?\/]/, // Special characters
  ]

  for (const pattern of spamPatterns) {
    if (pattern.test(cleaned)) return false
  }

  return true
}

/**
 * Check if email looks suspicious
 */
function isSuspiciousEmail(email: string): boolean {
  if (!email) return false

  // Check for very long local part (before @)
  const localPart = email.split('@')[0]
  if (localPart && localPart.length > 40) return true

  // Check for gibberish in local part
  if (isGibberish(localPart)) return true

  return false
}

/**
 * Check if message content looks like spam
 */
function isSpamMessage(message: string): boolean {
  if (!message) return false

  const cleaned = message.trim()

  // Very short messages with gibberish subject patterns
  if (cleaned.length < 20 && isGibberish(cleaned)) return true

  // Check for common spam patterns
  const spamPatterns = [
    /^Subject:\s*[A-Za-z]{10,}\s+[A-Za-z]{10,}$/i, // Subject: RandomWord RandomWord
    /(.)\1{5,}/, // Same character 6+ times in a row
  ]

  for (const pattern of spamPatterns) {
    if (pattern.test(cleaned)) return true
  }

  // If entire message is gibberish
  if (cleaned.length < 100 && isGibberish(cleaned)) return true

  return false
}

interface SpamCheckInput {
  name?: string
  email?: string
  message?: string
  subject?: string
}

/**
 * Main spam detection function
 * Returns true if the submission looks like spam
 */
export function isSpam(input: SpamCheckInput): boolean {
  const { name, email, message, subject } = input

  // Check name
  if (name && !isValidName(name)) {
    console.log('Spam detected: invalid name', name)
    return true
  }

  // Check email
  if (email && isSuspiciousEmail(email)) {
    console.log('Spam detected: suspicious email', email)
    return true
  }

  // Check subject (if provided)
  if (subject && isGibberish(subject)) {
    console.log('Spam detected: gibberish subject', subject)
    return true
  }

  // Check message
  if (message && isSpamMessage(message)) {
    console.log('Spam detected: spam message content')
    return true
  }

  return false
}
