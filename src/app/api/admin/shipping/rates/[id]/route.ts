import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/admin/shipping/rates/[id] - Update a rate
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    const rate = await prisma.shippingRate.update({
      where: { id },
      data: {
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
        active,
        sortOrder: sortOrder || 0,
      },
    })

    return NextResponse.json(rate)
  } catch (error) {
    console.error('Error updating shipping rate:', error)
    return NextResponse.json(
      { error: 'Failed to update shipping rate' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/shipping/rates/[id] - Delete a rate
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.shippingRate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shipping rate:', error)
    return NextResponse.json(
      { error: 'Failed to delete shipping rate' },
      { status: 500 }
    )
  }
}
