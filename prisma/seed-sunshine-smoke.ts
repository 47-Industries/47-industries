import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Adding Sunshine Smoke to portfolio...')

  // Create ServiceProject for Sunshine Smoke
  const project = await prisma.serviceProject.upsert({
    where: { slug: 'sunshine-smoke' },
    update: {
      title: 'Sunshine Smoke',
      category: 'WEB_APP',
      categories: ['WEB_APP', 'WEB_DEVELOPMENT'],
      clientName: 'Demo Project',
      description: `Full-stack e-commerce platform for a premium smoke shop with Point of Sale (POS) system, inventory management, and multi-location support.

This demo showcases a complete retail solution including:
• Customer-facing product catalog with category filtering
• Age verification system (21+)
• Multi-location store management (3 Tampa Bay locations)
• Administrative dashboard with full CRUD operations
• Real-time inventory tracking across locations
• Employee management with role-based access
• Modern dark UI with purple/gold branding`,
      challenge: `Build a comprehensive retail platform that handles both online e-commerce and in-store point of sale operations while maintaining real-time inventory sync across multiple store locations.`,
      solution: `Developed a Next.js 14 application with PostgreSQL database featuring:
• Prisma ORM for type-safe database operations
• Server-side rendering for fast page loads
• Responsive design optimized for all devices
• RESTful API architecture
• Secure authentication with role-based permissions
• Real-time inventory management with low-stock alerts`,
      results: `• Complete e-commerce storefront with product filtering
• Full admin dashboard for business operations
• POS-ready architecture for in-store sales
• Mobile-responsive design
• 3 store locations with unified inventory`,
      thumbnailUrl: 'https://images.pexels.com/photos/5533351/pexels-photo-5533351.jpeg?auto=compress&cs=tinysrgb&w=800',
      images: JSON.stringify([
        'https://images.pexels.com/photos/5533351/pexels-photo-5533351.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/1774954/pexels-photo-1774954.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/13328055/pexels-photo-13328055.jpeg?auto=compress&cs=tinysrgb&w=1200'
      ]),
      liveUrl: 'https://sunshinesmoke.47industries.com', // Update this with actual domain
      accentColor: '#9333ea', // Purple
      technologies: JSON.stringify([
        'Next.js 14',
        'TypeScript',
        'PostgreSQL',
        'Prisma',
        'Tailwind CSS',
        'Railway',
        'React'
      ]),
      isFeatured: true,
      showInNavbar: false,
      isActive: true,
      sortOrder: 1,
    },
    create: {
      title: 'Sunshine Smoke',
      slug: 'sunshine-smoke',
      category: 'WEB_APP',
      categories: ['WEB_APP', 'WEB_DEVELOPMENT'],
      clientName: 'Demo Project',
      description: `Full-stack e-commerce platform for a premium smoke shop with Point of Sale (POS) system, inventory management, and multi-location support.

This demo showcases a complete retail solution including:
• Customer-facing product catalog with category filtering
• Age verification system (21+)
• Multi-location store management (3 Tampa Bay locations)
• Administrative dashboard with full CRUD operations
• Real-time inventory tracking across locations
• Employee management with role-based access
• Modern dark UI with purple/gold branding`,
      challenge: `Build a comprehensive retail platform that handles both online e-commerce and in-store point of sale operations while maintaining real-time inventory sync across multiple store locations.`,
      solution: `Developed a Next.js 14 application with PostgreSQL database featuring:
• Prisma ORM for type-safe database operations
• Server-side rendering for fast page loads
• Responsive design optimized for all devices
• RESTful API architecture
• Secure authentication with role-based permissions
• Real-time inventory management with low-stock alerts`,
      results: `• Complete e-commerce storefront with product filtering
• Full admin dashboard for business operations
• POS-ready architecture for in-store sales
• Mobile-responsive design
• 3 store locations with unified inventory`,
      thumbnailUrl: 'https://images.pexels.com/photos/5533351/pexels-photo-5533351.jpeg?auto=compress&cs=tinysrgb&w=800',
      images: JSON.stringify([
        'https://images.pexels.com/photos/5533351/pexels-photo-5533351.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/1774954/pexels-photo-1774954.jpeg?auto=compress&cs=tinysrgb&w=1200',
        'https://images.pexels.com/photos/13328055/pexels-photo-13328055.jpeg?auto=compress&cs=tinysrgb&w=1200'
      ]),
      liveUrl: 'https://sunshinesmoke.47industries.com', // Update this with actual domain
      accentColor: '#9333ea', // Purple
      technologies: JSON.stringify([
        'Next.js 14',
        'TypeScript',
        'PostgreSQL',
        'Prisma',
        'Tailwind CSS',
        'Railway',
        'React'
      ]),
      isFeatured: true,
      showInNavbar: false,
      isActive: true,
      sortOrder: 1,
    },
  })

  console.log('Created/Updated ServiceProject:', project.title)
  console.log('')
  console.log('=== SUMMARY ===')
  console.log(`Project: ${project.title}`)
  console.log(`Slug: ${project.slug}`)
  console.log(`Live URL: ${project.liveUrl}`)
  console.log(`Featured: ${project.isFeatured}`)
  console.log('')
  console.log('View at:')
  console.log(`- Portfolio: https://47industries.com/portfolio`)
  console.log(`- Project Page: https://47industries.com/projects/${project.slug}`)
  console.log('')
  console.log('IMPORTANT: Update the liveUrl once you configure the custom domain!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
