import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/contracts/[id]/signature-fields - Get signature fields for a contract
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const signatureFields = await prisma.contractSignatureField.findMany({
      where: { contractId: id },
      orderBy: [
        { pageNumber: 'asc' },
        { yPercent: 'asc' },
      ],
    })

    return NextResponse.json({ signatureFields })
  } catch (error) {
    console.error('Error fetching signature fields:', error)
    return NextResponse.json({ error: 'Failed to fetch signature fields' }, { status: 500 })
  }
}

// POST /api/admin/contracts/[id]/signature-fields - Create/update signature fields for a contract
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { fields } = body as {
      fields: Array<{
        id?: string
        type: string
        pageNumber: number
        xPercent: number
        yPercent: number
        widthPercent: number
        heightPercent: number
        assignedTo: string
        label?: string
      }>
    }

    // Verify contract exists
    const contract = await prisma.contract.findUnique({
      where: { id },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Delete existing unsigned fields and create new ones
    // (Keep fields that have been signed)
    await prisma.contractSignatureField.deleteMany({
      where: {
        contractId: id,
        isSigned: false,
      },
    })

    // Create new signature fields
    const createdFields = await Promise.all(
      fields.map(field =>
        prisma.contractSignatureField.create({
          data: {
            contractId: id,
            type: field.type.toUpperCase(),
            pageNumber: field.pageNumber,
            xPercent: field.xPercent,
            yPercent: field.yPercent,
            widthPercent: field.widthPercent,
            heightPercent: field.heightPercent,
            assignedTo: field.assignedTo,
            label: field.label || null,
            isSigned: false,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      signatureFields: createdFields,
    })
  } catch (error) {
    console.error('Error saving signature fields:', error)
    return NextResponse.json({ error: 'Failed to save signature fields' }, { status: 500 })
  }
}

// DELETE /api/admin/contracts/[id]/signature-fields - Delete all unsigned signature fields
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.contractSignatureField.deleteMany({
      where: {
        contractId: id,
        isSigned: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting signature fields:', error)
    return NextResponse.json({ error: 'Failed to delete signature fields' }, { status: 500 })
  }
}
