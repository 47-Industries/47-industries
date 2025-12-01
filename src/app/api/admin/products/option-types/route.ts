import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/products/option-types - List all option types
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const optionTypes = await prisma.productOptionType.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ optionTypes })
  } catch (error) {
    console.error('Error fetching option types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch option types' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products/option-types - Create a new option type
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, values } = body

    if (!name || !values || !Array.isArray(values) || values.length === 0) {
      return NextResponse.json(
        { error: 'Name and values are required' },
        { status: 400 }
      )
    }

    // Check if option type already exists
    const existing = await prisma.productOptionType.findUnique({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'An option type with this name already exists' },
        { status: 400 }
      )
    }

    // Get max sort order
    const maxOrder = await prisma.productOptionType.aggregate({
      _max: { sortOrder: true },
    })

    const optionType = await prisma.productOptionType.create({
      data: {
        name,
        values,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    })

    return NextResponse.json(optionType, { status: 201 })
  } catch (error) {
    console.error('Error creating option type:', error)
    return NextResponse.json(
      { error: 'Failed to create option type' },
      { status: 500 }
    )
  }
}
