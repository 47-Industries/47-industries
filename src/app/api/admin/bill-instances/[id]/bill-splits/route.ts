import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAdminAuth } from '@/lib/auth-helper'

// GET /api/admin/bill-instances/[id]/bill-splits - Get all bill splits for a bill
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const splits = await prisma.billSplit.findMany({
      where: { billInstanceId: id },
      include: {
        teamMember: {
          select: { id: true, name: true, email: true, profileImageUrl: true }
        }
      }
    })

    return NextResponse.json({ splits })
  } catch (error: any) {
    console.error('Error fetching bill splits:', error)
    return NextResponse.json({ error: 'Failed to fetch bill splits' }, { status: 500 })
  }
}

// POST /api/admin/bill-instances/[id]/bill-splits - Update a team member's split (status, amount)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAuthorized = await verifyAdminAuth(request)
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params // billInstanceId

  try {
    const body = await request.json()
    const { teamMemberId, status, paidDate, amount, splitPercent } = body

    if (!teamMemberId) {
      return NextResponse.json({ error: 'teamMemberId is required' }, { status: 400 })
    }

    // Get the bill instance to calculate split amount if needed
    const billInstance = await prisma.billInstance.findUnique({
      where: { id },
      include: { billSplits: true }
    })

    if (!billInstance) {
      return NextResponse.json({ error: 'Bill instance not found' }, { status: 404 })
    }

    // Calculate split amount (equal split if not existing)
    const existingSplit = billInstance.billSplits.find(s => s.teamMemberId === teamMemberId)
    const splitCount = billInstance.billSplits.length || 1
    const defaultAmount = Number(billInstance.amount) / splitCount

    // Determine the amount to use
    const splitAmount = amount !== undefined ? parseFloat(amount) : (existingSplit?.amount || defaultAmount)
    const percent = splitPercent !== undefined ? parseFloat(splitPercent) : existingSplit?.splitPercent

    // Update or create the bill split
    const split = await prisma.billSplit.upsert({
      where: {
        billInstanceId_teamMemberId: {
          billInstanceId: id,
          teamMemberId
        }
      },
      update: {
        status: status || existingSplit?.status || 'PENDING',
        paidDate: status === 'PAID' ? (paidDate ? new Date(paidDate) : new Date()) : (status === 'PENDING' ? null : undefined),
        amount: splitAmount,
        splitPercent: percent
      },
      create: {
        billInstanceId: id,
        teamMemberId,
        amount: splitAmount,
        splitPercent: percent,
        status: status || 'PENDING',
        paidDate: status === 'PAID' ? (paidDate ? new Date(paidDate) : new Date()) : null
      },
      include: {
        teamMember: {
          select: { id: true, name: true, email: true, profileImageUrl: true }
        }
      }
    })

    // Check if all bill splits are now paid
    const updatedBillInstance = await prisma.billInstance.findUnique({
      where: { id },
      include: { billSplits: true }
    })

    if (updatedBillInstance && updatedBillInstance.billSplits.length > 0) {
      const allPaid = updatedBillInstance.billSplits.every(s => s.status === 'PAID')

      // If all team members have paid, mark the bill instance as PAID
      if (allPaid && updatedBillInstance.status !== 'PAID') {
        await prisma.billInstance.update({
          where: { id },
          data: {
            status: 'PAID',
            paidDate: new Date()
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      split,
      message: `Payment marked as ${status || 'PAID'}`
    })
  } catch (error: any) {
    console.error('Error updating bill split:', error)
    return NextResponse.json({ error: 'Failed to update bill split' }, { status: 500 })
  }
}
