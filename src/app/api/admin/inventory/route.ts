import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/inventory - List all products with inventory info
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const products = await prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        price: true,
        images: true,
        active: true,
        category: {
          select: { name: true },
        },
      },
      orderBy: { stock: 'asc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    )
  }
}
