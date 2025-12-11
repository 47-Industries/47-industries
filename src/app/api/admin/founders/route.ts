import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/founders - List all founders (users with isFounder=true)
export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const founders = await prisma.user.findMany({
      where: { isFounder: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true
      }
    })

    // Calculate totals owed for each founder
    const foundersWithTotals = await Promise.all(
      founders.map(async (founder) => {
        const [pendingPayments, paidPayments] = await Promise.all([
          prisma.billPayment.aggregate({
            where: { userId: founder.id, status: 'PENDING' },
            _sum: { amount: true },
            _count: true
          }),
          prisma.billPayment.aggregate({
            where: { userId: founder.id, status: 'PAID' },
            _sum: { amount: true },
            _count: true
          })
        ])

        return {
          ...founder,
          pendingAmount: Number(pendingPayments._sum.amount || 0),
          pendingCount: pendingPayments._count,
          paidAmount: Number(paidPayments._sum.amount || 0),
          paidCount: paidPayments._count
        }
      })
    )

    return NextResponse.json({ founders: foundersWithTotals })
  } catch (error: any) {
    console.error('Error fetching founders:', error)
    return NextResponse.json({ error: 'Failed to fetch founders' }, { status: 500 })
  }
}

// POST /api/admin/founders - Mark a user as founder
export async function POST(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isFounder: true },
      select: {
        id: true,
        name: true,
        email: true,
        isFounder: true
      }
    })

    return NextResponse.json({ founder: user })
  } catch (error: any) {
    console.error('Error marking user as founder:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/admin/founders - Remove founder status from a user
export async function DELETE(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isFounder: false },
      select: {
        id: true,
        name: true,
        email: true,
        isFounder: true
      }
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Error removing founder status:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
