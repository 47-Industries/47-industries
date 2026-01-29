import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

/**
 * GET /api/admin/partner-inquiries
 * List all partner inquiries with filtering and stats
 */
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { company: { contains: search } },
        { inquiryNumber: { contains: search } },
      ]
    }

    if (status && status !== 'all') {
      where.status = status
    }

    // Fetch inquiries
    const [inquiries, total] = await Promise.all([
      prisma.partnerInquiry.findMany({
        where,
        orderBy: [
          { status: 'asc' }, // NEW first, then CONTACTED, etc.
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.partnerInquiry.count({ where }),
    ])

    // Get stats
    const stats = await prisma.partnerInquiry.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const statsObj = {
      total,
      new: stats.find(s => s.status === 'NEW')?._count.id || 0,
      contacted: stats.find(s => s.status === 'CONTACTED')?._count.id || 0,
      approved: stats.find(s => s.status === 'APPROVED')?._count.id || 0,
      rejected: stats.find(s => s.status === 'REJECTED')?._count.id || 0,
    }

    return NextResponse.json({
      inquiries,
      stats: statsObj,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching partner inquiries:', error)
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 })
  }
}
