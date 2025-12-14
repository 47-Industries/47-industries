import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/bill-instances/[id]/founder-payments - Get all founder payments for a bill
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
    const payments = await prisma.founderPayment.findMany({
      where: { billInstanceId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    })

    return NextResponse.json({ payments })
  } catch (error: any) {
    console.error('Error fetching founder payments:', error)
    return NextResponse.json({ error: 'Failed to fetch founder payments' }, { status: 500 })
  }
}

// POST /api/admin/bill-instances/[id]/founder-payments - Mark a founder's payment as paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params // billInstanceId

  try {
    const body = await request.json()
    const { userId, status, paidDate } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Update or create the founder payment
    const payment = await prisma.founderPayment.upsert({
      where: {
        billInstanceId_userId: {
          billInstanceId: id,
          userId
        }
      },
      update: {
        status: status || 'PAID',
        paidDate: paidDate ? new Date(paidDate) : new Date()
      },
      create: {
        billInstanceId: id,
        userId,
        amount: 0, // Will be calculated
        status: status || 'PAID',
        paidDate: paidDate ? new Date(paidDate) : new Date()
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true }
        }
      }
    })

    // Check if all founder payments are now paid
    const billInstance = await prisma.billInstance.findUnique({
      where: { id },
      include: { founderPayments: true }
    })

    if (billInstance) {
      const allPaid = billInstance.founderPayments.every(p => p.status === 'PAID')

      // If all founders have paid, mark the bill instance as PAID
      if (allPaid && billInstance.status !== 'PAID') {
        await prisma.billInstance.update({
          where: { id },
          data: {
            status: 'PAID',
            paidDate: new Date()
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      payment,
      message: `Payment marked as ${status || 'PAID'}`
    })
  } catch (error: any) {
    console.error('Error updating founder payment:', error)
    return NextResponse.json({ error: 'Failed to update founder payment' }, { status: 500 })
  }
}
