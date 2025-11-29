import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, formatAmountForStripe, isStripeConfigured } from '@/lib/stripe'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/orders/[id]/refund - Process a refund
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    if (!isStripeConfigured) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { amount, reason } = body

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!order.stripePaymentId) {
      return NextResponse.json(
        { error: 'No payment ID found for this order' },
        { status: 400 }
      )
    }

    if (order.paymentStatus === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Order has already been refunded' },
        { status: 400 }
      )
    }

    if (order.paymentStatus !== 'SUCCEEDED') {
      return NextResponse.json(
        { error: 'Can only refund orders with successful payments' },
        { status: 400 }
      )
    }

    // Calculate refund amount
    const refundAmount = amount ? parseFloat(amount) : Number(order.total)
    const isFullRefund = refundAmount >= Number(order.total)

    if (refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Refund amount must be greater than 0' },
        { status: 400 }
      )
    }

    if (refundAmount > Number(order.total)) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed order total' },
        { status: 400 }
      )
    }

    // Process refund via Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentId,
      amount: formatAmountForStripe(refundAmount),
      reason: reason === 'duplicate' ? 'duplicate' :
              reason === 'fraudulent' ? 'fraudulent' :
              'requested_by_customer',
    })

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status: isFullRefund ? 'REFUNDED' : order.status,
        paymentStatus: isFullRefund ? 'REFUNDED' : 'SUCCEEDED',
        adminNotes: order.adminNotes
          ? `${order.adminNotes}\n\n[${new Date().toISOString()}] Refund processed: $${refundAmount.toFixed(2)} (${reason || 'customer request'})`
          : `[${new Date().toISOString()}] Refund processed: $${refundAmount.toFixed(2)} (${reason || 'customer request'})`,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        shippingAddress: true,
      },
    })

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: refundAmount,
      order: updatedOrder,
    })
  } catch (error: any) {
    console.error('Refund error:', error)

    // Handle Stripe-specific errors
    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}
