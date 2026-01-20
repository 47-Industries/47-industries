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

    // Get team members who split expenses
    const splitters = await prisma.teamMember.findMany({
      where: { splitsExpenses: true, status: 'ACTIVE' },
      select: { id: true, name: true, email: true, profileImageUrl: true }
    })
    const splitterCount = splitters.length

    const billInstances = await prisma.billInstance.findMany({
      where,
      orderBy: { dueDate: 'desc' },
      take: limit,
      include: {
        recurringBill: {
          select: { id: true, name: true, paymentMethod: true }
        },
        billSplits: {
          include: {
            teamMember: {
              select: { id: true, name: true, email: true, profileImageUrl: true }
            }
          }
        }
      }
    })

    // Add per-person amount to each bill
    const billsWithSplit = billInstances.map(bill => ({
      ...bill,
      splitterCount,
      perPersonAmount: splitterCount > 0 ? Number(bill.amount) / splitterCount : Number(bill.amount)
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
      splitterCount,
      splitters,
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
      status,
      splitterIds,  // Optional: specific team member IDs to split
      customSplits  // Optional: { teamMemberId: amount } for custom amounts
    } = body

    if (!vendor || !vendorType || !amount || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: vendor, vendorType, amount, dueDate' },
        { status: 400 }
      )
    }

    // Determine who splits this bill
    let splittersToUse: { id: string; splitPercent?: number }[] = []

    if (splitterIds && splitterIds.length > 0) {
      // Use specified splitters
      splittersToUse = splitterIds.map((id: string) => ({ id }))
    } else if (recurringBillId) {
      // Check if recurring bill has default splitters
      const recurringBill = await prisma.recurringBill.findUnique({
        where: { id: recurringBillId },
        include: { defaultSplitters: true }
      })
      if (recurringBill?.defaultSplitters?.length) {
        splittersToUse = recurringBill.defaultSplitters.map(s => ({
          id: s.teamMemberId,
          splitPercent: s.splitPercent ? Number(s.splitPercent) : undefined
        }))
      }
    }

    // Fallback to all team members with splitsExpenses=true
    if (splittersToUse.length === 0) {
      const defaultSplitters = await prisma.teamMember.findMany({
        where: { splitsExpenses: true, status: 'ACTIVE' }
      })
      splittersToUse = defaultSplitters.map(s => ({ id: s.id }))
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

    // Create bill splits
    if (splittersToUse.length > 0) {
      const totalAmount = parseFloat(amount)

      // Calculate amounts for each splitter
      const splits = splittersToUse.map(splitter => {
        let splitAmount: number
        let splitPercent: number | null = null

        if (customSplits && customSplits[splitter.id]) {
          // Custom amount specified
          splitAmount = parseFloat(customSplits[splitter.id])
        } else if (splitter.splitPercent) {
          // Use percentage from recurring bill defaults
          splitPercent = splitter.splitPercent
          splitAmount = totalAmount * (splitter.splitPercent / 100)
        } else {
          // Equal split
          splitAmount = totalAmount / splittersToUse.length
        }

        return {
          billInstanceId: billInstance.id,
          teamMemberId: splitter.id,
          amount: splitAmount,
          splitPercent,
          status: status === 'PAID' ? 'PAID' : 'PENDING',
          paidDate: status === 'PAID' ? new Date() : null
        }
      })

      await prisma.billSplit.createMany({ data: splits })
    }

    // Fetch the complete bill instance with splits
    const completeBillInstance = await prisma.billInstance.findUnique({
      where: { id: billInstance.id },
      include: {
        billSplits: {
          include: {
            teamMember: {
              select: { id: true, name: true, email: true, profileImageUrl: true }
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
