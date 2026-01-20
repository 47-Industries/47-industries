import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// DELETE /api/admin/skip-rules/[id] - Delete a skip rule
export async function DELETE(
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

    await prisma.transactionSkipRule.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[SKIP_RULES] Error deleting:', error.message)
    return NextResponse.json({ error: 'Failed to delete skip rule' }, { status: 500 })
  }
}

// PATCH /api/admin/skip-rules/[id] - Update a skip rule (e.g., toggle active)
export async function PATCH(
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
    const body = await request.json()
    const { isActive, name, reason } = body

    const rule = await prisma.transactionSkipRule.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(name && { name }),
        ...(reason !== undefined && { reason })
      },
      include: {
        financialAccount: {
          select: {
            institutionName: true,
            accountLast4: true
          }
        }
      }
    })

    return NextResponse.json({ rule })
  } catch (error: any) {
    console.error('[SKIP_RULES] Error updating:', error.message)
    return NextResponse.json({ error: 'Failed to update skip rule' }, { status: 500 })
  }
}
