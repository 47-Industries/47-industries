import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// Bot detection helpers
function isRandomString(str: string): boolean {
  // Check for random character sequences (like "kQJeODjWNDFXVmttaz")
  // Real names don't have long sequences of mixed case without spaces
  if (!str || str.length < 2) return true

  // Check if it looks like a random string (no spaces, mixed case, too long for a name part)
  const hasNoSpaces = !str.includes(' ')
  const hasMixedCase = /[a-z]/.test(str) && /[A-Z]/.test(str)
  const hasNumbers = /\d/.test(str)
  const isTooLong = str.length > 20

  // Random strings often have high entropy - many different characters
  const uniqueChars = new Set(str.toLowerCase()).size
  const entropyRatio = uniqueChars / str.length

  // Bot names: random mixed case, numbers in name, or very high character variety
  if ((hasMixedCase && hasNoSpaces && str.length > 10) || hasNumbers || isTooLong) {
    return true
  }

  // Check for nonsensical character patterns
  const consonantCluster = /[bcdfghjklmnpqrstvwxyz]{5,}/i
  if (consonantCluster.test(str)) {
    return true
  }

  return false
}

function isSuspiciousEmail(email: string): boolean {
  // Check for bot-like email patterns
  const emailLower = email.toLowerCase()
  const localPart = emailLower.split('@')[0]

  // Only flag emails with very long number sequences (8+ digits) - likely random/bot
  if (/\d{8,}/.test(localPart)) {
    return true
  }

  // Flag emails that look like random strings: very long with mixed numbers and letters
  // but no recognizable name pattern (e.g., "x7k2m9p4q1r@domain.com")
  if (localPart.length > 25 && /\d/.test(localPart) && !/[a-z]{4,}/.test(localPart)) {
    return true
  }

  return false
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, title, website, formLoadTime } = body

    // Honeypot check - if website field is filled, it's a bot
    if (website) {
      console.log('Bot detected: honeypot filled', { email, website })
      // Return success to not tip off the bot, but don't create user
      return NextResponse.json({ success: true, user: { id: 'blocked' } })
    }

    // Time-based check - form submitted too fast (less than 3 seconds)
    if (formLoadTime) {
      const loadTime = parseInt(formLoadTime, 10)
      const submitTime = Date.now()
      if (submitTime - loadTime < 3000) {
        console.log('Bot detected: form submitted too fast', { email, timeDiff: submitTime - loadTime })
        return NextResponse.json({ success: true, user: { id: 'blocked' } })
      }
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    // Bot name detection
    if (isRandomString(name)) {
      console.log('Bot detected: random name', { name, email })
      return NextResponse.json(
        { error: 'Please enter a valid name' },
        { status: 400 }
      )
    }

    // Suspicious email detection
    if (isSuspiciousEmail(email)) {
      console.log('Bot detected: suspicious email', { email })
      return NextResponse.json(
        { error: 'Please use a valid email address' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        title: title || null,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        title: true,
        role: true,
      },
    })

    return NextResponse.json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
