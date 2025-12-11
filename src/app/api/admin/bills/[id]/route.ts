import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/bills/[id] - Get a single bill with details
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
    const [bill, founders] = await Promise.all([
      prisma.bill.findUnique({
        where: { id },
        include: {
          payments: {
            include: {
              user: {
                select: { id: true, name: true, email: true, image: true }
              }
            }
          }
        }
      }),
      prisma.user.findMany({ where: { isFounder: true } })
    ])

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    return NextResponse.json({
      bill: {
        ...bill,
        founderCount: founders.length,
        perPersonAmount: founders.length > 0 ? Number(bill.amount) / founders.length : Number(bill.amount)
      }
    })
  } catch (error: any) {
    console.error('Error fetching bill:', error)
    return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 })
  }
}

// PATCH /api/admin/bills/[id] - Update a bill
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
    const { status, paidDate, paidByUserId, vendor, vendorType, amount, dueDate } = body

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (paidDate !== undefined) updateData.paidDate = new Date(paidDate)
    if (paidByUserId !== undefined) updateData.paidByUserId = paidByUserId
    if (vendor !== undefined) updateData.vendor = vendor
    if (vendorType !== undefined) updateData.vendorType = vendorType
    if (amount !== undefined) updateData.amount = amount
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)

    const bill = await prisma.bill.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ bill })
  } catch (error: any) {
    console.error('Error updating bill:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 })
  }
}

// DELETE /api/admin/bills/[id] - Delete a bill
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
    await prisma.bill.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting bill:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to delete bill' }, { status: 500 })
  }
}
