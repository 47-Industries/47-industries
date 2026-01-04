/**
 * Seed script for AI Automation products
 * Creates RingZero ServiceProject and updates AI automation service packages
 *
 * Run with: npx tsx scripts/seed-ai-automation.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding AI Automation products...\n')

  // ============================================
  // 1. Create RingZero ServiceProject
  // ============================================
  console.log('Creating RingZero ServiceProject...')

  const ringZeroData = {
    title: 'RingZero',
    slug: 'ringzero',
    category: 'AI_AUTOMATION' as const,
    categories: ['AI_AUTOMATION'],
    clientName: '47 Industries',
    clientLogo: null,
    description:
      'AI receptionist that answers every call 24/7, captures leads, books appointments, and texts you instantly. Never miss another customer. Sounds natural, works perfectly, costs a fraction of a human receptionist.',
    challenge:
      'Home service businesses miss 30-50% of incoming calls. Customers who reach voicemail rarely leave messages, and 85% never call back. This means thousands of dollars in lost revenue every month.',
    solution:
      'RingZero uses advanced AI voice technology to answer every call in under a second. It sounds like a real person, captures lead information, books appointments directly to your calendar, and sends you instant SMS/email alerts.',
    results:
      '99.7% of calls captured, 24/7 availability with no holidays or sick days, real-time appointment booking, and instant lead notifications. Most clients see ROI within the first week.',
    thumbnailUrl: null,
    images: null,
    videoUrl: null,
    liveUrl: 'tel:+14159694084', // Demo phone number
    accentColor: '#00d4ff', // Cyan accent
    technologies: ['Vapi', 'Claude AI', 'Atlas AI', 'Google Calendar', 'Zapier', 'Twilio'],
    testimonial: null,
    testimonialAuthor: null,
    testimonialRole: null,
    isFeatured: true,
    showInNavbar: false,
    isActive: true,
    sortOrder: 0,
  }

  const existingRingZero = await prisma.serviceProject.findUnique({
    where: { slug: 'ringzero' },
  })

  if (existingRingZero) {
    await prisma.serviceProject.update({
      where: { slug: 'ringzero' },
      data: ringZeroData,
    })
    console.log('  Updated existing RingZero project')
  } else {
    await prisma.serviceProject.create({
      data: ringZeroData,
    })
    console.log('  Created new RingZero project')
  }

  // ============================================
  // 2. Update/Create LeadChopper ServiceProject (if needed)
  // ============================================
  console.log('\nVerifying LeadChopper ServiceProject...')

  const existingLeadChopper = await prisma.serviceProject.findUnique({
    where: { slug: 'leadchopper' },
  })

  if (existingLeadChopper) {
    console.log('  LeadChopper project exists')
  } else {
    await prisma.serviceProject.create({
      data: {
        title: 'LeadChopper',
        slug: 'leadchopper',
        category: 'AI_AUTOMATION',
        categories: ['AI_AUTOMATION'],
        clientName: '47 Industries',
        description:
          'AI-powered B2B lead generation and multi-channel outreach automation. Find leads, personalize messages with AI, and reach prospects via email, SMS, or Instagram.',
        accentColor: '#f97316', // Orange
        technologies: ['Claude AI', 'Puppeteer', 'Node.js', 'PostgreSQL', 'Twilio', 'Instagram API'],
        isFeatured: true,
        isActive: true,
        liveUrl: 'https://leadchopper.app',
        sortOrder: 1,
      },
    })
    console.log('  Created LeadChopper project')
  }

  // ============================================
  // 3. Delete old AI automation packages
  // ============================================
  console.log('\nRemoving old AI automation packages...')

  const deletedCount = await prisma.servicePackage.deleteMany({
    where: { category: 'AI_AUTOMATION' },
  })
  console.log(`  Deleted ${deletedCount.count} old packages`)

  // ============================================
  // 4. Create new AI automation packages
  // ============================================
  console.log('\nCreating new AI automation packages...')

  // Package 1: LeadChopper (affordable option)
  await prisma.servicePackage.create({
    data: {
      name: 'LeadChopper',
      slug: 'leadchopper-marketing',
      category: 'AI_AUTOMATION',
      price: 300,
      priceDisplay: '$300',
      billingType: 'monthly',
      priceNote: 'Cancel anytime',
      shortDesc: 'AI-powered lead generation and outreach automation',
      description:
        'Find qualified leads automatically, generate AI-personalized messages, and reach prospects via email, SMS, or Instagram. Full autopilot mode runs 24/7.',
      features: [
        'Automated lead discovery',
        'AI-powered personalization',
        'Multi-channel outreach (Email, SMS, Instagram)',
        'Unified inbox for all replies',
        'Autopilot prospecting mode',
        'Full data ownership',
        'AES-256 encryption',
      ],
      platforms: ['Web'],
      techStack: ['Claude AI', 'Node.js', 'PostgreSQL'],
      integrations: ['Email', 'SMS', 'Instagram'],
      deliverables: ['Lead database', 'Campaign analytics', 'Reply tracking'],
      supportIncluded: 'Email support',
      isPopular: false,
      isActive: true,
      sortOrder: 0,
      badge: null,
      estimatedDays: null,
      estimatedWeeks: null,
    },
  })
  console.log('  Created LeadChopper package')

  // Package 2: RingZero (premium option)
  await prisma.servicePackage.create({
    data: {
      name: 'RingZero',
      slug: 'ringzero-receptionist',
      category: 'AI_AUTOMATION',
      price: 497,
      priceDisplay: '$497',
      billingType: 'monthly',
      priceNote: 'Unlimited calls included',
      shortDesc: 'AI receptionist that never misses a call',
      description:
        'Enterprise-grade AI voice technology answers every call in under a second. Captures leads, books appointments, sends instant alerts, and sounds completely natural.',
      features: [
        'Instant call answering (<1 second)',
        'Natural AI voice conversations',
        'Lead capture with instant alerts',
        'Real-time appointment booking',
        'Call recordings & transcripts',
        'Google Calendar integration',
        'CRM + Zapier connections',
        '24/7/365 availability',
      ],
      platforms: ['Phone', 'Web Dashboard'],
      techStack: ['Vapi', 'Claude AI', 'Atlas AI'],
      integrations: ['Google Calendar', 'Calendly', 'SMS', 'Email', 'Zapier', 'Webhooks', 'CRM'],
      deliverables: ['Custom AI voice setup', 'Phone number', 'Dashboard access', 'Integration setup'],
      supportIncluded: 'Priority support',
      isPopular: true,
      isActive: true,
      sortOrder: 1,
      badge: 'MOST POPULAR',
      estimatedDays: 3,
      estimatedWeeks: null,
    },
  })
  console.log('  Created RingZero package')

  // Package 3: Enterprise (custom quote)
  await prisma.servicePackage.create({
    data: {
      name: 'Enterprise',
      slug: 'ai-enterprise',
      category: 'AI_AUTOMATION',
      price: null,
      priceDisplay: 'Custom',
      billingType: 'monthly',
      priceNote: 'Contact for pricing',
      shortDesc: 'Custom AI solutions for large organizations',
      description:
        'Full-service AI automation built for your specific needs. Multiple AI agents, custom integrations, dedicated support, and white-glove onboarding.',
      features: [
        'Multiple AI receptionist lines',
        'Custom AI voice training',
        'Advanced CRM integrations',
        'Custom workflow automation',
        'Dedicated account manager',
        'SLA guarantees',
        'White-label options',
        'On-premise deployment available',
      ],
      platforms: ['Phone', 'Web', 'Mobile'],
      techStack: ['Custom Stack'],
      integrations: ['Any CRM', 'Custom APIs', 'Enterprise Systems'],
      deliverables: ['Full implementation', 'Training', 'Documentation', 'Ongoing optimization'],
      supportIncluded: 'Dedicated support team',
      isPopular: false,
      isActive: true,
      sortOrder: 2,
      badge: 'ENTERPRISE',
      estimatedDays: null,
      estimatedWeeks: 2,
    },
  })
  console.log('  Created Enterprise package')

  console.log('\nAI Automation seeding complete!')
}

main()
  .catch((e) => {
    console.error('Error seeding AI automation:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
