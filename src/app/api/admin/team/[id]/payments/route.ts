import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/team/[id]/payments - Get team member payments
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    const payments = await prisma.teamMemberPayment.findMany({
      where: { teamMemberId: id },
      orderBy: { createdAt: 'desc' },
    })

    // Get totals
    const totalPaid = await prisma.teamMemberPayment.aggregate({
      where: { teamMemberId: id, status: 'PAID' },
      _sum: { amount: true },
    })

    const pendingTotal = await prisma.teamMemberPayment.aggregate({
      where: { teamMemberId: id, status: 'PENDING' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      payments,
      totals: {
        totalPaid: totalPaid._sum.amount || 0,
        pending: pendingTotal._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}

// POST /api/admin/team/[id]/payments - Create team member payment
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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()

    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!teamMember) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    if (!body.type || !body.amount) {
      return NextResponse.json(
        { error: 'Type and amount are required' },
        { status: 400 }
      )
    }

    // Generate payment number
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.teamMemberPayment.count()
    const paymentNumber = `TPAY-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    const payment = await prisma.teamMemberPayment.create({
      data: {
        paymentNumber,
        teamMemberId: id,
        type: body.type,
        amount: parseFloat(body.amount),
        description: body.description || null,
        periodStart: body.periodStart ? new Date(body.periodStart) : null,
        periodEnd: body.periodEnd ? new Date(body.periodEnd) : null,
        method: body.method || null,
        reference: body.reference || null,
        status: body.status || 'PENDING',
        paidAt: body.status === 'PAID' ? new Date() : null,
      },
    })

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
  }
}
