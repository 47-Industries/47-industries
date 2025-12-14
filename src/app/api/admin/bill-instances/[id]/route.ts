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
    const founderCount = await prisma.user.count({
      where: { isFounder: true }
    })

    const billInstance = await prisma.billInstance.findUnique({
      where: { id },
      include: {
        recurringBill: true,
        founderPayments: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true }
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
        founderCount,
        perPersonAmount: founderCount > 0 ? Number(billInstance.amount) / founderCount : Number(billInstance.amount)
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
    const { amount, dueDate, status, paidDate, paidVia } = body

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

    // If status changed to PAID, update all founder payments
    if (status === 'PAID') {
      await prisma.founderPayment.updateMany({
        where: { billInstanceId: id },
        data: {
          status: 'PAID',
          paidDate: paidDate ? new Date(paidDate) : new Date()
        }
      })
    }

    // If amount changed, update founder payment amounts
    if (amount !== undefined) {
      const founders = await prisma.user.count({ where: { isFounder: true } })
      if (founders > 0) {
        const splitAmount = parseFloat(amount) / founders
        await prisma.founderPayment.updateMany({
          where: { billInstanceId: id },
          data: { amount: splitAmount }
        })
      }
    }

    return NextResponse.json({
      success: true,
      billInstance
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
    // Founder payments will cascade delete
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
