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
    // Note: Financial Connections must be enabled in Stripe Dashboard > Settings > Financial Connections
    const fcSession = await stripe.financialConnections.sessions.create({
      account_holder: {
        type: 'customer',
        customer: await getOrCreateStripeCustomer(stripe, session.user.email || '')
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
    console.error('[FINANCIAL_CONNECTIONS] Error creating session:', error.message, error)

    // Provide helpful error messages
    if (error.message?.includes('Financial Connections')) {
      return NextResponse.json({
        error: 'Stripe Financial Connections is not enabled. Enable it in Stripe Dashboard > Settings > Financial Connections'
      }, { status: 500 })
    }

    return NextResponse.json({ error: error.message || 'Failed to create Financial Connections session' }, { status: 500 })
  }
}

// Helper to get or create a Stripe customer for the business
async function getOrCreateStripeCustomer(stripe: Stripe, email: string): Promise<string> {
  // Search for existing customer
  const customers = await stripe.customers.list({
    email: email,
    limit: 1
  })

  if (customers.data.length > 0) {
    return customers.data[0].id
  }

  // Create new customer for financial connections
  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      type: 'financial_connections_business'
    }
  })

  return customer.id
}
