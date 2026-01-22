import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/affiliate/click
// Called from client-side when a user lands on a page with ref parameter
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, sessionId, referrer, url } = body

    if (!code) {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    // Find the affiliate link or partner by code
    // First try to find a specific link with this code
    let link = await prisma.affiliateLink.findUnique({
      where: { code },
      include: {
        partner: {
          select: {
            id: true,
            status: true,
            affiliateCode: true,
          },
        },
      },
    })

    // If no link found, try to find a partner by affiliate code
    // and use their most recent SHOP link (or create tracking without link)
    if (!link) {
      const partner = await prisma.partner.findFirst({
        where: {
          affiliateCode: code,
          status: 'ACTIVE',
        },
        include: {
          affiliateLinks: {
            where: { platform: 'SHOP', isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      })

      if (partner?.affiliateLinks[0]) {
        link = {
          ...partner.affiliateLinks[0],
          partner: {
            id: partner.id,
            status: partner.status,
            affiliateCode: partner.affiliateCode,
          },
        }
      } else if (partner) {
        // Partner exists but has no shop link - still track the click
        // We'll just increment partner-level tracking (if we add it later)
        return NextResponse.json({ success: true, tracked: false })
      } else {
        // Invalid code
        return NextResponse.json({ success: false, error: 'Invalid code' }, { status: 400 })
      }
    }

    // Check if link/partner is active
    if (!link.isActive || link.partner.status !== 'ACTIVE') {
      return NextResponse.json({ success: false, error: 'Link inactive' }, { status: 400 })
    }

    // Get visitor info from headers
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = req.headers.get('user-agent') || null

    // Parse UTM params from URL if present
    let utmSource: string | null = null
    let utmMedium: string | null = null
    let utmCampaign: string | null = null

    if (url) {
      try {
        const urlObj = new URL(url)
        utmSource = urlObj.searchParams.get('utm_source')
        utmMedium = urlObj.searchParams.get('utm_medium')
        utmCampaign = urlObj.searchParams.get('utm_campaign')
      } catch {
        // Ignore URL parsing errors
      }
    }

    // Record the click
    await prisma.$transaction(async (tx) => {
      // Create click record
      await tx.affiliateClick.create({
        data: {
          linkId: link!.id,
          ipAddress,
          userAgent,
          referrer: referrer || null,
          utmSource,
          utmMedium,
          utmCampaign,
          sessionId: sessionId || null,
        },
      })

      // Update link stats
      await tx.affiliateLink.update({
        where: { id: link!.id },
        data: {
          totalClicks: { increment: 1 },
        },
      })
    })

    return NextResponse.json({ success: true, tracked: true })
  } catch (error) {
    console.error('Error tracking affiliate click:', error)
    // Don't return error status - we don't want to affect user experience
    return NextResponse.json({ success: false })
  }
}
