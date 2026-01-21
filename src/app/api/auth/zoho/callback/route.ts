import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { exchangeCodeForTokens, ZohoMailClient } from '@/lib/zoho'

// Base URL for redirects
const BASE_URL = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://47industries.com' : 'http://localhost:3000')

// GET /api/auth/zoho/callback - Handle OAuth callback from Zoho
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
      console.error('Zoho OAuth error:', error)
      return NextResponse.redirect(`${BASE_URL}/admin/expenses?tab=settings&error=zoho_auth_failed`)
    }

    if (!code) {
      return NextResponse.redirect(`${BASE_URL}/admin/expenses?tab=settings&error=no_code`)
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code)

    // Store tokens in database for the user
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000)
    await prisma.user.update({
      where: { id: session.user.id },
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
        const email = primaryAccount.primaryEmailAddress || primaryAccount.emailAddress?.[0]?.mailId || session.user.email

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
                displayName: primaryAccount.displayName || session.user.name || email,
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

    // After OAuth success, redirect to expenses settings
    return NextResponse.redirect(`${BASE_URL}/admin/expenses?tab=settings&success=zoho_connected`)
  } catch (error) {
    console.error('Error in Zoho OAuth callback:', error)
    return NextResponse.redirect(`${BASE_URL}/admin/expenses?tab=settings&error=zoho_auth_failed`)
  }
}
