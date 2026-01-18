import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/users/admins - Get list of admin users for signing
export async function GET(req: NextRequest) {
  try {
    const isAuthorized = await verifyAdminAuth(req)
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
      select: {
        id: true,
        email: true,
        name: true,
        title: true,
        role: true,
        signatureUrl: true,
        initialsUrl: true,
        // Include TeamMember for the employment title
        teamMember: {
          select: {
            title: true,
          },
        },
      },
      orderBy: [
        { role: 'desc' }, // SUPER_ADMIN first
        { name: 'asc' },
      ],
    })

    // Flatten the response - use TeamMember title if User title is not set
    const formattedAdmins = admins.map(admin => ({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      title: admin.title || admin.teamMember?.title || null,
      role: admin.role,
      signatureUrl: admin.signatureUrl,
      initialsUrl: admin.initialsUrl,
    }))

    return NextResponse.json({ admins: formattedAdmins })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 })
  }
}
