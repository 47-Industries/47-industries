import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/bills - List all bills
export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const vendor = searchParams.get('vendor')
  const limit = parseInt(searchParams.get('limit') || '50')
  const page = parseInt(searchParams.get('page') || '1')

  try {
    const where: any = {}
    if (status) where.status = status
    if (vendor) where.vendor = { contains: vendor }

    const [bills, total, founders] = await Promise.all([
      prisma.bill.findMany({
        where,
        orderBy: [
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          payments: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.bill.count({ where }),
      prisma.user.findMany({ where: { isFounder: true } })
    ])

    // Add founder count and per-person split to each bill
    const billsWithSplits = bills.map(bill => ({
      ...bill,
      founderCount: founders.length,
      perPersonAmount: founders.length > 0 ? Number(bill.amount) / founders.length : Number(bill.amount)
    }))

    // Get summary stats
    const stats = await prisma.bill.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: true
    })

    const upcomingBills = await prisma.bill.findMany({
      where: {
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    })

    return NextResponse.json({
      bills: billsWithSplits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: stats.reduce((acc, s) => {
        acc[s.status] = { count: s._count, total: Number(s._sum.amount || 0) }
        return acc
      }, {} as Record<string, { count: number; total: number }>),
      upcomingBills,
      founders: founders.map(f => ({ id: f.id, name: f.name, email: f.email }))
    })
  } catch (error: any) {
    console.error('Error fetching bills:', error)
    return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
  }
}

// POST /api/admin/bills - Manually create a bill
export async function POST(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { vendor, vendorType, amount, dueDate } = body

    if (!vendor || amount === undefined) {
      return NextResponse.json({ error: 'Vendor and amount are required' }, { status: 400 })
    }

    // Get all founders for auto-splitting
    const founders = await prisma.user.findMany({ where: { isFounder: true } })

    if (founders.length === 0) {
      return NextResponse.json({ error: 'No founders configured. Please set isFounder=true on user accounts.' }, { status: 400 })
    }

    const splitAmount = Number(amount) / founders.length

    const bill = await prisma.bill.create({
      data: {
        vendor,
        vendorType: vendorType || 'OTHER',
        amount,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'PENDING',
        // Auto-create payment splits for all founders
        payments: {
          create: founders.map(f => ({
            userId: f.id,
            amount: splitAmount,
            status: 'PENDING'
          }))
        }
      },
      include: {
        payments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      bill,
      founderCount: founders.length,
      perPersonAmount: splitAmount
    })
  } catch (error: any) {
    console.error('Error creating bill:', error)
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
  }
}
