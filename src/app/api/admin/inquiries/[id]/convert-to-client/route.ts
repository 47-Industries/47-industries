import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

// POST /api/admin/inquiries/[id]/convert-to-client
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const auth = await getAdminAuthInfo(req)

    // Get the inquiry
    const inquiry = await prisma.serviceInquiry.findUnique({
      where: { id },
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Check if already converted
    const existingClient = await prisma.client.findUnique({
      where: { inquiryId: id },
    })

    if (existingClient) {
      return NextResponse.json({
        error: 'This inquiry has already been converted to a client',
        client: existingClient,
      }, { status: 400 })
    }

    // Generate client number
    const date = new Date()
    const timestamp = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0')
    const count = await prisma.client.count()
    const clientNumber = `CLI-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

    // Create client from inquiry
    const client = await prisma.client.create({
      data: {
        clientNumber,
        name: inquiry.company || inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone || null,
        website: inquiry.website || null,
        industry: body.industry || null,
        type: body.type || 'PROSPECT',
        source: 'INQUIRY',
        inquiryId: id,
        assignedTo: body.assignedTo || null,
        // Create primary contact
        contacts: {
          create: {
            name: inquiry.name,
            email: inquiry.email,
            phone: inquiry.phone || null,
            role: body.contactRole || null,
            isPrimary: true,
          },
        },
        // Create project if requested
        projects: body.createProject ? {
          create: {
            name: body.projectName || `${inquiry.company || inquiry.name} - ${inquiry.serviceType}`,
            description: inquiry.description,
            type: inquiry.serviceType,
            status: 'PROPOSAL',
            contractValue: inquiry.estimatedCost || null,
            inquiryId: id,
          },
        } : undefined,
      },
      include: {
        contacts: true,
        projects: true,
      },
    })

    // Update inquiry status to link it
    await prisma.serviceInquiry.update({
      where: { id },
      data: {
        status: 'CONVERTED',
        adminNotes: inquiry.adminNotes
          ? `${inquiry.adminNotes}\n\nConverted to Client: ${clientNumber}`
          : `Converted to Client: ${clientNumber}`,
      },
    })

    // Log activity
    await prisma.clientActivity.create({
      data: {
        clientId: client.id,
        type: 'STATUS_CHANGE',
        description: `Client created from inquiry ${inquiry.inquiryNumber}`,
        performedBy: auth.userId,
      },
    })

    return NextResponse.json({
      success: true,
      client,
      message: `Successfully converted inquiry to client ${clientNumber}`,
    })
  } catch (error) {
    console.error('Error converting inquiry to client:', error)
    return NextResponse.json({ error: 'Failed to convert inquiry to client' }, { status: 500 })
  }
}
