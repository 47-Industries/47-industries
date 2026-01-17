import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToR2, isR2Configured } from '@/lib/r2'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
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
        signatureUrl: true,
        initialsUrl: true,
        zohoRefreshToken: true,
        createdAt: true,
        updatedAt: true,
        // Get last session
        sessions: {
          select: { expires: true },
          orderBy: { expires: 'desc' },
          take: 1,
        },
        // Check linked accounts
        teamMember: {
          select: {
            id: true,
            employeeNumber: true,
            title: true,
            department: true,
            salaryAmount: true,
            startDate: true,
            phone: true,
          },
        },
        client: {
          select: {
            id: true,
            clientNumber: true,
            name: true,
          },
        },
        partner: {
          select: {
            id: true,
            partnerNumber: true,
            name: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Transform response - use teamMember phone if user phone is empty
    const response = {
      ...user,
      phone: user.phone || user.teamMember?.phone || null,
      zohoConnected: !!user.zohoRefreshToken,
      lastSession: user.sessions[0] || null,
      zohoRefreshToken: undefined,
      sessions: undefined,
    }

    return NextResponse.json({ user: response })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, username, phone, title, backupEmail, imageDataUrl } = body

    // Build update data
    const updateData: Record<string, string | null> = {}

    if (name !== undefined) updateData.name = name?.trim() || null
    if (username !== undefined) updateData.username = username?.trim() || null
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (title !== undefined) updateData.title = title?.trim() || null
    if (backupEmail !== undefined) updateData.backupEmail = backupEmail?.trim() || null

    // Handle profile image upload
    if (imageDataUrl) {
      if (!imageDataUrl.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
      }

      if (isR2Configured) {
        const matches = imageDataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
        if (!matches) {
          return NextResponse.json({ error: 'Invalid image data format' }, { status: 400 })
        }

        const mimeType = `image/${matches[1]}`
        const base64Data = matches[2]
        const buffer = Buffer.from(base64Data, 'base64')
        const fileName = `profiles/users/${session.user.id}-avatar-${Date.now()}.${matches[1]}`
        updateData.image = await uploadToR2(fileName, buffer, mimeType)
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        phone: true,
        title: true,
        image: true,
        backupEmail: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
