import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// POST /api/admin/bills/[id]/payments - Mark a founder's payment as paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: billId } = await params

  try {
    const body = await request.json()
    const { userId, status, paidDate } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Verify user is a founder
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isFounder: true }
    })

    if (!user || !user.isFounder) {
      return NextResponse.json({ error: 'User is not a founder' }, { status: 400 })
    }

    const payment = await prisma.billPayment.upsert({
      where: {
        billId_userId: { billId, userId }
      },
      update: {
        status: status || 'PAID',
        paidDate: paidDate ? new Date(paidDate) : new Date()
      },
      create: {
        billId,
        userId,
        amount: 0, // Will be calculated below
        status: status || 'PAID',
        paidDate: paidDate ? new Date(paidDate) : new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    // Check if all payments are complete, update bill status
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { payments: true }
    })

    if (bill) {
      const allPaid = bill.payments.every(p => p.status === 'PAID')

      await prisma.bill.update({
        where: { id: billId },
        data: {
          status: allPaid ? 'PAID' : 'PENDING',
          paidDate: allPaid ? new Date() : null
        }
      })
    }

    return NextResponse.json({ payment })
  } catch (error: any) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
  }
}

// GET /api/admin/bills/[id]/payments - Get all payments for a bill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: billId } = await params

  try {
    const payments = await prisma.billPayment.findMany({
      where: { billId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      },
      orderBy: { user: { name: 'asc' } }
    })

    return NextResponse.json({ payments })
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
