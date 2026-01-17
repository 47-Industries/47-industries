import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/partners/[id]/contract/signature-fields - Get signature fields for a partner contract
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params
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

    // Find the partner contract
    const partnerContract = await prisma.partnerContract.findUnique({
      where: { partnerId },
    })

    if (!partnerContract) {
      return NextResponse.json({ signatureFields: [] })
    }

    const signatureFields = await prisma.contractSignatureField.findMany({
      where: { partnerContractId: partnerContract.id },
      orderBy: [
        { pageNumber: 'asc' },
        { yPercent: 'asc' },
      ],
    })

    return NextResponse.json({ signatureFields })
  } catch (error) {
    console.error('Error fetching partner contract signature fields:', error)
    return NextResponse.json({ error: 'Failed to fetch signature fields' }, { status: 500 })
  }
}

// POST /api/admin/partners/[id]/contract/signature-fields - Create/update signature fields for a partner contract
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params
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

    // Verify partner contract exists
    const partnerContract = await prisma.partnerContract.findUnique({
      where: { partnerId },
    })

    if (!partnerContract) {
      return NextResponse.json({ error: 'Partner contract not found' }, { status: 404 })
    }

    // Delete existing unsigned fields and create new ones
    await prisma.contractSignatureField.deleteMany({
      where: {
        partnerContractId: partnerContract.id,
        isSigned: false,
      },
    })

    // Create new signature fields
    const createdFields = await Promise.all(
      fields.map(field =>
        prisma.contractSignatureField.create({
          data: {
            partnerContractId: partnerContract.id,
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
    console.error('Error saving partner contract signature fields:', error)
    return NextResponse.json({ error: 'Failed to save signature fields' }, { status: 500 })
  }
}

// DELETE /api/admin/partners/[id]/contract/signature-fields - Delete all unsigned signature fields
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params
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

    const partnerContract = await prisma.partnerContract.findUnique({
      where: { partnerId },
    })

    if (!partnerContract) {
      return NextResponse.json({ error: 'Partner contract not found' }, { status: 404 })
    }

    await prisma.contractSignatureField.deleteMany({
      where: {
        partnerContractId: partnerContract.id,
        isSigned: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting partner contract signature fields:', error)
    return NextResponse.json({ error: 'Failed to delete signature fields' }, { status: 500 })
  }
}
