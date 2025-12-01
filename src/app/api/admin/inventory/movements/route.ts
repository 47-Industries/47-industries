import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/inventory/movements - List stock movements
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let movements: any[] = []

    try {
      movements = await prisma.stockMovement.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: { name: true },
          },
        },
      })
    } catch {
      // Model might not exist yet - return empty array
    }

    return NextResponse.json({ movements })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock movements' },
      { status: 500 }
    )
  }
}
