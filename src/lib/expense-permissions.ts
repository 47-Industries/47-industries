import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export interface ExpensePermissionResult {
  canAccess: boolean
  userId: string | null
  teamMemberId: string | null
  reason: string
}

/**
 * Check if the current user can access expense management
 *
 * Rules:
 * - SUPER_ADMIN always has access
 * - Other users need splitsExpenses=true on their TeamMember record
 */
export async function checkExpensePermission(): Promise<ExpensePermissionResult> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return {
        canAccess: false,
        userId: null,
        teamMemberId: null,
        reason: 'Not authenticated'
      }
    }

    const userId = session.user.id
    const userRole = (session.user as any).role

    // SUPER_ADMIN always has access
    if (userRole === 'SUPER_ADMIN') {
      // Still try to get their TeamMember for tracking purposes
      const teamMember = await prisma.teamMember.findUnique({
        where: { userId },
        select: { id: true }
      })

      return {
        canAccess: true,
        userId,
        teamMemberId: teamMember?.id || null,
        reason: 'Super Admin access'
      }
    }

    // For other roles, check TeamMember.splitsExpenses
    const teamMember = await prisma.teamMember.findUnique({
      where: { userId },
      select: {
        id: true,
        splitsExpenses: true,
        name: true
      }
    })

    if (!teamMember) {
      return {
        canAccess: false,
        userId,
        teamMemberId: null,
        reason: 'No team member record found'
      }
    }

    if (!teamMember.splitsExpenses) {
      return {
        canAccess: false,
        userId,
        teamMemberId: teamMember.id,
        reason: 'Not configured to split expenses'
      }
    }

    return {
      canAccess: true,
      userId,
      teamMemberId: teamMember.id,
      reason: 'Splits expenses'
    }
  } catch (error: any) {
    console.error('[EXPENSE_PERMISSION] Error checking permission:', error.message)
    return {
      canAccess: false,
      userId: null,
      teamMemberId: null,
      reason: `Error: ${error.message}`
    }
  }
}

/**
 * Client-side helper to fetch expense permission
 */
export async function fetchExpensePermission(): Promise<ExpensePermissionResult> {
  try {
    const response = await fetch('/api/admin/expense-permission')
    if (!response.ok) {
      return {
        canAccess: false,
        userId: null,
        teamMemberId: null,
        reason: 'Failed to fetch permission'
      }
    }
    return response.json()
  } catch (error: any) {
    return {
      canAccess: false,
      userId: null,
      teamMemberId: null,
      reason: `Error: ${error.message}`
    }
  }
}
