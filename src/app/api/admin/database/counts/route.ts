import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [
      User,
      Account,
      Session,
      Product,
      Category,
      Order,
      OrderItem,
      CartItem,
      CustomRequest,
      ServiceInquiry,
      Review,
      DiscountCode,
      Address,
      Page,
      Media,
      Setting,
      PageView
    ] = await Promise.all([
      prisma.user.count(),
      prisma.account.count(),
      prisma.session.count(),
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.cartItem.count(),
      prisma.customRequest.count(),
      prisma.serviceInquiry.count(),
      prisma.review.count(),
      prisma.discountCode.count(),
      prisma.address.count(),
      prisma.page.count(),
      prisma.media.count(),
      prisma.setting.count(),
      prisma.pageView.count()
    ])

    return NextResponse.json({
      counts: {
        User,
        Account,
        Session,
        Product,
        Category,
        Order,
        OrderItem,
        CartItem,
        CustomRequest,
        ServiceInquiry,
        Review,
        DiscountCode,
        Address,
        Page,
        Media,
        Setting,
        PageView
      }
    })
  } catch (error) {
    console.error('Database count error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch counts' },
      { status: 500 }
    )
  }
}
