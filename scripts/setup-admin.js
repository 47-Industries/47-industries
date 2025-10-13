// Quick admin setup script for Railway
// Run with: node scripts/setup-admin.js

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Setting up admin user...')

  try {
    // Find any admin user or create one
    let admin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    })

    const hashedPassword = await bcrypt.hash('Balance47420', 10)

    if (admin) {
      // Update existing admin
      await prisma.user.update({
        where: { id: admin.id },
        data: {
          username: '47industries',
          email: 'admin@47industries.com',
          name: '47 Industries',
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
      console.log('✅ Updated admin user')
    } else {
      // Create new admin
      await prisma.user.create({
        data: {
          username: '47industries',
          email: 'admin@47industries.com',
          name: '47 Industries',
          password: hashedPassword,
          role: 'ADMIN'
        }
      })
      console.log('✅ Created admin user')
    }

    console.log('\n✅ Admin credentials:')
    console.log('   Username: 47industries')
    console.log('   Email: admin@47industries.com')
    console.log('   Password: Balance47420')

  } catch (error) {
    console.error('❌ Error:', error.message)
    throw error
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
