import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// GET /api/admin/financial-connections/transactions - List transactions
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('accountId')
  const matched = searchParams.get('matched') // 'true', 'false', or null for all
  const limit = parseInt(searchParams.get('limit') || '100')
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const where: any = {}

    if (accountId) {
      where.financialAccountId = accountId
    }

    if (matched === 'true') {
      where.matchedBillInstanceId = { not: null }
    } else if (matched === 'false') {
      where.matchedBillInstanceId = null
    }

    const [transactions, total, unmatchedCount] = await Promise.all([
      prisma.stripeTransaction.findMany({
        where,
        orderBy: { transactedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          financialAccount: {
            select: {
              institutionName: true,
              accountLast4: true
            }
          }
        }
      }),
      prisma.stripeTransaction.count({ where }),
      prisma.stripeTransaction.count({
        where: { matchedBillInstanceId: null }
      })
    ])

    return NextResponse.json({
      transactions,
      total,
      unmatchedCount,
      limit,
      offset
    })
  } catch (error: any) {
    console.error('[FINANCIAL_CONNECTIONS] Error listing transactions:', error.message)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
