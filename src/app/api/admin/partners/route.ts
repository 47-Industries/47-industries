import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/partners - List all partners
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { partnerNumber: { contains: search } },
        { company: { contains: search } },
      ]
    }

    const partners = await prisma.partner.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        contract: true,
        _count: {
          select: {
            leads: true,
            commissions: true,
            payouts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals for each partner
    const partnersWithTotals = await Promise.all(
      partners.map(async (partner) => {
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

        return {
          ...partner,
          totalEarned: commissionTotals._sum.amount || 0,
          pendingAmount: pendingCommissions._sum.amount || 0,
          totalPaid: paidPayouts._sum.amount || 0,
        }
      })
    )

    return NextResponse.json({ partners: partnersWithTotals })
  } catch (error) {
    console.error('Error fetching partners:', error)
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
  }
}

// POST /api/admin/partners - Create a new partner
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.name || !body.email || !body.userId) {
      return NextResponse.json(
        { error: 'Name, email, and user ID are required' },
        { status: 400 }
      )
    }

    // Check if user is already a partner
    const existingPartner = await prisma.partner.findUnique({
      where: { userId: body.userId },
    })

    if (existingPartner) {
      return NextResponse.json(
        { error: 'User is already a partner' },
        { status: 400 }
      )
    }

    // Generate partner number
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.partner.count()
    const partnerNumber = `PTR-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    const partner = await prisma.partner.create({
      data: {
        partnerNumber,
        userId: body.userId,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        commissionType: body.commissionType || 'TIERED',
        firstSaleRate: parseFloat(body.firstSaleRate) || 50,
        recurringRate: parseFloat(body.recurringRate) || 30,
        status: body.status || 'ACTIVE',
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
      },
    })

    return NextResponse.json({ success: true, partner })
  } catch (error) {
    console.error('Error creating partner:', error)
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 })
  }
}
