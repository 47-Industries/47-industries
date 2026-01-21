import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'

// Base URL for redirects
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://47industries.com' : 'http://localhost:3000')

// GET /api/auth/gmail/callback - Handle OAuth callback from Google
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.redirect(`${BASE_URL}/login`)
    }

    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('Gmail OAuth error:', error)
      return NextResponse.redirect(`${BASE_URL}/admin/expenses?error=gmail_auth_failed`)
    }

    if (!code) {
      return NextResponse.redirect(`${BASE_URL}/admin/expenses?error=no_code`)
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'https://admin.47industries.com/api/auth/gmail/callback'
    )

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user's email address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    const email = userInfo.data.email

    if (!email) {
      return NextResponse.redirect(`${BASE_URL}/admin/expenses?error=no_email`)
    }

    // Check if account already exists
    const existing = await prisma.emailAccount.findUnique({
      where: { email }
    })

    if (existing) {
      // Update existing account
      await prisma.emailAccount.update({
        where: { email },
        data: {
          provider: 'GMAIL',
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || existing.refreshToken, // Keep existing refresh token if not provided
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
          scanForBills: true,
          lastSyncError: null
        }
      })
    } else {
      // Create new email account
      await prisma.emailAccount.create({
        data: {
          provider: 'GMAIL',
          email,
          displayName: userInfo.data.name || email,
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
          scanForBills: true
        }
      })
    }

    return NextResponse.redirect(`${BASE_URL}/admin/expenses?success=gmail_connected&tab=settings`)
  } catch (error: any) {
    console.error('Error in Gmail OAuth callback:', error)
    return NextResponse.redirect(`${BASE_URL}/admin/expenses?error=gmail_auth_failed`)
  }
}
