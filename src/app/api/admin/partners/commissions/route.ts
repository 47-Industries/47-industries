import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/partners/commissions - List all commissions (unified view)
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const partnerId = searchParams.get('partnerId')
    const source = searchParams.get('source') // 'service', 'affiliate', or 'all'

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (partnerId) {
      where.partnerId = partnerId
    }

    // Fetch service commissions (PartnerCommission) unless filtering for affiliate only
    let serviceCommissions: any[] = []
    if (!source || source === 'all' || source === 'service') {
      serviceCommissions = await prisma.partnerCommission.findMany({
        where,
        include: {
          partner: {
            select: { id: true, name: true, partnerNumber: true, partnerType: true },
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
    }

    // Fetch affiliate commissions unless filtering for service only
    let affiliateCommissions: any[] = []
    if (!source || source === 'all' || source === 'affiliate') {
      affiliateCommissions = await prisma.affiliateCommission.findMany({
        where,
        include: {
          partner: {
            select: { id: true, name: true, partnerNumber: true, partnerType: true },
          },
          referral: {
            select: { id: true, platform: true, eventType: true, orderId: true, customerEmail: true },
          },
          payout: {
            select: { id: true, payoutNumber: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    // Transform to unified format
    const unifiedCommissions = [
      ...serviceCommissions.map(c => ({
        ...c,
        source: 'service' as const,
        description: c.lead?.businessName || 'Unknown Lead',
      })),
      ...affiliateCommissions.map(c => ({
        ...c,
        source: 'affiliate' as const,
        description: c.type === 'SHOP_ORDER'
          ? `Shop Order${c.referral?.orderId ? ` #${c.referral.orderId.slice(0, 8)}...` : ''}`
          : 'MotoRev Pro Conversion',
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Get totals for service commissions
    const serviceTotals = await prisma.partnerCommission.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    })

    const servicePendingTotal = await prisma.partnerCommission.aggregate({
      where: { ...where, status: 'PENDING' },
      _sum: { amount: true },
    })

    const serviceApprovedTotal = await prisma.partnerCommission.aggregate({
      where: { ...where, status: 'APPROVED' },
      _sum: { amount: true },
    })

    const servicePaidTotal = await prisma.partnerCommission.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { amount: true },
    })

    // Get totals for affiliate commissions
    const affiliateTotals = await prisma.affiliateCommission.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    })

    const affiliatePendingTotal = await prisma.affiliateCommission.aggregate({
      where: { ...where, status: 'PENDING' },
      _sum: { amount: true },
    })

    const affiliateApprovedTotal = await prisma.affiliateCommission.aggregate({
      where: { ...where, status: 'APPROVED' },
      _sum: { amount: true },
    })

    const affiliatePaidTotal = await prisma.affiliateCommission.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      commissions: unifiedCommissions,
      stats: {
        total: (Number(serviceTotals._sum.amount) || 0) + (Number(affiliateTotals._sum.amount) || 0),
        totalAmount: (Number(serviceTotals._sum.amount) || 0) + (Number(affiliateTotals._sum.amount) || 0),
        pendingAmount: (Number(servicePendingTotal._sum.amount) || 0) + (Number(affiliatePendingTotal._sum.amount) || 0),
        approvedAmount: (Number(serviceApprovedTotal._sum.amount) || 0) + (Number(affiliateApprovedTotal._sum.amount) || 0),
        paidAmount: (Number(servicePaidTotal._sum.amount) || 0) + (Number(affiliatePaidTotal._sum.amount) || 0),
        serviceCount: serviceTotals._count,
        affiliateCount: affiliateTotals._count,
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
