import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/customers/[id] - Get user details (customer or admin)
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

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const customer = await prisma.user.findUnique({
      where: {
        id,
        role: 'CUSTOMER', // Only customers, not admins
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        title: true,
        image: true,
        role: true,
        permissions: true,
        emailAccess: true,
        backupEmail: true,
        isFounder: true,
        emailVerified: true,
        createdAt: true,
        // Check if Zoho is connected
        zohoRefreshToken: true,
        // Get last session for "last active" info
        sessions: {
          select: {
            expires: true,
          },
          orderBy: { expires: 'desc' },
          take: 1,
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { orders: true },
        },
        // Check if linked to a team member
        teamMember: {
          select: {
            id: true,
            employeeNumber: true,
            title: true,
          },
        },
        // Check if linked to a client
        client: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
          },
        },
        // Check if linked to a partner
        partner: {
          select: {
            id: true,
            partnerNumber: true,
            name: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Transform the response
    const response = {
      ...customer,
      zohoConnected: !!customer.zohoRefreshToken,
      lastSession: customer.sessions[0] || null,
      // Remove sensitive fields
      zohoRefreshToken: undefined,
      sessions: undefined,
    }

    return NextResponse.json({ customer: response })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PATCH /api/admin/customers/[id] - Update user account settings
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!currentUser || !['ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // This endpoint is only for CUSTOMER users - use team management for admins
    if (targetUser.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Use team management for admin users' }, { status: 403 })
    }

    const body = await req.json()
    const { username, name, phone, title } = body

    // Build update data - customers can't have role/permissions changed here
    const updateData: any = {}
    if (username !== undefined) updateData.username = username || null
    if (name !== undefined) updateData.name = name || null
    if (phone !== undefined) updateData.phone = phone || null
    if (title !== undefined) updateData.title = title || null

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        title: true,
      },
    })

    return NextResponse.json({ success: true, user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
