import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/shipping/zones - List all shipping zones with rates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const zones = await prisma.shippingZone.findMany({
      include: {
        rates: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { priority: 'desc' },
    })

    return NextResponse.json(zones)
  } catch (error) {
    console.error('Error fetching shipping zones:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipping zones' },
      { status: 500 }
    )
  }
}

// POST /api/admin/shipping/zones - Create a new shipping zone
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, countries, states, zipCodes, active, priority } = body

    if (!name || !countries || countries.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one country are required' },
        { status: 400 }
      )
    }

    const zone = await prisma.shippingZone.create({
      data: {
        name,
        countries,
        states: states || [],
        zipCodes: zipCodes || null,
        active: active ?? true,
        priority: priority || 0,
      },
      include: {
        rates: true,
      },
    })

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Error creating shipping zone:', error)
    return NextResponse.json(
      { error: 'Failed to create shipping zone' },
      { status: 500 }
    )
  }
}
