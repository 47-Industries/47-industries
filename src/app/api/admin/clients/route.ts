import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// GET /api/admin/clients - List all clients
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const source = searchParams.get('source')
    const assignedTo = searchParams.get('assignedTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { clientNumber: { contains: search } },
        { industry: { contains: search } },
      ]
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (source && source !== 'all') {
      where.source = source
    }

    if (assignedTo && assignedTo !== 'all') {
      where.assignedTo = assignedTo
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          _count: {
            select: {
              invoices: true,
              projects: true,
              contracts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ])

    // Get stats
    const stats = await prisma.client.groupBy({
      by: ['type'],
      _count: { id: true },
    })

    const activeProjects = await prisma.clientProject.count({
      where: { status: 'ACTIVE' },
    })

    // Calculate revenue this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyRevenue = await prisma.invoice.aggregate({
      where: {
        clientId: { not: null },
        status: 'PAID',
        paidAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    })

    const outstanding = await prisma.invoice.aggregate({
      where: {
        clientId: { not: null },
        status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
      },
      _sum: { total: true },
    })

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        byType: stats.reduce((acc, s) => ({ ...acc, [s.type]: s._count.id }), {}),
        activeProjects,
        monthlyRevenue: monthlyRevenue._sum.total || 0,
        outstanding: outstanding._sum.total || 0,
      },
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

// POST /api/admin/clients - Create a new client
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Generate client number
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.client.count()
    const clientNumber = `CLI-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    // Create client with optional primary contact
    const client = await prisma.client.create({
      data: {
        clientNumber,
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        website: body.website || null,
        address: body.address || null,
        industry: body.industry || null,
        type: body.type || 'PENDING',
        source: body.source || 'DIRECT',
        assignedTo: body.assignedTo || null,
        leadchopperId: body.leadchopperId || null,
        leadchopperOrgId: body.leadchopperOrgId || null,
        inquiryId: body.inquiryId || null,
        // Create primary contact if contact info provided
        contacts: body.contactName ? {
          create: {
            name: body.contactName,
            email: body.contactEmail || body.email,
            phone: body.contactPhone || body.phone,
            role: body.contactRole || null,
            isPrimary: true,
          },
        } : undefined,
      },
      include: {
        contacts: true,
      },
    })

    // Log activity
    const auth = await getAdminAuthInfo(req)
    await prisma.clientActivity.create({
      data: {
        clientId: client.id,
        type: 'STATUS_CHANGE',
        description: `Client created with status ${client.type}`,
        performedBy: auth.userId,
      },
    })

    return NextResponse.json({ success: true, client })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
