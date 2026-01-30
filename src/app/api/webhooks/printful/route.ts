import { NextRequest, NextResponse } from 'next/server'
import { verifyPrintfulWebhook, processPrintfulWebhook } from '@/lib/printful'
import { sendShippingNotification } from '@/lib/email'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-printful-signature') || ''

    // Verify webhook signature if secret is configured
    if (process.env.PRINTFUL_WEBHOOK_SECRET) {
      if (!verifyPrintfulWebhook(body, signature)) {
        console.error('Invalid Printful webhook signature')
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        )
      }
    }

    const event = JSON.parse(body)
    console.log('Printful webhook received:', event.type)

    // Process the webhook event
    await processPrintfulWebhook(event)

    // Send shipping notification email for shipped packages
    if (event.type === 'package_shipped') {
      await handleShippingEmail(event.data)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Printful webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Send shipping notification email
async function handleShippingEmail(data: {
  order: { id: number; external_id: string }
  shipment: {
    carrier: string
    tracking_number: string
    tracking_url: string
  }
}) {
  try {
    // Find the order by order number (external_id in Printful)
    const order = await prisma.order.findUnique({
      where: { orderNumber: data.order.external_id },
      include: {
        items: {
          where: {
            product: {
              fulfillmentType: 'PRINTFUL',
            },
          },
          select: {
            name: true,
            quantity: true,
            image: true,
          },
        },
      },
    })

    if (!order) {
      console.error(`Order not found for Printful order: ${data.order.external_id}`)
      return
    }

    // Send shipping notification
    await sendShippingNotification({
      to: order.customerEmail,
      name: order.customerName,
      orderNumber: order.orderNumber,
      carrier: data.shipment.carrier,
      trackingNumber: data.shipment.tracking_number,
      trackingUrl: data.shipment.tracking_url,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        image: item.image,
      })),
    })

    console.log(`Shipping notification sent for order ${order.orderNumber}`)
  } catch (emailError) {
    console.error('Failed to send shipping notification:', emailError)
    // Don't throw - we don't want to fail the webhook for email errors
  }
}
