import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/bill-instances/[id] - Get a single bill instance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const splitterCount = await prisma.teamMember.count({
      where: { splitsExpenses: true, status: 'ACTIVE' }
    })

    const billInstance = await prisma.billInstance.findUnique({
      where: { id },
      include: {
        recurringBill: {
          include: {
            defaultSplitters: {
              include: {
                teamMember: {
                  select: { id: true, name: true, email: true, profileImageUrl: true }
                }
              }
            }
          }
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

    if (!billInstance) {
      return NextResponse.json({ error: 'Bill instance not found' }, { status: 404 })
    }

    return NextResponse.json({
      billInstance: {
        ...billInstance,
        splitterCount,
        perPersonAmount: splitterCount > 0 ? Number(billInstance.amount) / splitterCount : Number(billInstance.amount)
      }
    })
  } catch (error: any) {
    console.error('Error fetching bill instance:', error)
    return NextResponse.json({ error: 'Failed to fetch bill instance' }, { status: 500 })
  }
}

// PATCH /api/admin/bill-instances/[id] - Update a bill instance
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { amount, dueDate, status, paidDate, paidVia, splitterIds, customSplits } = body

    const updateData: any = {}
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)
    if (status !== undefined) updateData.status = status
    if (paidDate !== undefined) updateData.paidDate = paidDate ? new Date(paidDate) : null
    if (paidVia !== undefined) updateData.paidVia = paidVia

    const billInstance = await prisma.billInstance.update({
      where: { id },
      data: updateData
    })

    // If status changed to PAID, update all bill splits
    if (status === 'PAID') {
      await prisma.billSplit.updateMany({
        where: { billInstanceId: id },
        data: {
          status: 'PAID',
          paidDate: paidDate ? new Date(paidDate) : new Date()
        }
      })
    }

    // If amount changed, recalculate splits
    if (amount !== undefined) {
      const existingSplits = await prisma.billSplit.findMany({
        where: { billInstanceId: id }
      })

      if (existingSplits.length > 0) {
        // Check if any have custom percentages
        const hasCustomPercents = existingSplits.some(s => s.splitPercent !== null)

        if (hasCustomPercents) {
          // Update based on percentages
          for (const split of existingSplits) {
            const newAmount = split.splitPercent
              ? parseFloat(amount) * (Number(split.splitPercent) / 100)
              : parseFloat(amount) / existingSplits.length
            await prisma.billSplit.update({
              where: { id: split.id },
              data: { amount: newAmount }
            })
          }
        } else {
          // Equal split
          const splitAmount = parseFloat(amount) / existingSplits.length
          await prisma.billSplit.updateMany({
            where: { billInstanceId: id },
            data: { amount: splitAmount }
          })
        }
      }
    }

    // If splitters changed, recreate splits
    if (splitterIds !== undefined) {
      // Delete existing splits
      await prisma.billSplit.deleteMany({
        where: { billInstanceId: id }
      })

      // Create new splits
      if (splitterIds.length > 0) {
        const totalAmount = Number(billInstance.amount)
        const splits = splitterIds.map((teamMemberId: string) => {
          const customAmount = customSplits?.[teamMemberId]
          return {
            billInstanceId: id,
            teamMemberId,
            amount: customAmount ? parseFloat(customAmount) : totalAmount / splitterIds.length,
            status: billInstance.status === 'PAID' ? 'PAID' : 'PENDING',
            paidDate: billInstance.status === 'PAID' ? new Date() : null
          }
        })
        await prisma.billSplit.createMany({ data: splits })
      }
    }

    // Fetch updated bill instance
    const updatedBillInstance = await prisma.billInstance.findUnique({
      where: { id },
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
      billInstance: updatedBillInstance
    })
  } catch (error: any) {
    console.error('Error updating bill instance:', error)
    return NextResponse.json({ error: 'Failed to update bill instance' }, { status: 500 })
  }
}

// DELETE /api/admin/bill-instances/[id] - Delete a bill instance
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Bill splits will cascade delete
    await prisma.billInstance.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Bill instance deleted'
    })
  } catch (error: any) {
    console.error('Error deleting bill instance:', error)
    return NextResponse.json({ error: 'Failed to delete bill instance' }, { status: 500 })
  }
}
