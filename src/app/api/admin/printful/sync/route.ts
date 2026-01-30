import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncPrintfulProducts, isPrintfulConfigured } from '@/lib/printful'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isPrintfulConfigured()) {
      return NextResponse.json(
        { error: 'Printful API key not configured' },
        { status: 400 }
      )
    }

    const result = await syncPrintfulProducts()

    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      message: result.errors.length > 0
        ? `Synced ${result.synced} products with ${result.errors.length} errors`
        : `Successfully synced ${result.synced} products`,
    })
  } catch (error) {
    console.error('Printful sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
