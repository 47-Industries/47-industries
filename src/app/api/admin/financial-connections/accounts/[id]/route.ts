import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'
import Stripe from 'stripe'

// GET /api/admin/financial-connections/accounts/[id] - Get single account
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { id } = await params

    const account = await prisma.stripeFinancialAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true }
        }
      }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ account })
  } catch (error: any) {
    console.error('[FINANCIAL_CONNECTIONS] Error fetching account:', error.message)
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 })
  }
}

// DELETE /api/admin/financial-connections/accounts/[id] - Disconnect account
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { id } = await params

    const account = await prisma.stripeFinancialAccount.findUnique({
      where: { id }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Optionally disconnect from Stripe
    if (process.env.STRIPE_SECRET_KEY && account.stripeAccountId) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        await stripe.financialConnections.accounts.disconnect(account.stripeAccountId)
      } catch (stripeError: any) {
        console.warn('[FINANCIAL_CONNECTIONS] Could not disconnect from Stripe:', stripeError.message)
        // Continue anyway - we'll mark as disconnected locally
      }
    }

    // Update status to disconnected (don't delete - keep history)
    await prisma.stripeFinancialAccount.update({
      where: { id },
      data: { status: 'DISCONNECTED' }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[FINANCIAL_CONNECTIONS] Error disconnecting account:', error.message)
    return NextResponse.json({ error: 'Failed to disconnect account' }, { status: 500 })
  }
}
