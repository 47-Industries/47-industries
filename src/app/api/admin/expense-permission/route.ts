import { NextResponse } from 'next/server'
import { checkExpensePermission } from '@/lib/expense-permissions'

export async function GET() {
  const permission = await checkExpensePermission()
  return NextResponse.json(permission)
}
