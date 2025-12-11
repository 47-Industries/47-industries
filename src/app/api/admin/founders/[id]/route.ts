import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/founders/[id] - Get a single founder with payment history
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
    const founder = await prisma.user.findUnique({
      where: { id, isFounder: true },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        billPayments: {
          include: {
            bill: {
              select: {
                id: true,
                vendor: true,
                vendorType: true,
                amount: true,
                dueDate: true,
                status: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })

    if (!founder) {
      return NextResponse.json({ error: 'Founder not found' }, { status: 404 })
    }

    // Calculate totals
    const [pendingPayments, paidPayments] = await Promise.all([
      prisma.billPayment.aggregate({
        where: { userId: id, status: 'PENDING' },
        _sum: { amount: true },
        _count: true
      }),
      prisma.billPayment.aggregate({
        where: { userId: id, status: 'PAID' },
        _sum: { amount: true },
        _count: true
      })
    ])

    return NextResponse.json({
      founder: {
        ...founder,
        totals: {
          pending: Number(pendingPayments._sum.amount || 0),
          pendingCount: pendingPayments._count,
          paid: Number(paidPayments._sum.amount || 0),
          paidCount: paidPayments._count
        }
      }
    })
  } catch (error: any) {
    console.error('Error fetching founder:', error)
    return NextResponse.json({ error: 'Failed to fetch founder' }, { status: 500 })
  }
}
