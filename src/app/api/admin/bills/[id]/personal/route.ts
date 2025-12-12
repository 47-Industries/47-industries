import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// POST /api/admin/bills/[id]/personal - Mark a bill as personal (not company) and block future similar bills
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Get the bill
    const bill = await prisma.bill.findUnique({
      where: { id }
    })

    if (!bill) {
      return NextResponse.json({ error: 'Bill not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const blockType = body.blockType || 'vendor' // vendor, sender, or subject

    // Determine what pattern to block based on blockType
    let pattern: string
    let patternType: string

    switch (blockType) {
      case 'sender':
        pattern = bill.emailFrom || bill.vendor
        patternType = 'sender'
        break
      case 'subject':
        // Extract key part of subject to block similar emails
        pattern = bill.emailSubject?.split(' ').slice(0, 4).join(' ') || bill.vendor
        patternType = 'subject'
        break
      case 'vendor':
      default:
        pattern = bill.vendor
        patternType = 'vendor'
        break
    }

    // Create blocked sender entry (upsert to avoid duplicates)
    await prisma.blockedBillSender.upsert({
      where: {
        pattern_patternType: {
          pattern: pattern.toLowerCase(),
          patternType
        }
      },
      update: {
        reason: body.reason || `Marked as personal from bill: ${bill.vendor}`,
        blockedBillId: bill.id
      },
      create: {
        pattern: pattern.toLowerCase(),
        patternType,
        reason: body.reason || `Marked as personal from bill: ${bill.vendor}`,
        blockedBillId: bill.id
      }
    })

    // Delete the bill and its payments
    await prisma.billPayment.deleteMany({
      where: { billId: bill.id }
    })

    await prisma.bill.delete({
      where: { id: bill.id }
    })

    return NextResponse.json({
      success: true,
      message: `Bill removed and "${pattern}" added to blocked list`,
      blocked: {
        pattern,
        patternType,
        reason: body.reason || 'Marked as personal'
      }
    })
  } catch (error: any) {
    console.error('Error marking bill as personal:', error)
    return NextResponse.json({ error: 'Failed to mark bill as personal' }, { status: 500 })
  }
}
