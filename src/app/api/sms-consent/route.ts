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

    const userAgent = request.headers.get('user-agent') || null

    // Store consent record in local database (for Twilio compliance)
    const consent = await prisma.smsConsent.create({
      data: {
        name,
        phone,
        email: email || null,
        ipAddress: ip,
        agreedAt: new Date(agreedAt),
        userAgent
      }
    })

    // Also send to bill-notifier service to add as recipient
    if (process.env.BILL_NOTIFIER_URL && process.env.BILL_NOTIFIER_API_KEY) {
      try {
        await fetch(`${process.env.BILL_NOTIFIER_URL}/api/recipients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.BILL_NOTIFIER_API_KEY
          },
          body: JSON.stringify({
            name,
            phone,
            email: email || null,
            ipAddress: ip,
            userAgent,
            agreedAt
          })
        })
      } catch (err) {
        // Log but don't fail - local record is the important one
        console.error('Failed to sync with bill-notifier:', err)
      }
    }

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
