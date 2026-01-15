import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/partners/commissions - List all commissions
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

    const commissions = await prisma.partnerCommission.findMany({
      where,
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true },
        },
        lead: {
          select: { id: true, businessName: true, leadNumber: true },
        },
        payout: {
          select: { id: true, payoutNumber: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get totals
    const totals = await prisma.partnerCommission.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    })

    const pendingTotal = await prisma.partnerCommission.aggregate({
      where: { ...where, status: 'PENDING' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      commissions,
      totals: {
        total: totals._sum.amount || 0,
        count: totals._count,
        pending: pendingTotal._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching commissions:', error)
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 })
  }
}

// POST /api/admin/partners/commissions - Create manual commission
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    if (!body.partnerId || !body.leadId || !body.amount) {
      return NextResponse.json(
        { error: 'Partner ID, lead ID, and amount are required' },
        { status: 400 }
      )
    }

    const commission = await prisma.partnerCommission.create({
      data: {
        partnerId: body.partnerId,
        leadId: body.leadId,
        type: body.type || 'FIRST_SALE',
        invoiceId: body.invoiceId || null,
        baseAmount: parseFloat(body.baseAmount) || parseFloat(body.amount),
        rate: parseFloat(body.rate) || 0,
        amount: parseFloat(body.amount),
        status: body.status || 'PENDING',
        notes: body.notes || null,
      },
      include: {
        partner: {
          select: { id: true, name: true, partnerNumber: true },
        },
        lead: {
          select: { id: true, businessName: true, leadNumber: true },
        },
      },
    })

    return NextResponse.json({ success: true, commission })
  } catch (error) {
    console.error('Error creating commission:', error)
    return NextResponse.json({ error: 'Failed to create commission' }, { status: 500 })
  }
}
