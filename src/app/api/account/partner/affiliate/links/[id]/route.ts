import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAffiliateUrl } from '@/lib/affiliate-utils'

// GET - Get single link details with stats
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const link = await prisma.affiliateLink.findFirst({
      where: {
        id,
        partnerId: partner.id,
      },
      include: {
        _count: {
          select: {
            clicks: true,
            referrals: true,
          },
        },
        referrals: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            commission: true,
          },
        },
      },
    })

    if (!link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const url = link.customUrl || getAffiliateUrl(
      link.platform as 'SHOP' | 'MOTOREV',
      link.code,
      link.targetId
    )

    return NextResponse.json({
      link: {
        ...link,
        url,
        clickCount: link._count.clicks,
        referralCount: link._count.referrals,
      },
    })
  } catch (error) {
    console.error('Error fetching affiliate link:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate link' },
      { status: 500 }
    )
  }
}

// PUT - Update link (name, isActive)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Verify link belongs to partner
    const existing = await prisma.affiliateLink.findFirst({
      where: {
        id,
        partnerId: partner.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    const body = await req.json()
    const { name, isActive } = body

    const updatedLink = await prisma.affiliateLink.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    const url = updatedLink.customUrl || getAffiliateUrl(
      updatedLink.platform as 'SHOP' | 'MOTOREV',
      updatedLink.code,
      updatedLink.targetId
    )

    return NextResponse.json({
      link: {
        ...updatedLink,
        url,
      },
    })
  } catch (error) {
    console.error('Error updating affiliate link:', error)
    return NextResponse.json(
      { error: 'Failed to update affiliate link' },
      { status: 500 }
    )
  }
}

// DELETE - Deactivate link (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Verify link belongs to partner
    const existing = await prisma.affiliateLink.findFirst({
      where: {
        id,
        partnerId: partner.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // Soft delete by setting isActive to false
    await prisma.affiliateLink.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting affiliate link:', error)
    return NextResponse.json(
      { error: 'Failed to delete affiliate link' },
      { status: 500 }
    )
  }
}
