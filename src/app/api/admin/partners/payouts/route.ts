import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// GET /api/admin/partners/payouts - List all payouts
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (partnerId) {
      where.partnerId = partnerId
    }

    const payouts = await prisma.partnerPayout.findMany({
      where,
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true, email: true },
        },
        commissions: {
          select: { id: true, amount: true, type: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get totals
    const totals = await prisma.partnerPayout.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    })

    const pendingTotal = await prisma.partnerPayout.aggregate({
      where: { ...where, status: 'PENDING' },
      _sum: { amount: true },
    })

    const paidTotal = await prisma.partnerPayout.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      payouts,
      stats: {
        total: totals._count,
        totalAmount: totals._sum.amount || 0,
        pendingAmount: pendingTotal._sum.amount || 0,
        paidAmount: paidTotal._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}

// POST /api/admin/partners/payouts - Create payout from pending commissions
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await getAdminAuthInfo(req)
    const body = await req.json()

    if (!body.partnerId) {
      return NextResponse.json(
        { error: 'Partner ID is required' },
        { status: 400 }
      )
    }

    // Get pending commissions for this partner
    let commissionIds = body.commissionIds

    if (!commissionIds || commissionIds.length === 0) {
      // If no specific commissions provided, get all pending/approved
      const pendingCommissions = await prisma.partnerCommission.findMany({
        where: {
          partnerId: body.partnerId,
          status: { in: ['PENDING', 'APPROVED'] },
          payoutId: null,
        },
      })
      commissionIds = pendingCommissions.map(c => c.id)
    }

    if (commissionIds.length === 0) {
      return NextResponse.json(
        { error: 'No pending commissions to pay out' },
        { status: 400 }
      )
    }

    // Calculate total
    const commissions = await prisma.partnerCommission.findMany({
      where: { id: { in: commissionIds } },
    })
    const totalAmount = commissions.reduce((sum, c) => sum + Number(c.amount), 0)

    // Generate payout number
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.partnerPayout.count()
    const payoutNumber = `PAY-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    // Create payout (optionally mark as paid immediately for manual payouts)
    const payout = await prisma.partnerPayout.create({
      data: {
        payoutNumber,
        partnerId: body.partnerId,
        amount: totalAmount,
        method: body.method || null,
        reference: body.reference || null,
        status: body.markAsPaid ? 'PAID' : 'PENDING',
        paidAt: body.markAsPaid ? new Date() : null,
        notes: body.notes || null,
      },
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true, email: true },
        },
      },
    })

    // Link commissions to payout and update status if marked as paid
    await prisma.partnerCommission.updateMany({
      where: { id: { in: commissionIds } },
      data: {
        payoutId: payout.id,
        status: body.markAsPaid ? 'PAID' : undefined,
      },
    })

    // Fetch updated payout with commissions
    const updatedPayout = await prisma.partnerPayout.findUnique({
      where: { id: payout.id },
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true, email: true },
        },
        commissions: true,
      },
    })

    return NextResponse.json({ success: true, payout: updatedPayout })
  } catch (error) {
    console.error('Error creating payout:', error)
    return NextResponse.json({ error: 'Failed to create payout' }, { status: 500 })
  }
}
