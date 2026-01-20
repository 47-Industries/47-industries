import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// GET /api/admin/email-accounts/[id] - Get single email account
export async function GET(
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

    const account = await prisma.emailAccount.findUnique({
      where: { id },
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        isActive: true,
        scanForBills: true,
        lastSyncAt: true,
        lastSyncError: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ account })
  } catch (error: any) {
    console.error('[EMAIL_ACCOUNTS] Error fetching:', error.message)
    return NextResponse.json({ error: 'Failed to fetch email account' }, { status: 500 })
  }
}

// PATCH /api/admin/email-accounts/[id] - Update email account settings
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

    // Only allow updating certain fields
    const allowedUpdates: Record<string, any> = {}
    if (typeof body.displayName === 'string') allowedUpdates.displayName = body.displayName
    if (typeof body.isActive === 'boolean') allowedUpdates.isActive = body.isActive
    if (typeof body.scanForBills === 'boolean') allowedUpdates.scanForBills = body.scanForBills

    const account = await prisma.emailAccount.update({
      where: { id },
      data: allowedUpdates,
      select: {
        id: true,
        provider: true,
        email: true,
        displayName: true,
        isActive: true,
        scanForBills: true,
        lastSyncAt: true,
        lastSyncError: true
      }
    })

    return NextResponse.json({ account })
  } catch (error: any) {
    console.error('[EMAIL_ACCOUNTS] Error updating:', error.message)
    return NextResponse.json({ error: 'Failed to update email account' }, { status: 500 })
  }
}

// DELETE /api/admin/email-accounts/[id] - Delete email account
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

    await prisma.emailAccount.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[EMAIL_ACCOUNTS] Error deleting:', error.message)
    return NextResponse.json({ error: 'Failed to delete email account' }, { status: 500 })
  }
}
