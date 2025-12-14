import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/recurring-bills/[id]/history - Get bill history for a recurring bill
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = params

    // Get the recurring bill
    const recurringBill = await prisma.recurringBill.findUnique({
      where: { id }
    })

    if (!recurringBill) {
      return NextResponse.json({ error: 'Recurring bill not found' }, { status: 404 })
    }

    // Get all bill instances for this recurring bill, ordered by period descending
    const instances = await prisma.billInstance.findMany({
      where: { recurringBillId: id },
      orderBy: { period: 'desc' },
      include: {
        founderPayments: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    // Calculate stats
    const amounts = instances.map(i => Number(i.amount)).filter(a => a > 0)
    const stats = {
      totalInstances: instances.length,
      paidCount: instances.filter(i => i.status === 'PAID').length,
      pendingCount: instances.filter(i => i.status === 'PENDING').length,
      average: amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0,
      highest: amounts.length > 0 ? Math.max(...amounts) : 0,
      lowest: amounts.length > 0 ? Math.min(...amounts) : 0,
      total: amounts.reduce((a, b) => a + b, 0)
    }

    return NextResponse.json({
      recurringBill,
      instances,
      stats
    })
  } catch (error: any) {
    console.error('Error fetching bill history:', error)
    return NextResponse.json({ error: 'Failed to fetch bill history' }, { status: 500 })
  }
}
