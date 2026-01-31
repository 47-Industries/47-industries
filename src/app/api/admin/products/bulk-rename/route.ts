import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// POST /api/admin/products/bulk-rename - Bulk rename products
// This endpoint renames "47 |" to "47 Industries |" in product names
export async function POST(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all products that start with "47 |" or "47|"
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { startsWith: '47 |' } },
          { name: { startsWith: '47|' } },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    })

    const updates: { id: string; oldName: string; newName: string }[] = []

    for (const product of products) {
      let newName = product.name

      // Replace "47 |" with "47 Industries |"
      if (newName.startsWith('47 |')) {
        newName = newName.replace('47 |', '47 Industries |')
      } else if (newName.startsWith('47|')) {
        newName = newName.replace('47|', '47 Industries |')
      }

      // Only update if name changed
      if (newName !== product.name) {
        await prisma.product.update({
          where: { id: product.id },
          data: { name: newName },
        })

        updates.push({
          id: product.id,
          oldName: product.name,
          newName: newName,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} products`,
      updates,
    })
  } catch (error) {
    console.error('Bulk rename error:', error)
    return NextResponse.json(
      { error: 'Failed to rename products' },
      { status: 500 }
    )
  }
}

// GET - Preview what would be renamed
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all products that start with "47 |" or "47|"
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { startsWith: '47 |' } },
          { name: { startsWith: '47|' } },
        ],
      },
      select: {
        id: true,
        name: true,
      },
    })

    const preview = products.map(product => {
      let newName = product.name
      if (newName.startsWith('47 |')) {
        newName = newName.replace('47 |', '47 Industries |')
      } else if (newName.startsWith('47|')) {
        newName = newName.replace('47|', '47 Industries |')
      }
      return {
        id: product.id,
        currentName: product.name,
        newName: newName,
      }
    })

    return NextResponse.json({
      count: preview.length,
      preview,
    })
  } catch (error) {
    console.error('Preview error:', error)
    return NextResponse.json(
      { error: 'Failed to preview' },
      { status: 500 }
    )
  }
}
