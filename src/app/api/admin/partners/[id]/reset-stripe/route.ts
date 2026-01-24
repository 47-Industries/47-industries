import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// POST /api/admin/partners/[id]/reset-stripe - Reset a partner's Stripe Connect account
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const partner = await prisma.partner.findUnique({
      where: { id },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const results: string[] = []

    // Delete Stripe Connect account if exists
    if (partner.stripeConnectId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
        await stripe.accounts.del(partner.stripeConnectId)
        results.push(`Deleted Stripe Connect account: ${partner.stripeConnectId}`)
      } catch (err: any) {
        results.push(`Could not delete Stripe account: ${err.message}`)
      }
    }

    // Clear Stripe Connect data from database
    await prisma.partner.update({
      where: { id },
      data: {
        stripeConnectId: null,
        stripeConnectStatus: null,
        stripeConnectOnboardingUrl: null,
      },
    })
    results.push('Cleared Stripe Connect data from database')

    return NextResponse.json({
      success: true,
      partner: partner.name,
      results,
      message: 'Partner can now click "Setup Payouts" to create a fresh Stripe Connect account',
    })
  } catch (error: any) {
    console.error('Error resetting Stripe Connect:', error)
    return NextResponse.json({ error: error.message || 'Failed to reset Stripe Connect' }, { status: 500 })
  }
}
