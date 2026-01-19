import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
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

// POST /api/admin/partners/[id]/stripe-connect - Create Stripe Connect account and onboarding link
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

    let stripeAccountId = partner.stripeConnectId

    // Create Stripe Connect Express account if doesn't exist
    if (!stripeAccountId) {
      const account = await getStripe().accounts.create({
        type: 'express',
        country: 'US',
        email: partner.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          partnerId: partner.id,
          partnerNumber: partner.partnerNumber,
        },
      })

      stripeAccountId = account.id

      // Save the account ID
      await prisma.partner.update({
        where: { id },
        data: {
          stripeConnectId: stripeAccountId,
          stripeConnectStatus: 'PENDING',
        },
      })
    }

    // Create account onboarding link
    const accountLink = await getStripe().accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/partners/${id}?stripe_refresh=true`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/partners/${id}?stripe_success=true`,
      type: 'account_onboarding',
    })

    // Save the onboarding URL
    await prisma.partner.update({
      where: { id },
      data: {
        stripeConnectOnboardingUrl: accountLink.url,
      },
    })

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId: stripeAccountId,
    })
  } catch (error: any) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create Stripe Connect account' }, { status: 500 })
  }
}

// GET /api/admin/partners/[id]/stripe-connect - Check Stripe Connect status
export async function GET(
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

    if (!partner.stripeConnectId) {
      return NextResponse.json({
        connected: false,
        status: null,
      })
    }

    // Get account details from Stripe
    const account = await getStripe().accounts.retrieve(partner.stripeConnectId)

    const isFullyOnboarded = account.details_submitted && account.payouts_enabled

    // Update status in database if changed
    const newStatus = isFullyOnboarded ? 'CONNECTED' : 'PENDING'
    if (partner.stripeConnectStatus !== newStatus) {
      await prisma.partner.update({
        where: { id },
        data: {
          stripeConnectStatus: newStatus,
        },
      })
    }

    return NextResponse.json({
      connected: isFullyOnboarded,
      status: newStatus,
      accountId: partner.stripeConnectId,
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
    })
  } catch (error: any) {
    console.error('Stripe Connect status error:', error)
    return NextResponse.json({ error: error.message || 'Failed to check Stripe Connect status' }, { status: 500 })
  }
}
