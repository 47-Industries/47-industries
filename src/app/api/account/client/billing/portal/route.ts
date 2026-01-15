import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
  : null

// POST /api/account/client/billing/portal - Create Stripe Customer Portal session
export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find user and their linked client
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            stripeCustomerId: true,
          },
        },
      },
    })

    if (!user?.client) {
      return NextResponse.json({ error: 'No client account linked' }, { status: 404 })
    }

    let stripeCustomerId = user.client.stripeCustomerId

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.client.email,
        name: user.client.name,
        metadata: {
          clientId: user.client.id,
          userId: user.id,
        },
      })

      stripeCustomerId = customer.id

      // Save to client
      await prisma.client.update({
        where: { id: user.client.id },
        data: { stripeCustomerId: customer.id },
      })
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'}/account/client/billing`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('Error creating portal session:', error)

    // Return the actual error message for debugging
    const errorMessage = error?.message || error?.raw?.message || 'Unknown error'
    return NextResponse.json({
      error: `Failed to create portal session: ${errorMessage}`
    }, { status: 500 })
  }
}
