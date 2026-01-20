import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'
import Stripe from 'stripe'

// POST /api/admin/financial-connections/sync - Sync transactions from connected accounts
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
    const body = await request.json().catch(() => ({}))
    const accountId = body.accountId // Optional - sync specific account

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    // Get accounts to sync
    const accounts = await prisma.stripeFinancialAccount.findMany({
      where: accountId
        ? { id: accountId, status: 'ACTIVE' }
        : { status: 'ACTIVE' }
    })

    const results = {
      accountsSynced: 0,
      transactionsAdded: 0,
      errors: [] as string[]
    }

    for (const account of accounts) {
      try {
        // Fetch transactions from Stripe
        // Note: Stripe Financial Connections transactions API
        const transactions = await stripe.financialConnections.transactions.list({
          account: account.stripeAccountId,
          limit: 100
        })

        for (const txn of transactions.data) {
          // Check if transaction already exists
          const existing = await prisma.stripeTransaction.findUnique({
            where: { stripeTransactionId: txn.id }
          })

          if (!existing) {
            await prisma.stripeTransaction.create({
              data: {
                financialAccountId: account.id,
                stripeTransactionId: txn.id,
                amount: txn.amount / 100, // Convert from cents
                description: txn.description || null,
                merchantName: null, // Would need additional parsing
                category: null,
                transactedAt: new Date(txn.transacted_at * 1000),
                postedAt: txn.posted_at ? new Date(txn.posted_at * 1000) : null,
                status: txn.status
              }
            })
            results.transactionsAdded++
          }
        }

        // Update last sync time
        await prisma.stripeFinancialAccount.update({
          where: { id: account.id },
          data: { lastSyncAt: new Date(), lastSyncError: null }
        })

        results.accountsSynced++
      } catch (err: any) {
        results.errors.push(`${account.institutionName}: ${err.message}`)
        await prisma.stripeFinancialAccount.update({
          where: { id: account.id },
          data: { lastSyncError: err.message }
        })
      }
    }

    return NextResponse.json({
      success: true,
      results
    })
  } catch (error: any) {
    console.error('[FINANCIAL_CONNECTIONS] Error syncing:', error.message)
    return NextResponse.json({ error: 'Failed to sync transactions' }, { status: 500 })
  }
}
