import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/partners/[id] - Get partner details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        contract: {
          include: {
            signatureFields: {
              select: {
                id: true,
                assignedTo: true,
                isSigned: true,
                signedByName: true,
              },
            },
          },
        },
        leads: {
          orderBy: { createdAt: 'desc' },
        },
        commissions: {
          include: {
            lead: {
              select: { businessName: true, leadNumber: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        payouts: {
          orderBy: { createdAt: 'desc' },
        },
        referredProjects: {
          include: {
            client: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        affiliateLinks: {
          orderBy: { createdAt: 'desc' },
        },
        affiliateReferrals: {
          include: {
            link: true,
            commission: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        affiliateCommissions: {
          include: {
            referral: true,
            payout: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Calculate totals
    const commissionTotals = await prisma.partnerCommission.aggregate({
      where: { partnerId: partner.id },
      _sum: { amount: true },
    })
    const pendingCommissions = await prisma.partnerCommission.aggregate({
      where: { partnerId: partner.id, status: 'PENDING' },
      _sum: { amount: true },
    })
    const paidPayouts = await prisma.partnerPayout.aggregate({
      where: { partnerId: partner.id, status: 'PAID' },
      _sum: { amount: true },
    })

    return NextResponse.json({
      partner: {
        ...partner,
        totalEarned: commissionTotals._sum.amount || 0,
        pendingAmount: pendingCommissions._sum.amount || 0,
        totalPaid: paidPayouts._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching partner:', error)
    return NextResponse.json({ error: 'Failed to fetch partner' }, { status: 500 })
  }
}

// PUT /api/admin/partners/[id] - Update partner
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const partner = await prisma.partner.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        commissionType: body.commissionType,
        firstSaleRate: parseFloat(body.firstSaleRate),
        recurringRate: parseFloat(body.recurringRate),
        status: body.status,
        partnerType: body.partnerType,
        // Affiliate settings
        affiliateCode: body.affiliateCode || null,
        shopCommissionRate: body.shopCommissionRate ? parseFloat(body.shopCommissionRate) : null,
        motorevProBonus: body.motorevProBonus ? parseFloat(body.motorevProBonus) : null,
        motorevProWindowDays: body.motorevProWindowDays ? parseInt(body.motorevProWindowDays) : null,
        // Payment methods
        zelleEmail: body.zelleEmail || null,
        zellePhone: body.zellePhone || null,
        venmoUsername: body.venmoUsername || null,
        cashAppTag: body.cashAppTag || null,
        mailingAddress: body.mailingAddress || null,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        contract: {
          include: {
            signatureFields: {
              select: {
                id: true,
                assignedTo: true,
                isSigned: true,
                signedByName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ success: true, partner })
  } catch (error) {
    console.error('Error updating partner:', error)
    return NextResponse.json({ error: 'Failed to update partner' }, { status: 500 })
  }
}

// DELETE /api/admin/partners/[id] - Delete partner
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if partner has any commissions or payouts
    const partner = await prisma.partner.findUnique({
      where: { id },
      include: {
        _count: {
          select: { commissions: true, payouts: true },
        },
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    if (partner._count.commissions > 0 || partner._count.payouts > 0) {
      // Soft delete - just mark as inactive
      await prisma.partner.update({
        where: { id },
        data: { status: 'INACTIVE' },
      })
      return NextResponse.json({ success: true, softDeleted: true })
    }

    // Hard delete if no financial records
    await prisma.partner.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting partner:', error)
    return NextResponse.json({ error: 'Failed to delete partner' }, { status: 500 })
  }
}
