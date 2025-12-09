import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, email, agreedAt } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone number are required' },
        { status: 400 }
      )
    }

    // Get IP address for record keeping
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Store consent record in database
    const consent = await prisma.smsConsent.create({
      data: {
        name,
        phone,
        email: email || null,
        ipAddress: ip,
        agreedAt: new Date(agreedAt),
        userAgent: request.headers.get('user-agent') || null
      }
    })

    return NextResponse.json({
      success: true,
      id: consent.id,
      message: 'Consent recorded successfully'
    })
  } catch (error) {
    console.error('SMS consent error:', error)
    return NextResponse.json(
      { error: 'Failed to record consent' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve consent records (admin only)
export async function GET(request: NextRequest) {
  try {
    const consents = await prisma.smsConsent.findMany({
      orderBy: { agreedAt: 'desc' }
    })

    return NextResponse.json({ consents })
  } catch (error) {
    console.error('Error fetching consents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consent records' },
      { status: 500 }
    )
  }
}
