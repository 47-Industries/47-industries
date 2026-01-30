import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { retryPrintfulOrder } from '@/lib/printful'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const result = await retryPrintfulOrder(id)

    return NextResponse.json({
      success: true,
      printfulOrderId: result.id,
      status: result.status,
    })
  } catch (error) {
    console.error('Error retrying Printful order:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retry order' },
      { status: 500 }
    )
  }
}
