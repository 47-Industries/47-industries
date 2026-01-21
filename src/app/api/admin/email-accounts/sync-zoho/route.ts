import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'
import { ZohoMailClient } from '@/lib/zoho'

// POST /api/admin/email-accounts/sync-zoho - Add connected Zoho account to bill scanning
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    // Get the user's Zoho tokens
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        zohoAccessToken: true,
        zohoRefreshToken: true,
        zohoTokenExpiry: true,
        email: true,
        name: true
      }
    })

    if (!user?.zohoAccessToken) {
      return NextResponse.json({
        error: 'Zoho not connected. Go to Admin > Email to connect your Zoho account first.'
      }, { status: 400 })
    }

    // Use Zoho API to get account info
    const zohoClient = new ZohoMailClient(user.zohoAccessToken)
    const accounts = await zohoClient.getAccounts()

    if (accounts.length === 0) {
      return NextResponse.json({ error: 'No Zoho Mail accounts found' }, { status: 400 })
    }

    // Get the primary account
    const primaryAccount = accounts[0]
    const email = primaryAccount.primaryEmailAddress || primaryAccount.emailAddress?.[0]?.mailId || user.email

    if (!email) {
      return NextResponse.json({ error: 'Could not determine email address' }, { status: 400 })
    }

    // Check if already exists
    const existing = await prisma.emailAccount.findUnique({
      where: { email }
    })

    if (existing) {
      // Update existing
      const updated = await prisma.emailAccount.update({
        where: { email },
        data: {
          accessToken: user.zohoAccessToken,
          refreshToken: user.zohoRefreshToken,
          tokenExpiry: user.zohoTokenExpiry,
          zohoAccountId: primaryAccount.accountId,
          isActive: true,
          lastSyncError: null
        }
      })

      return NextResponse.json({
        success: true,
        account: {
          id: updated.id,
          email: updated.email,
          provider: updated.provider
        },
        message: 'Zoho account updated for bill scanning'
      })
    }

    // Create new email account entry
    const emailAccount = await prisma.emailAccount.create({
      data: {
        provider: 'ZOHO',
        email,
        displayName: primaryAccount.displayName || user.name || email,
        accessToken: user.zohoAccessToken,
        refreshToken: user.zohoRefreshToken,
        tokenExpiry: user.zohoTokenExpiry,
        zohoAccountId: primaryAccount.accountId,
        isActive: true,
        scanForBills: true
      }
    })

    return NextResponse.json({
      success: true,
      account: {
        id: emailAccount.id,
        email: emailAccount.email,
        provider: emailAccount.provider
      },
      message: 'Zoho account added for bill scanning'
    })
  } catch (error: any) {
    console.error('[EMAIL_ACCOUNTS] Error syncing Zoho:', error.message)

    // Handle token expiry or invalid token
    const errorMsg = error.message || ''
    if (errorMsg.includes('invalid_token') ||
        errorMsg.includes('expired') ||
        errorMsg.includes('INVALID_OAUTHTOKEN') ||
        errorMsg.includes('Invalid Access') ||
        errorMsg.includes('401')) {
      return NextResponse.json({
        error: 'Zoho token expired or invalid. Redirecting to reconnect...'
      }, { status: 401 })
    }

    return NextResponse.json({ error: error.message || 'Failed to sync Zoho account' }, { status: 500 })
  }
}
