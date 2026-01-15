import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-11-20.acacia' })
  : null

// GET /api/account/client/billing - Get billing info for authenticated client
export async function GET(req: NextRequest) {
  try {
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
            stripeCustomerId: true,
            autopayEnabled: true,
            defaultPaymentMethod: true,
          },
        },
      },
    })

    if (!user?.client) {
      return NextResponse.json({ error: 'No client account linked' }, { status: 404 })
    }

    let paymentMethodDetails = null

    // Fetch payment method details from Stripe
    if (stripe && user.client.stripeCustomerId && user.client.defaultPaymentMethod) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(
          user.client.defaultPaymentMethod
        )
        if (paymentMethod.card) {
          paymentMethodDetails = {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
          }
        }
      } catch (err) {
        console.error('Error fetching payment method:', err)
      }
    }

    return NextResponse.json({
      autopayEnabled: user.client.autopayEnabled,
      stripeCustomerId: user.client.stripeCustomerId,
      defaultPaymentMethod: user.client.defaultPaymentMethod,
      paymentMethodDetails,
    })
  } catch (error) {
    console.error('Error fetching billing info:', error)
    return NextResponse.json({ error: 'Failed to fetch billing info' }, { status: 500 })
  }
}
