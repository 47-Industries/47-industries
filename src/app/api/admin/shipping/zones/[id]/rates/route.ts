import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/admin/shipping/zones/[id]/rates - Add a rate to a zone
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: zoneId } = await params
    const body = await req.json()

    const {
      name,
      description,
      baseRate,
      perItemRate,
      perPoundRate,
      freeShippingMin,
      minDays,
      maxDays,
      carrier,
      serviceCode,
      active,
      sortOrder,
    } = body

    if (!name || baseRate === undefined) {
      return NextResponse.json(
        { error: 'Name and base rate are required' },
        { status: 400 }
      )
    }

    // Verify zone exists
    const zone = await prisma.shippingZone.findUnique({
      where: { id: zoneId },
    })

    if (!zone) {
      return NextResponse.json({ error: 'Zone not found' }, { status: 404 })
    }

    const rate = await prisma.shippingRate.create({
      data: {
        zoneId,
        name,
        description: description || null,
        baseRate: parseFloat(baseRate) || 0,
        perItemRate: parseFloat(perItemRate) || 0,
        perPoundRate: parseFloat(perPoundRate) || 0,
        freeShippingMin: freeShippingMin ? parseFloat(freeShippingMin) : null,
        minDays: minDays || 3,
        maxDays: maxDays || 7,
        carrier: carrier || null,
        serviceCode: serviceCode || null,
        active: active ?? true,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error creating shipping rate:', error)
    return NextResponse.json(
      { error: 'Failed to create shipping rate' },
      { status: 500 }
    )
  }
}
