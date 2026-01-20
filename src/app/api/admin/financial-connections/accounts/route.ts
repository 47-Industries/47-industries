import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'
import Stripe from 'stripe'

// GET /api/admin/financial-connections/accounts - List connected accounts
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
    const accounts = await prisma.stripeFinancialAccount.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    })

    return NextResponse.json({ accounts })
  } catch (error: any) {
    console.error('[FINANCIAL_CONNECTIONS] Error listing accounts:', error.message)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

// POST /api/admin/financial-connections/accounts - Save a newly linked account
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { sessionId, accountId } = body

    if (!sessionId && !accountId) {
      return NextResponse.json({ error: 'Session ID or Account ID required' }, { status: 400 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    let stripeAccount: Stripe.FinancialConnections.Account

    if (accountId) {
      // Fetch account directly
      stripeAccount = await stripe.financialConnections.accounts.retrieve(accountId)
    } else {
      // Fetch accounts from session
      const fcSession = await stripe.financialConnections.sessions.retrieve(sessionId, {
        expand: ['accounts']
      })

      if (!fcSession.accounts || fcSession.accounts.data.length === 0) {
        return NextResponse.json({ error: 'No accounts linked in session' }, { status: 400 })
      }

      stripeAccount = fcSession.accounts.data[0]
    }

    // Check if we already have this account
    const existing = await prisma.stripeFinancialAccount.findUnique({
      where: { stripeAccountId: stripeAccount.id }
    })

    if (existing) {
      // Update existing
      const updated = await prisma.stripeFinancialAccount.update({
        where: { stripeAccountId: stripeAccount.id },
        data: {
          status: 'ACTIVE',
          institutionName: stripeAccount.institution_name || 'Unknown',
          accountName: stripeAccount.display_name || null,
          accountType: stripeAccount.subcategory || 'unknown',
          accountLast4: stripeAccount.last4 || null
        }
      })

      return NextResponse.json({ account: updated, updated: true })
    }

    // Subscribe to the account for ongoing transaction access
    try {
      await stripe.financialConnections.accounts.subscribe(stripeAccount.id, {
        features: ['transactions']
      })
      console.log(`[FC] Subscribed to transactions for ${stripeAccount.id}`)
    } catch (subErr: any) {
      console.log(`[FC] Subscribe note for ${stripeAccount.id}:`, subErr.message)
      // Continue - might already be subscribed or not supported
    }

    // Create new account record
    const account = await prisma.stripeFinancialAccount.create({
      data: {
        stripeAccountId: stripeAccount.id,
        stripeSessionId: sessionId || null,
        institutionName: stripeAccount.institution_name || 'Unknown',
        accountName: stripeAccount.display_name || null,
        accountType: stripeAccount.subcategory || 'unknown',
        accountLast4: stripeAccount.last4 || null,
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({ account, created: true })
  } catch (error: any) {
    console.error('[FINANCIAL_CONNECTIONS] Error saving account:', error.message)
    return NextResponse.json({ error: 'Failed to save account' }, { status: 500 })
  }
}
