import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { exchangeCodeForTokens, ZohoMailClient } from '@/lib/zoho'

// Base URL for redirects
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://47industries.com' : 'http://localhost:3000')

// Parse state parameter to extract userId and source
function parseState(stateParam: string | null): { userId?: string; source?: string } {
  if (!stateParam) return {}
  try {
    const decoded = JSON.parse(Buffer.from(stateParam, 'base64').toString())
    return {
      userId: decoded.userId,
      source: decoded.source, // 'mobile' or undefined for web
    }
  } catch {
    return {}
  }
}

// GET /api/auth/zoho/callback - Handle OAuth callback from Zoho
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const stateParam = searchParams.get('state')

    // Parse state to get userId and source
    const { userId: stateUserId, source } = parseState(stateParam)
    const isMobile = source === 'mobile'

    // Try to get userId from session (web) or state (mobile)
    let userId: string | undefined

    if (isMobile) {
      // For mobile, use userId from state
      userId = stateUserId
    } else {
      // For web, use session
      const session = await getServerSession(authOptions)
      if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.redirect(`${BASE_URL}/login`)
      }
      userId = session.user.id
    }

    if (!userId) {
      const errorRedirect = isMobile
        ? `${BASE_URL}/mobile-zoho-complete?error=no_user`
        : `${BASE_URL}/admin/expenses?tab=settings&error=no_user`
      return NextResponse.redirect(errorRedirect)
    }

    if (error) {
      console.error('Zoho OAuth error:', error)
      const errorRedirect = isMobile
        ? `${BASE_URL}/mobile-zoho-complete?error=zoho_auth_failed`
        : `${BASE_URL}/admin/expenses?tab=settings&error=zoho_auth_failed`
      return NextResponse.redirect(errorRedirect)
    }

    if (!code) {
      const errorRedirect = isMobile
        ? `${BASE_URL}/mobile-zoho-complete?error=no_code`
        : `${BASE_URL}/admin/expenses?tab=settings&error=no_code`
      return NextResponse.redirect(errorRedirect)
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Get user info for email account creation
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    })

    // Store tokens in database for the user
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)
    await prisma.user.update({
      where: { id: userId },
      data: {
        zohoAccessToken: tokens.access_token,
        zohoRefreshToken: tokens.refresh_token,
        zohoTokenExpiry: tokenExpiry,
      },
    })

    // Automatically add Zoho account to bill scanning
    try {
      const zohoClient = new ZohoMailClient(tokens.access_token)
      const accounts = await zohoClient.getAccounts()

      if (accounts.length > 0) {
        const primaryAccount = accounts[0]
        const email = primaryAccount.primaryEmailAddress || primaryAccount.emailAddress?.[0]?.mailId || user?.email

        if (email) {
          // Check if already exists
          const existing = await prisma.emailAccount.findUnique({ where: { email } })

          if (existing) {
            await prisma.emailAccount.update({
              where: { email },
              data: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiry: tokenExpiry,
                zohoAccountId: primaryAccount.accountId,
                isActive: true,
                lastSyncError: null
              }
            })
          } else {
            await prisma.emailAccount.create({
              data: {
                provider: 'ZOHO',
                email,
                displayName: primaryAccount.displayName || user?.name || email,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                tokenExpiry: tokenExpiry,
                zohoAccountId: primaryAccount.accountId,
                isActive: true,
                scanForBills: true
              }
            })
          }
        }
      }
    } catch (accountError) {
      console.error('Error adding Zoho to bill scanning:', accountError)
      // Continue anyway - tokens are saved on user
    }

    // After OAuth success, redirect appropriately
    if (isMobile) {
      return NextResponse.redirect(`${BASE_URL}/mobile-zoho-complete?success=true`)
    }
    return NextResponse.redirect(`${BASE_URL}/admin/expenses?tab=settings&success=zoho_connected`)
  } catch (error) {
    console.error('Error in Zoho OAuth callback:', error)
    return NextResponse.redirect(`${BASE_URL}/admin/expenses?tab=settings&error=zoho_auth_failed`)
  }
}
