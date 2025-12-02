import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/email/signatures - Get all signatures for the user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const signatures = await prisma.emailSignature.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ signatures })
  } catch (error) {
    console.error('Error fetching signatures:', error)
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 })
  }
}

// POST /api/admin/email/signatures - Create a new signature
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, content, isDefault, forAddress } = await req.json()

    if (!name || !content) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 })
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.emailSignature.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          ...(forAddress ? { forAddress } : {}),
        },
        data: { isDefault: false },
      })
    }

    const signature = await prisma.emailSignature.create({
      data: {
        userId: session.user.id,
        name,
        content,
        isDefault: isDefault || false,
        forAddress: forAddress || null,
      },
    })

    return NextResponse.json({ signature, success: true })
  } catch (error) {
    console.error('Error creating signature:', error)
    return NextResponse.json({ error: 'Failed to create signature' }, { status: 500 })
  }
}
