import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Brand } from '@prisma/client'

// GET /api/admin/business-cards/designs - List saved designs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brand = searchParams.get('brand') as Brand | null
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: { brand?: Brand } = {}
    if (brand) {
      where.brand = brand
    }

    const designs = await prisma.businessCardDesign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ designs })
  } catch (error) {
    console.error('Error fetching business card designs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch designs' },
      { status: 500 }
    )
  }
}

// POST /api/admin/business-cards/designs - Save a new design
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, brand, cardData } = body

    if (!name || !cardData) {
      return NextResponse.json(
        { error: 'Name and cardData are required' },
        { status: 400 }
      )
    }

    const design = await prisma.businessCardDesign.create({
      data: {
        name,
        brand: brand || null,
        cardData,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ design })
  } catch (error) {
    console.error('Error saving business card design:', error)
    return NextResponse.json(
      { error: 'Failed to save design' },
      { status: 500 }
    )
  }
}
