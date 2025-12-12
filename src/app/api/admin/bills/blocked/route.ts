import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/bills/blocked - List all blocked bill senders/patterns
export async function GET(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const blockedSenders = await prisma.blockedBillSender.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      blocked: blockedSenders,
      total: blockedSenders.length
    })
  } catch (error: any) {
    console.error('Error fetching blocked senders:', error)
    return NextResponse.json({ error: 'Failed to fetch blocked senders' }, { status: 500 })
  }
}

// POST /api/admin/bills/blocked - Manually add a blocked pattern
export async function POST(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { pattern, patternType = 'vendor', reason } = body

    if (!pattern) {
      return NextResponse.json({ error: 'Pattern is required' }, { status: 400 })
    }

    const blocked = await prisma.blockedBillSender.upsert({
      where: {
        pattern_patternType: {
          pattern: pattern.toLowerCase(),
          patternType
        }
      },
      update: { reason },
      create: {
        pattern: pattern.toLowerCase(),
        patternType,
        reason
      }
    })

    return NextResponse.json({
      success: true,
      blocked
    })
  } catch (error: any) {
    console.error('Error adding blocked sender:', error)
    return NextResponse.json({ error: 'Failed to add blocked sender' }, { status: 500 })
  }
}

// DELETE /api/admin/bills/blocked - Remove a blocked pattern
export async function DELETE(request: NextRequest) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.blockedBillSender.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Blocked pattern removed'
    })
  } catch (error: any) {
    console.error('Error removing blocked sender:', error)
    return NextResponse.json({ error: 'Failed to remove blocked sender' }, { status: 500 })
  }
}
