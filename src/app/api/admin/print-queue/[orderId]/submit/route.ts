import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const BOOKFADE_API_URL = process.env.BOOKFADE_API_URL || 'https://bookfade.app'
const BOOKFADE_API_KEY = process.env.BOOKFADE_API_KEY

// POST /api/admin/print-queue/[orderId]/submit - Submit order to printer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await params

    if (!BOOKFADE_API_KEY) {
      return NextResponse.json(
        { error: 'BookFade API key not configured' },
        { status: 503 }
      )
    }

    // TODO: Here you would integrate with 4over API to actually submit the order
    // For now, we just update the status in BookFade

    // Generate a mock printer order ID (replace with actual 4over order ID)
    const printerOrderId = `4OVER-${Date.now()}`

    // Update the order status in BookFade
    const res = await fetch(`${BOOKFADE_API_URL}/api/external/print-orders`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BOOKFADE_API_KEY,
      },
      body: JSON.stringify({
        orderId,
        status: 'SUBMITTED',
        printerOrderId,
        printerId: '4over',
      }),
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error || 'Failed to update order' },
        { status: res.status }
      )
    }

    const data = await res.json()

    return NextResponse.json({
      success: true,
      order: data.order,
      printerOrderId,
      message: 'Order submitted to printer',
    })
  } catch (error) {
    console.error('Error submitting order:', error)
    return NextResponse.json(
      { error: 'Failed to submit order' },
      { status: 500 }
    )
  }
}
