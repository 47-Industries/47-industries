import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/proposed-bills/[id]/approve - Approve a proposed bill (same options as bank transactions)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    // Same options as bank transaction approval
    const vendor = body.vendor
    const vendorType = body.vendorType || 'OTHER'
    const createRecurring = body.createRecurring === true
    const autoApprove = body.autoApprove === true
    const frequency = body.frequency || 'MONTHLY'
    const dueDay = body.dueDay || null // Will be set from proposed bill date if not provided
    const createAutoApproveRule = body.createAutoApproveRule === true
    const ruleType = body.ruleType || 'VENDOR'
    const vendorPattern = body.vendorPattern
    const patternOverride = body.patternOverride || null // For DESCRIPTION_PATTERN
    const displayName = body.displayName || null
    const amountMode = body.amountMode || 'EXACT'
    const amountMin = body.amountMin
    const amountMax = body.amountMax

    // Get proposed bill
    const proposed = await prisma.proposedBill.findUnique({
      where: { id }
    })

    if (!proposed) {
      return NextResponse.json({ error: 'Proposed bill not found' }, { status: 404 })
    }

    if (proposed.status !== 'PENDING') {
      return NextResponse.json({ error: `Bill already ${proposed.status.toLowerCase()}` }, { status: 400 })
    }

    // Get team members who split expenses
    const splitters = await prisma.teamMember.findMany({
      where: { splitsExpenses: true, status: 'ACTIVE' },
      select: { id: true }
    })

    const finalVendor = vendor || proposed.vendor || 'Unknown'
    const amount = proposed.amount ? Number(proposed.amount) : 0
    const dueDate = proposed.dueDate || new Date()
    const period = dueDate.toISOString().slice(0, 7)

    let recurringBillId: string | null = proposed.matchedRecurringBillId

    // ALWAYS try to find a matching recurring bill template if not already linked
    if (!recurringBillId) {
      const vendorFirstWord = finalVendor.split(' ')[0].toLowerCase()
      const existingRecurring = await prisma.recurringBill.findFirst({
        where: {
          active: true,
          OR: [
            { vendor: { contains: vendorFirstWord } },
            { name: { contains: vendorFirstWord } }
          ]
        }
      })

      if (existingRecurring) {
        recurringBillId = existingRecurring.id
        console.log(`[APPROVE] Auto-linked email bill to recurring template: ${existingRecurring.name}`)
      }
    }

    // Create or update recurring bill if requested
    if (createRecurring) {
      const existingRecurring = recurringBillId
        ? await prisma.recurringBill.findUnique({ where: { id: recurringBillId } })
        : await prisma.recurringBill.findFirst({
            where: {
              vendor: { contains: finalVendor.split(' ')[0] },
              active: true
            }
          })

      if (existingRecurring) {
        await prisma.recurringBill.update({
          where: { id: existingRecurring.id },
          data: {
            autoApprove: autoApprove || existingRecurring.autoApprove
          }
        })
        recurringBillId = existingRecurring.id
      } else {
        const patterns = finalVendor.toLowerCase().split(' ').filter((w: string) => w.length > 2).slice(0, 3)
        const recurring = await prisma.recurringBill.create({
          data: {
            name: finalVendor,
            vendor: finalVendor,
            vendorType,
            frequency,
            amountType: 'VARIABLE',
            dueDay: dueDay || Math.min(dueDate.getDate(), 28),
            active: true,
            autoApprove,
            emailPatterns: patterns
          }
        })
        recurringBillId = recurring.id
      }
    }

    // Create bill instance
    const billInstance = await prisma.billInstance.create({
      data: {
        recurringBillId,
        vendor: finalVendor,
        vendorType,
        amount,
        dueDate,
        period,
        status: proposed.isPaid ? 'PAID' : 'PENDING',
        paidDate: proposed.isPaid ? dueDate : null,
        paidVia: proposed.paymentMethod,
        emailId: proposed.emailId,
        emailSubject: proposed.emailSubject,
        emailFrom: proposed.emailFrom
      }
    })

    // Create bill splits
    if (splitters.length > 0 && amount > 0) {
      const splitAmount = amount / splitters.length
      await prisma.billSplit.createMany({
        data: splitters.map(s => ({
          billInstanceId: billInstance.id,
          teamMemberId: s.id,
          amount: splitAmount,
          status: 'PENDING'
        }))
      })
    }

    // Update proposed bill
    await prisma.proposedBill.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        matchedRecurringBillId: recurringBillId,
        createdBillInstanceId: billInstance.id
      }
    })

    let ruleCreated = false
    let additionalApproved = 0

    // Create auto-approve rule and apply to other pending emails
    const patternToUse = ruleType === 'DESCRIPTION_PATTERN' ? patternOverride : vendorPattern
    if (createAutoApproveRule && patternToUse) {
      try {
        // Find other pending proposed bills with matching pattern
        const matchingPending = await prisma.proposedBill.findMany({
          where: {
            status: 'PENDING',
            id: { not: id },
            OR: [
              { vendor: { contains: patternToUse } },
              { emailFrom: { contains: patternToUse } },
              { emailSubject: { contains: patternToUse } }
            ]
          }
        })

        for (const pending of matchingPending) {
          const pendingAmount = pending.amount ? Number(pending.amount) : 0

          // Check amount match if rule type includes amount
          if (ruleType === 'VENDOR_AMOUNT') {
            let amountMatches = false
            if (amountMode === 'RANGE' && amountMin != null && amountMax != null) {
              amountMatches = pendingAmount >= amountMin && pendingAmount <= amountMax
            } else {
              // 5% variance
              const minAmt = amount * 0.95
              const maxAmt = amount * 1.05
              amountMatches = pendingAmount >= minAmt && pendingAmount <= maxAmt
            }
            if (!amountMatches) continue
          }

          const pendingDueDate = pending.dueDate || new Date()
          const pendingPeriod = pendingDueDate.toISOString().slice(0, 7)

          // Create bill instance for this pending email
          const newBill = await prisma.billInstance.create({
            data: {
              recurringBillId,
              vendor: pending.vendor || finalVendor,
              vendorType,
              amount: pendingAmount,
              dueDate: pendingDueDate,
              period: pendingPeriod,
              status: pending.isPaid ? 'PAID' : 'PENDING',
              paidDate: pending.isPaid ? pendingDueDate : null,
              paidVia: pending.paymentMethod,
              emailId: pending.emailId,
              emailSubject: pending.emailSubject,
              emailFrom: pending.emailFrom
            }
          })

          // Create splits
          if (splitters.length > 0 && pendingAmount > 0) {
            const splitAmount = pendingAmount / splitters.length
            await prisma.billSplit.createMany({
              data: splitters.map(s => ({
                billInstanceId: newBill.id,
                teamMemberId: s.id,
                amount: splitAmount,
                status: 'PENDING'
              }))
            })
          }

          // Update pending as approved
          await prisma.proposedBill.update({
            where: { id: pending.id },
            data: {
              status: 'APPROVED',
              reviewedBy: session.user.id,
              reviewedAt: new Date(),
              matchedRecurringBillId: recurringBillId,
              createdBillInstanceId: newBill.id
            }
          })

          additionalApproved++
        }

        ruleCreated = true
      } catch (ruleError: any) {
        console.error('[APPROVE] Error applying auto-approve rule:', ruleError.message)
      }
    }

    return NextResponse.json({
      success: true,
      billInstanceId: billInstance.id,
      recurringBillId,
      recurringCreated: createRecurring && recurringBillId !== null,
      ruleCreated,
      additionalApproved
    })
  } catch (error: any) {
    console.error('[PROPOSED_BILLS] Error approving:', error.message, error.stack)
    return NextResponse.json({ error: 'Failed to approve proposed bill: ' + error.message }, { status: 500 })
  }
}
