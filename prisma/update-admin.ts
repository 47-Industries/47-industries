import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Updating admin user...')

  // Find the existing admin user by email
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'admin@47industries.com' },
        { role: 'ADMIN' }
      ]
    },
  })

  if (existingAdmin) {
    // Update with new credentials
    const hashedPassword = await bcrypt.hash('Balance47420', 10)
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        username: '47industries',
        password: hashedPassword,
        email: 'admin@47industries.com',
        name: '47 Industries',
        role: 'ADMIN',
      },
    })
    console.log('✅ Updated admin user:')
    console.log('   Username: 47industries')
    console.log('   Password: Balance47420')
    console.log('   Email: admin@47industries.com')
  } else {
    // Create new admin user if none exists
    const hashedPassword = await bcrypt.hash('Balance47420', 10)
    await prisma.user.create({
      data: {
        username: '47industries',
        email: 'admin@47industries.com',
        name: '47 Industries',
        password: hashedPassword,
        role: 'ADMIN',
      },
    })
    console.log('✅ Created new admin user:')
    console.log('   Username: 47industries')
    console.log('   Password: Balance47420')
    console.log('   Email: admin@47industries.com')
  }

  console.log('\n✅ You can now login with either:')
  console.log('   - Username: 47industries')
  console.log('   - Email: admin@47industries.com')
  console.log('   - Password: Balance47420')
}

main()
  .catch((e) => {
    console.error('❌ Error updating admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
