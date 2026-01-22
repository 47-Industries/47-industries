import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getAffiliateUrl,
  AFFILIATE_COOKIE_NAME,
  AFFILIATE_SESSION_COOKIE_NAME,
  AFFILIATE_COOKIE_EXPIRY_DAYS,
  generateAffiliateSessionId,
} from '@/lib/affiliate-utils'

// GET /api/affiliate/track?code=ABC123
// Called when someone visits an affiliate link
// 1. Record AffiliateClick
// 2. Set cookie with code + session for conversion attribution
// 3. Redirect to target URL
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const sessionParam = searchParams.get('session')

    if (!code) {
      return NextResponse.redirect(
        new URL('/shop', process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com')
      )
    }

    // Find the affiliate link by code
    const link = await prisma.affiliateLink.findUnique({
      where: { code },
      include: {
        partner: {
          select: {
            id: true,
            affiliateCode: true,
            status: true,
          },
        },
      },
    })

    // Determine target URL
    let targetUrl: string

    if (!link || !link.isActive || link.partner.status !== 'ACTIVE') {
      // Link not found or inactive - redirect to shop without affiliate tracking
      targetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'}/shop`
      return NextResponse.redirect(targetUrl)
    }

    // Build target URL based on link settings
    if (link.customUrl) {
      targetUrl = link.customUrl
    } else if (link.platform === 'MOTOREV') {
      targetUrl = `https://motorevapp.com/signup?ref=${link.partner.affiliateCode || code}`
    } else {
      // Shop
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'
      if (link.targetType === 'PRODUCT' && link.targetId) {
        targetUrl = `${baseUrl}/shop/${link.targetId}`
      } else if (link.targetType === 'CATEGORY' && link.targetId) {
        targetUrl = `${baseUrl}/shop?category=${link.targetId}`
      } else {
        targetUrl = `${baseUrl}/shop`
      }
    }

    // Get visitor info
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = req.headers.get('user-agent') || null
    const referrer = req.headers.get('referer') || null

    // Get UTM params
    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')

    // Generate or use existing session ID
    const sessionId = sessionParam || generateAffiliateSessionId()

    // Record the click
    await prisma.$transaction(async (tx) => {
      // Create click record
      await tx.affiliateClick.create({
        data: {
          linkId: link.id,
          ipAddress,
          userAgent,
          referrer,
          utmSource,
          utmMedium,
          utmCampaign,
          sessionId,
        },
      })

      // Update link stats
      await tx.affiliateLink.update({
        where: { id: link.id },
        data: {
          totalClicks: { increment: 1 },
        },
      })
    })

    // Set cookies for conversion tracking
    const response = NextResponse.redirect(targetUrl)

    // Set affiliate code cookie
    response.cookies.set(AFFILIATE_COOKIE_NAME, link.partner.affiliateCode || code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AFFILIATE_COOKIE_EXPIRY_DAYS * 24 * 60 * 60, // 30 days in seconds
      path: '/',
    })

    // Set session cookie for click-to-conversion correlation
    response.cookies.set(AFFILIATE_SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AFFILIATE_COOKIE_EXPIRY_DAYS * 24 * 60 * 60,
      path: '/',
    })

    // Also set a non-httpOnly cookie for client-side access (optional)
    response.cookies.set('affiliate_ref', link.partner.affiliateCode || code, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: AFFILIATE_COOKIE_EXPIRY_DAYS * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error tracking affiliate click:', error)
    // On error, redirect to shop without tracking
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'}/shop`
    )
  }
}
