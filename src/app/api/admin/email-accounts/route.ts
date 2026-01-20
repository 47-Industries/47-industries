import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// GET /api/admin/email-accounts - List all email accounts
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const accounts = await prisma.emailAccount.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        isActive: true,
        scanForBills: true,
        lastSyncAt: true,
        lastSyncError: true,
        createdAt: true,
        updatedAt: true
        // Note: Tokens are NOT returned for security
      }
    })

    return NextResponse.json({ accounts })
  } catch (error: any) {
    console.error('[EMAIL_ACCOUNTS] Error listing:', error.message)
    return NextResponse.json({ error: 'Failed to fetch email accounts' }, { status: 500 })
  }
}

// POST /api/admin/email-accounts - Add a new email account (initiate OAuth)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { provider, email, accessToken, refreshToken, tokenExpiry, zohoAccountId } = body

    if (!provider || !email) {
      return NextResponse.json({ error: 'Provider and email are required' }, { status: 400 })
    }

    if (!['GMAIL', 'ZOHO'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider. Must be GMAIL or ZOHO' }, { status: 400 })
    }

    // Check if account already exists
    const existing = await prisma.emailAccount.findUnique({
      where: { email }
    })

    if (existing) {
      // Update existing account
      const updated = await prisma.emailAccount.update({
        where: { email },
        data: {
          provider,
          accessToken,
          refreshToken,
          tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
          zohoAccountId,
          isActive: true,
          scanForBills: true,
          lastSyncError: null
        }
      })

      return NextResponse.json({
        account: {
          id: updated.id,
          provider: updated.provider,
          email: updated.email,
          isActive: updated.isActive,
          scanForBills: updated.scanForBills
        },
        updated: true
      })
    }

    // Create new account
    const account = await prisma.emailAccount.create({
      data: {
        provider,
        email,
        accessToken,
        refreshToken,
        tokenExpiry: tokenExpiry ? new Date(tokenExpiry) : null,
        zohoAccountId,
        isActive: true,
        scanForBills: true
      }
    })

    return NextResponse.json({
      account: {
        id: account.id,
        provider: account.provider,
        email: account.email,
        isActive: account.isActive,
        scanForBills: account.scanForBills
      },
      created: true
    })
  } catch (error: any) {
    console.error('[EMAIL_ACCOUNTS] Error creating:', error.message)
    return NextResponse.json({ error: 'Failed to create email account' }, { status: 500 })
  }
}
