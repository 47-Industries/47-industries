import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/recurring-bills/generate - Manually generate bill instances for recurring bills
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const body = await request.json().catch(() => ({}))

    // Optional: specific recurring bill ID, or generate for all
    const recurringBillId = body.recurringBillId || null
    // Optional: specific periods to generate (array of YYYY-MM strings)
    const periods = body.periods || null
    // Optional: number of months to look back (default 6)
    const monthsBack = body.monthsBack || 6
    // Optional: number of months forward (default 2)
    const monthsForward = body.monthsForward || 2

    // Get recurring bills to process
    const recurringBills = await prisma.recurringBill.findMany({
      where: recurringBillId
        ? { id: recurringBillId, active: true }
        : { active: true }
    })

    if (recurringBills.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active recurring bills found',
        created: 0
      })
    }

    // Get team members who split expenses
    const splitters = await prisma.teamMember.findMany({
      where: { splitsExpenses: true, status: 'ACTIVE' },
      select: { id: true }
    })

    const splitterCount = splitters.length

    // Build list of periods to check
    let periodsToGenerate: string[] = []

    if (periods && Array.isArray(periods)) {
      periodsToGenerate = periods
    } else {
      // Generate periods from monthsBack to monthsForward
      const now = new Date()
      for (let i = -monthsBack; i <= monthsForward; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
        periodsToGenerate.push(date.toISOString().slice(0, 7))
      }
    }

    let created = 0
    const results: { period: string; vendor: string; amount: number }[] = []

    for (const period of periodsToGenerate) {
      const [year, month] = period.split('-').map(Number)

      for (const recurring of recurringBills) {
        // Handle different frequencies
        let shouldCreateForPeriod = true
        let effectivePeriod = period

        if (recurring.frequency === 'QUARTERLY') {
          // Only create for quarter start months (Jan, Apr, Jul, Oct)
          const quarterStartMonths = [1, 4, 7, 10]
          if (!quarterStartMonths.includes(month)) {
            shouldCreateForPeriod = false
          } else {
            const quarter = Math.floor((month - 1) / 3) + 1
            effectivePeriod = `${year}-Q${quarter}`
          }
        } else if (recurring.frequency === 'ANNUAL') {
          // Only create for January (or the bill's due month if specified)
          if (month !== 1) {
            shouldCreateForPeriod = false
          } else {
            effectivePeriod = `${year}`
          }
        }

        if (!shouldCreateForPeriod) continue

        // Check if we already have an instance for this period
        const existing = await prisma.billInstance.findFirst({
          where: {
            recurringBillId: recurring.id,
            period: effectivePeriod
          }
        })

        if (existing) continue

        // Calculate due date for this period
        let dueDate: Date
        if (recurring.frequency === 'MONTHLY') {
          dueDate = new Date(year, month - 1, recurring.dueDay || 1)
        } else if (recurring.frequency === 'QUARTERLY') {
          // Due on the dueDay of the quarter start month
          dueDate = new Date(year, month - 1, recurring.dueDay || 1)
        } else if (recurring.frequency === 'ANNUAL') {
          dueDate = new Date(year, 0, recurring.dueDay || 1)
        } else {
          // Default to monthly behavior
          dueDate = new Date(year, month - 1, recurring.dueDay || 1)
        }

        // For fixed bills, use the fixed amount
        // For variable bills, create with amount=0 (awaiting email/bank data)
        const amount = recurring.amountType === 'FIXED'
          ? Number(recurring.fixedAmount) || 0
          : 0

        const perPersonAmount = splitterCount > 0 && amount > 0
          ? amount / splitterCount
          : 0

        // Check if this bill is in the past and should be marked as needing attention
        const isPastDue = dueDate < new Date()

        await prisma.billInstance.create({
          data: {
            recurringBillId: recurring.id,
            vendor: recurring.vendor,
            vendorType: recurring.vendorType,
            amount,
            dueDate,
            period: effectivePeriod,
            status: 'PENDING',
            billSplits: splitterCount > 0 ? {
              create: splitters.map(splitter => ({
                teamMemberId: splitter.id,
                amount: perPersonAmount,
                status: 'PENDING'
              }))
            } : undefined
          }
        })

        created++
        results.push({
          period: effectivePeriod,
          vendor: recurring.vendor,
          amount
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${created} bill instance(s)`,
      created,
      results
    })
  } catch (error: any) {
    console.error('[GENERATE BILLS] Error:', error.message, error.stack)
    return NextResponse.json({ error: 'Failed to generate bills: ' + error.message }, { status: 500 })
  }
}
