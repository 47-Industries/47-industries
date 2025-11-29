import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/shipping/zones/[id] - Get a specific zone
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const zone = await prisma.shippingZone.findUnique({
      where: { id },
      include: {
        rates: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Error fetching shipping zone:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipping zone' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/shipping/zones/[id] - Update a zone
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, countries, states, zipCodes, active, priority } = body

    const zone = await prisma.shippingZone.update({
      where: { id },
      data: {
        name,
        countries,
        states: states || [],
        zipCodes: zipCodes || null,
        active,
        priority,
      },
      include: {
        rates: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    })

    return NextResponse.json(zone)
  } catch (error) {
    console.error('Error updating shipping zone:', error)
    return NextResponse.json(
      { error: 'Failed to update shipping zone' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/shipping/zones/[id] - Delete a zone and its rates
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Delete zone (rates will cascade delete)
    await prisma.shippingZone.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shipping zone:', error)
    return NextResponse.json(
      { error: 'Failed to delete shipping zone' },
      { status: 500 }
    )
  }
}
