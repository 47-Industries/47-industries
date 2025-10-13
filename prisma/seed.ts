import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  // Create admin user if doesn't exist
  const adminEmail = 'admin@47industries.com'
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN',
      },
    })
    console.log('✅ Created admin user')
  } else {
    console.log('✅ Admin user already exists')
  }

  // Create categories
  const categories = [
    {
      name: '3D Printed Products',
      slug: '3d-printed-products',
      description: 'High-quality 3D printed items',
    },
    {
      name: 'Home & Office',
      slug: 'home-office',
      description: 'Practical items for home and office use',
    },
    {
      name: 'Tech Accessories',
      slug: 'tech-accessories',
      description: 'Phone stands, cable organizers, and more',
    },
    {
      name: 'Toys & Games',
      slug: 'toys-games',
      description: 'Fun 3D printed toys and game accessories',
    },
    {
      name: 'Art & Decor',
      slug: 'art-decor',
      description: 'Decorative items and art pieces',
    },
  ]

  for (const cat of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    })

    if (!existing) {
      await prisma.category.create({
        data: cat,
      })
      console.log(`✅ Created category: ${cat.name}`)
    } else {
      console.log(`✅ Category already exists: ${cat.name}`)
    }
  }

  console.log('✅ Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
