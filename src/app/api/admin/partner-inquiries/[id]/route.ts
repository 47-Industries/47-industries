import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth, getAdminAuthInfo } from '@/lib/auth-helper'

/**
 * GET /api/admin/partner-inquiries/[id]
 * Get single partner inquiry details
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const inquiry = await prisma.partnerInquiry.findUnique({
      where: { id: params.id },
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    return NextResponse.json({ inquiry })
  } catch (error) {
    console.error('Error fetching partner inquiry:', error)
    return NextResponse.json({ error: 'Failed to fetch inquiry' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/partner-inquiries/[id]
 * Update partner inquiry status
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { status, reviewNotes } = body

    // Get current inquiry
    const inquiry = await prisma.partnerInquiry.findUnique({
      where: { id: params.id },
    })

    if (!inquiry) {
      return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })
    }

    // Validate status transition
    const validStatuses = ['NEW', 'CONTACTED', 'APPROVED', 'REJECTED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get admin info
    const auth = await getAdminAuthInfo(req)

    // Prepare update data
    const updateData: any = {
      reviewedBy: auth.userId,
      reviewedAt: new Date(),
    }

    if (status) updateData.status = status
    if (reviewNotes !== undefined) updateData.reviewNotes = reviewNotes

    // If approving, create a Partner record
    if (status === 'APPROVED' && inquiry.status !== 'APPROVED') {
      // Check if partner already exists with this email
      const existingUser = await prisma.user.findUnique({
        where: { email: inquiry.email.toLowerCase() },
      })

      if (existingUser) {
        // Check if they're already a partner
        const existingPartner = await prisma.partner.findUnique({
          where: { userId: existingUser.id },
        })

        if (existingPartner) {
          return NextResponse.json({
            error: 'A partner account already exists for this email',
          }, { status: 400 })
        }
      }

      // Generate partner number
      const date = new Date()
      const timestamp = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0')
      const count = await prisma.partner.count()
      const partnerNumber = `PTR-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

      // Create user if doesn't exist
      let userId = existingUser?.id
      if (!userId) {
        const newUser = await prisma.user.create({
          data: {
            email: inquiry.email.toLowerCase(),
            name: inquiry.name,
            phone: inquiry.phone,
            role: 'CUSTOMER',
          },
        })
        userId = newUser.id
      }

      // Create partner
      const partner = await prisma.partner.create({
        data: {
          partnerNumber,
          userId,
          name: inquiry.name,
          email: inquiry.email.toLowerCase(),
          phone: inquiry.phone,
          company: inquiry.company,
          // Default commission rates
          commissionType: 'TIERED',
          firstSaleRate: 50.00,
          recurringRate: 30.00,
          partnerType: 'SERVICE_REFERRAL',
          status: 'ACTIVE',
        },
      })

      updateData.partnerId = partner.id
      updateData.convertedAt = new Date()
    }

    // Update inquiry
    const updated = await prisma.partnerInquiry.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, inquiry: updated })
  } catch (error) {
    console.error('Error updating partner inquiry:', error)
    return NextResponse.json({ error: 'Failed to update inquiry' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/partner-inquiries/[id]
 * Delete a partner inquiry
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.partnerInquiry.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting partner inquiry:', error)
    return NextResponse.json({ error: 'Failed to delete inquiry' }, { status: 500 })
  }
}
