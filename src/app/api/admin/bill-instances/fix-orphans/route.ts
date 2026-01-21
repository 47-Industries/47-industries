import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkExpensePermission } from '@/lib/expense-permissions'

// POST /api/admin/bill-instances/fix-orphans - Link orphan bills to matching recurring templates
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const permission = await checkExpensePermission()
  if (!permission.canAccess) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    // Get all active recurring bills
    const recurringBills = await prisma.recurringBill.findMany({
      where: { active: true }
    })

    if (recurringBills.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No recurring bills found',
        linked: 0
      })
    }

    // Get all bill instances without a recurring bill link
    const orphanBills = await prisma.billInstance.findMany({
      where: { recurringBillId: null }
    })

    let linked = 0
    const linkedBills: { id: string; vendor: string; linkedTo: string }[] = []

    for (const bill of orphanBills) {
      const vendorLower = bill.vendor.toLowerCase()
      const vendorFirstWord = vendorLower.split(' ')[0]

      // Find matching recurring bill
      const matchingRecurring = recurringBills.find(r => {
        const rVendorLower = r.vendor.toLowerCase()
        const rNameLower = r.name.toLowerCase()

        // Check if vendor first word matches
        return rVendorLower.includes(vendorFirstWord) ||
               rNameLower.includes(vendorFirstWord) ||
               vendorLower.includes(rVendorLower.split(' ')[0]) ||
               vendorLower.includes(rNameLower.split(' ')[0])
      })

      if (matchingRecurring) {
        await prisma.billInstance.update({
          where: { id: bill.id },
          data: { recurringBillId: matchingRecurring.id }
        })
        linked++
        linkedBills.push({
          id: bill.id,
          vendor: bill.vendor,
          linkedTo: matchingRecurring.name
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Linked ${linked} orphan bill(s) to recurring templates`,
      linked,
      linkedBills
    })
  } catch (error: any) {
    console.error('[FIX ORPHANS] Error:', error.message)
    return NextResponse.json({ error: 'Failed to fix orphan bills: ' + error.message }, { status: 500 })
  }
}
