import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncPrintfulProducts, syncNewPrintfulProducts, isPrintfulConfigured } from '@/lib/printful'

export async function POST(req: NextRequest) {
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

    // Check for mode parameter
    const { searchParams } = new URL(req.url)
    const mode = searchParams.get('mode') || 'all'

    if (mode === 'new') {
      // Sync only new products, mark deleted ones
      const result = await syncNewPrintfulProducts()

      const messages: string[] = []
      if (result.added > 0) messages.push(`Added ${result.added} new products`)
      if (result.deleted > 0) messages.push(`Marked ${result.deleted} products as deleted`)
      if (result.errors.length > 0) messages.push(`${result.errors.length} errors`)

      return NextResponse.json({
        success: true,
        added: result.added,
        deleted: result.deleted,
        errors: result.errors,
        message: messages.length > 0 ? messages.join(', ') : 'No changes - all products up to date',
      })
    } else {
      // Full sync - update all products
      const result = await syncPrintfulProducts()

      return NextResponse.json({
        success: true,
        synced: result.synced,
        errors: result.errors,
        message: result.errors.length > 0
          ? `Synced ${result.synced} products with ${result.errors.length} errors`
          : `Successfully synced ${result.synced} products`,
      })
    }
  } catch (error) {
    console.error('Printful sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
