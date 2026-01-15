import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/account/client/billing/autopay - Toggle autopay for authenticated client
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { enabled } = body

    // Find user and their linked client
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        client: {
          select: {
            id: true,
            stripeCustomerId: true,
            defaultPaymentMethod: true,
          },
        },
      },
    })

    if (!user?.client) {
      return NextResponse.json({ error: 'No client account linked' }, { status: 404 })
    }

    // Require payment method to enable autopay
    if (enabled && !user.client.stripeCustomerId) {
      return NextResponse.json(
        { error: 'Please add a payment method before enabling autopay' },
        { status: 400 }
      )
    }

    // Update autopay setting
    await prisma.client.update({
      where: { id: user.client.id },
      data: { autopayEnabled: enabled },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: user.client.id,
        type: 'STATUS_CHANGE',
        description: enabled ? 'Autopay enabled by client' : 'Autopay disabled by client',
      },
    })

    return NextResponse.json({ success: true, autopayEnabled: enabled })
  } catch (error) {
    console.error('Error toggling autopay:', error)
    return NextResponse.json({ error: 'Failed to update autopay setting' }, { status: 500 })
  }
}
