import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  generateLinkCode,
  generateAffiliateCode,
  getAffiliateUrl,
} from '@/lib/affiliate-utils'

// GET - List partner's affiliate links with stats
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get partner associated with this user
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        affiliateCode: true,
        shopCommissionRate: true,
        motorevProBonus: true,
        motorevProWindowDays: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Get affiliate links with stats
    const links = await prisma.affiliateLink.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            clicks: true,
            referrals: true,
          },
        },
      },
    })

    // Format links with full URLs
    const formattedLinks = links.map((link) => ({
      ...link,
      url: link.customUrl || getAffiliateUrl(
        link.platform as 'SHOP' | 'MOTOREV',
        link.code,
        link.targetId
      ),
      clickCount: link._count.clicks,
      referralCount: link._count.referrals,
    }))

    return NextResponse.json({
      links: formattedLinks,
      affiliateCode: partner.affiliateCode,
      settings: {
        shopCommissionRate: partner.shopCommissionRate,
        motorevProBonus: partner.motorevProBonus,
        motorevProWindowDays: partner.motorevProWindowDays,
      },
    })
  } catch (error) {
    console.error('Error fetching affiliate links:', error)
    return NextResponse.json(
      { error: 'Failed to fetch affiliate links' },
      { status: 500 }
    )
  }
}

// POST - Create new affiliate link
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        affiliateCode: true,
      },
    })

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    const body = await req.json()
    const { platform, targetType, targetId, name } = body

    // Validate platform
    if (!platform || !['SHOP', 'MOTOREV'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be SHOP or MOTOREV' },
        { status: 400 }
      )
    }

    // Validate target type
    if (!targetType || !['STORE', 'PRODUCT', 'CATEGORY'].includes(targetType)) {
      return NextResponse.json(
        { error: 'Invalid target type. Must be STORE, PRODUCT, or CATEGORY' },
        { status: 400 }
      )
    }

    // Generate unique code
    let code = generateLinkCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.affiliateLink.findUnique({
        where: { code },
      })
      if (!existing) break
      code = generateLinkCode()
      attempts++
    }

    // If partner doesn't have an affiliate code yet, generate one
    let affiliateCode = partner.affiliateCode
    if (!affiliateCode) {
      affiliateCode = generateAffiliateCode()
      await prisma.partner.update({
        where: { id: partner.id },
        data: { affiliateCode },
      })
    }

    // Create the affiliate link
    const link = await prisma.affiliateLink.create({
      data: {
        partnerId: partner.id,
        code,
        name: name || null,
        platform,
        targetType,
        targetId: targetId || null,
      },
    })

    // Build the full URL
    const url = getAffiliateUrl(
      platform as 'SHOP' | 'MOTOREV',
      code,
      targetId
    )

    return NextResponse.json({
      link: {
        ...link,
        url,
        clickCount: 0,
        referralCount: 0,
      },
      affiliateCode,
    })
  } catch (error) {
    console.error('Error creating affiliate link:', error)
    return NextResponse.json(
      { error: 'Failed to create affiliate link' },
      { status: 500 }
    )
  }
}
