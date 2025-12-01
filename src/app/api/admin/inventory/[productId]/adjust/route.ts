import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/admin/inventory/[productId]/adjust - Adjust product stock
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await params
    const body = await req.json()
    const { type, quantity, reason } = body

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Calculate new stock
    let newStock: number
    let movementType: 'IN' | 'OUT' | 'ADJUSTMENT'
    let movementQuantity: number

    if (type === 'set') {
      newStock = quantity
      movementType = 'ADJUSTMENT'
      movementQuantity = quantity - product.stock
    } else if (type === 'add') {
      newStock = product.stock + quantity
      movementType = 'IN'
      movementQuantity = quantity
    } else if (type === 'subtract') {
      newStock = Math.max(0, product.stock - quantity)
      movementType = 'OUT'
      movementQuantity = -Math.min(quantity, product.stock)
    } else {
      return NextResponse.json({ error: 'Invalid adjustment type' }, { status: 400 })
    }

    // Update product stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    })

    // Try to create stock movement record
    try {
      await prisma.stockMovement.create({
        data: {
          productId,
          type: movementType,
          quantity: movementQuantity,
          reason: reason || null,
        },
      })
    } catch {
      // Model might not exist yet - continue without recording movement
    }

    // Check if we need to create/update inventory alerts
    const LOW_STOCK_THRESHOLD = 10

    try {
      if (newStock === 0) {
        // Create out of stock alert
        await prisma.inventoryAlert.upsert({
          where: {
            productId_type: {
              productId,
              type: 'OUT_OF_STOCK',
            },
          },
          update: {
            isResolved: false,
            updatedAt: new Date(),
          },
          create: {
            productId,
            type: 'OUT_OF_STOCK',
            threshold: 0,
            isResolved: false,
          },
        })
      } else if (newStock <= LOW_STOCK_THRESHOLD) {
        // Create low stock alert
        await prisma.inventoryAlert.upsert({
          where: {
            productId_type: {
              productId,
              type: 'LOW_STOCK',
            },
          },
          update: {
            isResolved: false,
            updatedAt: new Date(),
          },
          create: {
            productId,
            type: 'LOW_STOCK',
            threshold: LOW_STOCK_THRESHOLD,
            isResolved: false,
          },
        })
      } else {
        // Resolve any existing alerts for this product
        await prisma.inventoryAlert.updateMany({
          where: {
            productId,
            isResolved: false,
          },
          data: {
            isResolved: true,
          },
        })
      }
    } catch {
      // Alert model might not exist yet - continue without alerts
    }

    return NextResponse.json({
      product: updatedProduct,
      previousStock: product.stock,
      newStock,
    })
  } catch (error) {
    console.error('Error adjusting stock:', error)
    return NextResponse.json(
      { error: 'Failed to adjust stock' },
      { status: 500 }
    )
  }
}
