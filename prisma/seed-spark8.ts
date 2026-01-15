import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating Spark8 client and invoice...')

  // Generate inquiry number
  const date = new Date()
  const timestamp = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  const count = await prisma.serviceInquiry.count()
  const inquiryNumber = `SVC-${timestamp}-${(count + 1).toString().padStart(4, '0')}`

  // Create Service Inquiry for Spark8
  const inquiry = await prisma.serviceInquiry.upsert({
    where: { inquiryNumber: 'SVC-SPARK8-001' },
    update: {},
    create: {
      inquiryNumber: 'SVC-SPARK8-001',
      name: 'Spark8 Smoke Shop',
      email: 'spark8smokeshop@gmail.com', // Update with actual email
      phone: '', // Update with actual phone
      company: 'Spark8 Smoke Shop & Hookah Lounge',
      website: 'https://vape-shop-production.up.railway.app',
      serviceType: 'WEB_DEVELOPMENT',
      budget: '5K_15K',
      timeline: '2_3_MONTHS',
      description: `Full-stack platform development for Spark8 Smoke Shop & Hookah Lounge:

SCOPE OF WORK:
1. Customer-Facing Website
   - E-commerce functionality with product catalog
   - Age verification (21+)
   - Multi-location support (Clearwater & St. Petersburg)
   - Deals/promotions section
   - Gopuff delivery integration

2. Administrative Dashboard
   - Product management (CRUD)
   - Inventory tracking across locations
   - Order management
   - Customer management
   - Employee administration
   - Reporting & analytics

3. Point of Sale (POS) System
   - Register functionality
   - Clover payment integration
   - Real-time inventory sync
   - Receipt generation
   - Daily sales reporting

4. Additional Features
   - Rewards/loyalty program
   - Delivery operations management
   - Multi-user authentication

CONTRACT TERMS:
- Platform Development: $5,000
- Monthly Maintenance: $100/month
- Future updates to be renegotiated`,
      status: 'IN_PROGRESS',
      estimatedCost: 5000,
      adminNotes: 'Contract signed January 2026. Initial payment of $2,500 due upon signing.',
    },
  })

  console.log('Created inquiry:', inquiry.inquiryNumber)

  // Generate invoice number
  const invoiceCount = await prisma.invoice.count()
  const invoiceNumber = `INV-${timestamp}-${(invoiceCount + 1).toString().padStart(4, '0')}`

  // Create Invoice for initial 50% payment
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      inquiryId: inquiry.id,
      customerName: 'Spark8 Smoke Shop',
      customerEmail: 'spark8smokeshop@gmail.com', // Update with actual email
      customerCompany: 'Spark8 Smoke Shop & Hookah Lounge',
      customerPhone: '',
      subtotal: 2500,
      taxRate: 0,
      taxAmount: 0,
      total: 2500,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      notes: 'Initial payment (50%) for Spark8 platform development per signed service agreement dated January 12, 2026.',
      internalNotes: 'Contract total: $5,000. This is the first of two payments. Second payment due upon delivery.',
      status: 'SENT',
      sentAt: new Date(),
      createdBy: 'cmii0fqaj0000rx3m7wozbcjf', // Kyle Rivers
      items: {
        create: [
          {
            description: 'Spark8 Platform Development - Initial Payment (50%)',
            quantity: 1,
            unitPrice: 2500,
            total: 2500,
          },
        ],
      },
    },
    include: {
      items: true,
    },
  })

  console.log('Created invoice:', invoice.invoiceNumber)
  console.log('')
  console.log('=== SUMMARY ===')
  console.log(`Client: Spark8 Smoke Shop`)
  console.log(`Inquiry #: ${inquiry.inquiryNumber}`)
  console.log(`Invoice #: ${invoice.invoiceNumber}`)
  console.log(`Invoice Amount: $${invoice.total}`)
  console.log(`Invoice Status: ${invoice.status}`)
  console.log('')
  console.log('View in admin:')
  console.log(`- Inquiry: https://47industries.com/admin/inquiries/${inquiry.id}`)
  console.log(`- Invoice: https://47industries.com/invoice/${invoice.invoiceNumber}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
