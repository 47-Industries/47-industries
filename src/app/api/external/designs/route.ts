import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// API Key validation for external partners
function validateApiKey(request: NextRequest): { valid: boolean; source: string | null } {
  const apiKey = request.headers.get('x-api-key')

  if (apiKey === process.env.BOOKFADE_API_KEY) {
    return { valid: true, source: 'bookfade' }
  }

  return { valid: false, source: null }
}

// GET /api/external/designs - Check customer's existing designs
// Used for reorder pricing - if design exists, customer gets additional unit pricing
export async function GET(request: NextRequest) {
  const auth = validateApiKey(request)
  if (!auth.valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const customerEmail = searchParams.get('customerEmail')
  const productId = searchParams.get('productId')
  const variantId = searchParams.get('variantId')
  const sourceCustomerId = searchParams.get('sourceCustomerId') // e.g., barberId

  if (!customerEmail && !sourceCustomerId) {
    return NextResponse.json(
      { error: 'customerEmail or sourceCustomerId is required' },
      { status: 400 }
    )
  }

  const where: any = {
    source: auth.source,
    status: 'COMPLETED', // Only return completed designs (ready for reorder)
  }

  if (customerEmail) {
    where.customerEmail = customerEmail
  }

  if (sourceCustomerId) {
    where.sourceCustomerId = sourceCustomerId
  }

  if (productId) {
    where.productId = productId
  }

  if (variantId) {
    where.variantId = variantId
  }

  const designs = await prisma.customerDesign.findMany({
    where,
    select: {
      id: true,
      productId: true,
      variantId: true,
      designName: true,
      previewImage: true,
      status: true,
      createdAt: true,
      completedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    designs,
    hasExistingDesigns: designs.length > 0,
  })
}
