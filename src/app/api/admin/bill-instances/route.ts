import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/bill-instances - List bill instances with filtering
export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, PAID, OVERDUE
    const period = searchParams.get('period') // e.g., "2025-01"
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (status) where.status = status
    if (period) where.period = period

    // Get founder count for calculating per-person amounts
    const founderCount = await prisma.user.count({
      where: { isFounder: true }
    })

    const billInstances = await prisma.billInstance.findMany({
      where,
      orderBy: { dueDate: 'desc' },
      take: limit,
      include: {
        recurringBill: {
          select: { id: true, name: true, paymentMethod: true }
        },
        founderPayments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      }
    })

    // Add per-person amount to each bill
    const billsWithSplit = billInstances.map(bill => ({
      ...bill,
      founderCount,
      perPersonAmount: founderCount > 0 ? Number(bill.amount) / founderCount : Number(bill.amount)
    }))

    // Calculate totals
    const totalPending = billInstances
      .filter(b => b.status === 'PENDING')
      .reduce((sum, b) => sum + Number(b.amount), 0)

    const totalPaid = billInstances
      .filter(b => b.status === 'PAID')
      .reduce((sum, b) => sum + Number(b.amount), 0)

    return NextResponse.json({
      billInstances: billsWithSplit,
      total: billInstances.length,
      founderCount,
      totalPending,
      totalPaid
    })
  } catch (error: any) {
    console.error('Error fetching bill instances:', error)
    return NextResponse.json({ error: 'Failed to fetch bill instances' }, { status: 500 })
  }
}

// POST /api/admin/bill-instances - Create a manual bill instance
export async function POST(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      recurringBillId,
      vendor,
      vendorType,
      amount,
      dueDate,
      period,
      status
    } = body

    if (!vendor || !vendorType || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: vendor, vendorType, amount, dueDate' },
        { status: 400 }
      )
    }

    // Create the bill instance
    const billInstance = await prisma.billInstance.create({
      data: {
        recurringBillId: recurringBillId || null,
        vendor,
        vendorType,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        period: period || new Date(dueDate).toISOString().slice(0, 7), // "2025-01"
        status: status || 'PENDING'
      }
    })

    // Create founder payment splits
    const founders = await prisma.user.findMany({
      where: { isFounder: true }
    })

    if (founders.length > 0) {
      const splitAmount = parseFloat(amount) / founders.length

      await prisma.founderPayment.createMany({
        data: founders.map(founder => ({
          billInstanceId: billInstance.id,
          userId: founder.id,
          amount: splitAmount,
          status: status === 'PAID' ? 'PAID' : 'PENDING',
          paidDate: status === 'PAID' ? new Date() : null
        }))
      })
    }

    // Fetch the complete bill instance with payments
    const completeBillInstance = await prisma.billInstance.findUnique({
      where: { id: billInstance.id },
      include: {
        founderPayments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      billInstance: completeBillInstance
    })
  } catch (error: any) {
    console.error('Error creating bill instance:', error)
    return NextResponse.json({ error: 'Failed to create bill instance' }, { status: 500 })
  }
}
