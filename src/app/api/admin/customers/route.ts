import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth-helper'

import { prisma } from '@/lib/prisma'

// GET /api/admin/customers - List all customers
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const segment = searchParams.get('segment') || ''

    const skip = (page - 1) * limit

    const where: any = {
      role: 'CUSTOMER', // Only show customers, not admins
      teamMember: null, // Exclude users who are team members
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    // If segment is specified, filter by segment members
    if (segment) {
      const segmentData = await prisma.customerSegment.findUnique({
        where: { id: segment },
      })
      if (segmentData?.memberIds) {
        const memberIds = segmentData.memberIds as string[]
        where.id = { in: memberIds }
      }
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: { orders: true },
          },
          orders: {
            select: {
              total: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    // Calculate total spent and last order date
    const customersWithStats = customers.map(customer => {
      const totalSpent = customer.orders.reduce((sum, order) => sum + Number(order.total), 0)
      const lastOrderDate = customer.orders[0]?.createdAt || null

      return {
        ...customer,
        orders: undefined, // Remove orders array from response
        totalSpent,
        lastOrderDate,
      }
    })

    return NextResponse.json({
      customers: customersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
