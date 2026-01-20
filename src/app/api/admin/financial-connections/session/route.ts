import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkExpensePermission } from '@/lib/expense-permissions'
import Stripe from 'stripe'

// POST /api/admin/financial-connections/session - Create a Stripe Financial Connections session
export async function POST() {
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
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Create a Financial Connections session
    const fcSession = await stripe.financialConnections.sessions.create({
      account_holder: {
        type: 'account',
        account: undefined // Uses the platform account
      },
      permissions: ['transactions', 'balances'],
      filters: {
        countries: ['US']
      }
    })

    return NextResponse.json({
      clientSecret: fcSession.client_secret,
      sessionId: fcSession.id
    })
  } catch (error: any) {
    console.error('[FINANCIAL_CONNECTIONS] Error creating session:', error.message)
    return NextResponse.json({ error: 'Failed to create Financial Connections session' }, { status: 500 })
  }
}
