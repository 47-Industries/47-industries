import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/customers/segments - List all segments
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const segments = await prisma.customerSegment.findMany({
      orderBy: { createdAt: 'asc' },
    })

    // Calculate member count for each segment
    const segmentsWithCount = segments.map(segment => {
      const memberIds = (segment.memberIds as string[]) || []
      return {
        ...segment,
        memberCount: memberIds.length,
      }
    })

    return NextResponse.json({ segments: segmentsWithCount })
  } catch (error) {
    console.error('Error fetching segments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    )
  }
}

// POST /api/admin/customers/segments - Create a new segment
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Check if segment with same name exists
    const existingSegment = await prisma.customerSegment.findUnique({
      where: { name: body.name },
    })

    if (existingSegment) {
      return NextResponse.json(
        { error: 'A segment with this name already exists' },
        { status: 400 }
      )
    }

    const segment = await prisma.customerSegment.create({
      data: {
        name: body.name,
        description: body.description || null,
        color: body.color || '#3b82f6',
        conditions: body.conditions || null,
        isAutomatic: body.isAutomatic || false,
        memberIds: body.memberIds || [],
      },
    })

    return NextResponse.json(segment, { status: 201 })
  } catch (error) {
    console.error('Error creating segment:', error)
    return NextResponse.json(
      { error: 'Failed to create segment' },
      { status: 500 }
    )
  }
}
