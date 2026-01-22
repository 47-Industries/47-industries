import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List affiliate commissions with filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build filters
    const where: any = {}

    if (status) {
      where.status = status
    }

    if (partnerId) {
      where.partnerId = partnerId
    }

    if (type) {
      where.type = type
    }

    const [commissions, total] = await Promise.all([
      prisma.affiliateCommission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              partnerNumber: true,
            },
          },
          referral: {
            select: {
              id: true,
              platform: true,
              eventType: true,
              orderId: true,
              motorevUserId: true,
              customerEmail: true,
              orderTotal: true,
            },
          },
          payout: {
            select: {
              id: true,
              payoutNumber: true,
              status: true,
            },
          },
        },
      }),

      prisma.affiliateCommission.count({ where }),
    ])

    return NextResponse.json({
      commissions: commissions.map(c => ({
        id: c.id,
        type: c.type,
        baseAmount: Number(c.baseAmount),
        rate: c.rate ? Number(c.rate) : null,
        amount: Number(c.amount),
        status: c.status,
        notes: c.notes,
        partner: c.partner,
        referral: {
          ...c.referral,
          orderTotal: c.referral.orderTotal ? Number(c.referral.orderTotal) : null,
        },
        payout: c.payout,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching affiliate commissions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate commissions' },
      { status: 500 }
    )
  }
}

// PUT - Approve or reject commissions (bulk operation)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { commissionIds, action, notes } = body

    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json(
        { error: 'commissionIds array is required' },
        { status: 400 }
      )
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'PENDING'

    // Update commissions
    const updated = await prisma.affiliateCommission.updateMany({
      where: {
        id: { in: commissionIds },
        status: 'PENDING', // Only update pending commissions
      },
      data: {
        status: newStatus,
        ...(notes && { notes }),
      },
    })

    // If rejecting, we might want to add notes or handle differently
    if (action === 'reject' && notes) {
      // For rejection, we keep status as PENDING but add rejection notes
      await prisma.affiliateCommission.updateMany({
        where: { id: { in: commissionIds } },
        data: { notes: `REJECTED: ${notes}` },
      })
    }

    return NextResponse.json({
      success: true,
      updated: updated.count,
      action,
    })
  } catch (error) {
    console.error('Error updating affiliate commissions:', error)
    return NextResponse.json(
      { error: 'Failed to update affiliate commissions' },
      { status: 500 }
    )
  }
}
