import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { verifyCode } from '@/lib/twilio'
import Stripe from 'stripe'

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null
function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
    })
  }
  return _stripe
}

// POST /api/admin/partners/payouts/[id]/execute - Execute payout via Stripe (requires SMS verification)
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
      select: { role: true, phone: true, name: true },
    })

    // Only SUPER_ADMIN can execute payouts
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Only super admins can execute payouts' }, { status: 403 })
    }

    if (!currentUser.phone) {
      return NextResponse.json({ error: 'No phone number on file. Please add your phone number in settings.' }, { status: 400 })
    }

    const body = await req.json()
    const { verificationCode } = body

    if (!verificationCode) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
    }

    // Verify SMS code
    const verifyResult = await verifyCode(currentUser.phone, verificationCode)
    if (!verifyResult.success) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Get the payout
    const payout = await prisma.partnerPayout.findUnique({
      where: { id },
      include: {
        partner: true,
        commissions: true,
      },
    })

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    if (payout.status === 'PAID') {
      return NextResponse.json({ error: 'Payout has already been processed' }, { status: 400 })
    }

    // Check if partner has Stripe Connect
    if (!payout.partner.stripeConnectId) {
      return NextResponse.json({ error: 'Partner has not connected their Stripe account' }, { status: 400 })
    }

    // Verify partner's Stripe account is ready for payouts
    const stripeAccount = await getStripe().accounts.retrieve(payout.partner.stripeConnectId)
    if (!stripeAccount.payouts_enabled) {
      return NextResponse.json({ error: 'Partner\'s Stripe account is not ready for payouts. They need to complete onboarding.' }, { status: 400 })
    }

    // Calculate amount in cents
    const amountInCents = Math.round(Number(payout.amount) * 100)

    // Create the transfer
    const transfer = await getStripe().transfers.create({
      amount: amountInCents,
      currency: 'usd',
      destination: payout.partner.stripeConnectId,
      description: `Payout ${payout.payoutNumber} - ${payout.partner.name}`,
      metadata: {
        payoutId: payout.id,
        payoutNumber: payout.payoutNumber,
        partnerId: payout.partner.id,
        partnerNumber: payout.partner.partnerNumber,
        executedBy: currentUser.name || session.user.id,
      },
    })

    // Update payout record
    await prisma.partnerPayout.update({
      where: { id },
      data: {
        status: 'PAID',
        method: 'STRIPE_CONNECT',
        stripeTransferId: transfer.id,
        paidAt: new Date(),
        notes: `Executed via Stripe Transfer ${transfer.id}`,
      },
    })

    // Update all linked commissions to PAID
    await prisma.partnerCommission.updateMany({
      where: { payoutId: id },
      data: { status: 'PAID' },
    })

    return NextResponse.json({
      success: true,
      message: 'Payout executed successfully',
      transferId: transfer.id,
      amount: Number(payout.amount),
    })
  } catch (error: any) {
    console.error('Payout execution error:', error)

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: error.message || 'Failed to execute payout' }, { status: 500 })
  }
}
