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
        // First, check if the account supports transactions and trigger refresh
        try {
          const stripeAccount = await stripe.financialConnections.accounts.retrieve(account.stripeAccountId)
          console.log(`[SYNC] Account ${account.stripeAccountId} permissions:`, stripeAccount.permissions)
          console.log(`[SYNC] Account ${account.stripeAccountId} supported features:`, stripeAccount.supported_payment_method_types)

          // Check if transactions permission was granted
          if (!stripeAccount.permissions?.includes('transactions')) {
            results.errors.push(`${account.institutionName}: Transaction permission not granted. Reconnect account with transaction access.`)
            continue
          }

          // Make sure we're subscribed to transactions
          try {
            await stripe.financialConnections.accounts.subscribe(account.stripeAccountId, {
              features: ['transactions']
            })
            console.log(`[SYNC] Subscribed to transactions for ${account.stripeAccountId}`)
          } catch (subErr: any) {
            // Might already be subscribed
            console.log(`[SYNC] Subscribe note:`, subErr.message)
          }

          // Trigger a transaction refresh (Stripe fetches latest from bank)
          // This is async - transactions may not be immediately available
          await stripe.financialConnections.accounts.refresh(account.stripeAccountId, {
            features: ['transactions']
          })
          console.log(`[SYNC] Triggered transaction refresh for ${account.stripeAccountId}`)
        } catch (refreshErr: any) {
          console.log(`[SYNC] Refresh note for ${account.stripeAccountId}:`, refreshErr.message)
          // Continue anyway - transactions might already be available
        }

        // Fetch transactions from Stripe
        // Note: Stripe Financial Connections transactions API
        const transactions = await stripe.financialConnections.transactions.list({
          account: account.stripeAccountId,
          limit: 100
        })

        console.log(`[SYNC] Found ${transactions.data.length} transactions for ${account.stripeAccountId}`)

        if (transactions.data.length > 0) {
          console.log(`[SYNC] First transaction:`, JSON.stringify(transactions.data[0], null, 2))
        }

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
        console.error(`[SYNC] Error for ${account.stripeAccountId}:`, err.message, err.code || '')
        results.errors.push(`${account.institutionName}: ${err.message}`)
        await prisma.stripeFinancialAccount.update({
          where: { id: account.id },
          data: { lastSyncError: err.message }
        })
      }
    }

    // Add helpful message if no transactions found
    if (results.transactionsAdded === 0 && results.accountsSynced > 0 && results.errors.length === 0) {
      results.errors.push('Transaction refresh triggered. Transactions may take a few minutes to appear. Try syncing again shortly.')
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
