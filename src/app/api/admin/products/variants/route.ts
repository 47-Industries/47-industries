import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/products/variants - List all products with variants
export async function GET(req: NextRequest) {
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
        price: true,
        stock: true,
        images: true,
        variants: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Error fetching products with variants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}
