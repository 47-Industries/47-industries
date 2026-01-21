import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/recurring-bills/[id] - Get a single recurring bill
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
    const recurringBill = await prisma.recurringBill.findUnique({
      where: { id },
      include: {
        instances: {
          orderBy: { dueDate: 'desc' },
          take: 12, // Last 12 instances
          include: {
            founderPayments: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, image: true }
                }
              }
            }
          }
        }
      }
    })

    if (!recurringBill) {
      return NextResponse.json({ error: 'Recurring bill not found' }, { status: 404 })
    }

    return NextResponse.json({ recurringBill })
  } catch (error: any) {
    console.error('Error fetching recurring bill:', error)
    return NextResponse.json({ error: 'Failed to fetch recurring bill' }, { status: 500 })
  }
}

// PATCH /api/admin/recurring-bills/[id] - Update a recurring bill
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
    const {
      name,
      vendor,
      amountType,
      fixedAmount,
      frequency,
      dueDay,
      emailPatterns,
      paymentMethod,
      vendorType,
      active,
      autoApprove
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (vendor !== undefined) updateData.vendor = vendor
    if (amountType !== undefined) updateData.amountType = amountType
    if (fixedAmount !== undefined) updateData.fixedAmount = fixedAmount ? parseFloat(fixedAmount) : null
    if (frequency !== undefined) updateData.frequency = frequency
    if (dueDay !== undefined) updateData.dueDay = parseInt(dueDay)
    if (emailPatterns !== undefined) updateData.emailPatterns = emailPatterns
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod
    if (vendorType !== undefined) updateData.vendorType = vendorType
    if (active !== undefined) updateData.active = active
    if (autoApprove !== undefined) updateData.autoApprove = autoApprove

    const recurringBill = await prisma.recurringBill.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      recurringBill
    })
  } catch (error: any) {
    console.error('Error updating recurring bill:', error)
    return NextResponse.json({ error: 'Failed to update recurring bill' }, { status: 500 })
  }
}

// DELETE /api/admin/recurring-bills/[id] - Delete (deactivate) a recurring bill
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
    // Soft delete - just deactivate
    await prisma.recurringBill.update({
      where: { id },
      data: { active: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Recurring bill deactivated'
    })
  } catch (error: any) {
    console.error('Error deleting recurring bill:', error)
    return NextResponse.json({ error: 'Failed to delete recurring bill' }, { status: 500 })
  }
}
