import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/tax/rates - List all tax rates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rates = await prisma.taxRate.findMany({
      orderBy: [
        { country: 'asc' },
        { state: 'asc' },
        { priority: 'desc' },
      ],
    })

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Error fetching tax rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tax rates' },
      { status: 500 }
    )
  }
}

// POST /api/admin/tax/rates - Create a new tax rate
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      country,
      state,
      zipCode,
      city,
      rate,
      isCompound,
      includeShipping,
      priority,
      active,
    } = body

    if (!name || rate === undefined) {
      return NextResponse.json(
        { error: 'Name and rate are required' },
        { status: 400 }
      )
    }

    const taxRate = await prisma.taxRate.create({
      data: {
        name,
        country: country || 'US',
        state: state || null,
        zipCode: zipCode || null,
        city: city || null,
        rate: parseFloat(rate),
        isCompound: isCompound ?? false,
        includeShipping: includeShipping ?? false,
        priority: priority || 0,
        active: active ?? true,
      },
    })

    return NextResponse.json(taxRate)
  } catch (error) {
    console.error('Error creating tax rate:', error)
    return NextResponse.json(
      { error: 'Failed to create tax rate' },
      { status: 500 }
    )
  }
}
