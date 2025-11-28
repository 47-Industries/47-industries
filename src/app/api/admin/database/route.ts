import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ALLOWED_TABLES = [
  'user',
  'account',
  'session',
  'product',
  'category',
  'order',
  'orderItem',
  'cartItem',
  'customRequest',
  'serviceInquiry',
  'review',
  'discountCode',
  'address',
  'page',
  'media',
  'setting',
  'pageView'
] as const

type TableName = typeof ALLOWED_TABLES[number]

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const table = searchParams.get('table')?.toLowerCase() as TableName | null

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table name' }, { status: 400 })
  }

  try {
    // Use type assertion to access dynamic table
    const prismaTable = prisma[table as keyof typeof prisma] as {
      findMany: (args?: { take?: number; orderBy?: Record<string, string> }) => Promise<unknown[]>
    }

    const data = await prismaTable.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' } as Record<string, string>
    }).catch(async () => {
      // If orderBy fails (table doesn't have createdAt), try without it
      return await prismaTable.findMany({ take: 100 })
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Database query error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
