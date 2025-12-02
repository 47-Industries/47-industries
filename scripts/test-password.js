const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();

  const user = await prisma.user.findFirst({
    where: { email: 'deansabrwork@gmail.com' }
  });

  if (!user || !user.password) {
    console.log('User not found or no password');
    await prisma.$disconnect();
    return;
  }

  console.log('Stored hash:', user.password);

  // Try different passwords
  const passwords = ['DeanSaber123', 'Dean Saber', 'dean saber', 'these nuts one two three.', 'Dthese nuts one two three.'];

  for (const pwd of passwords) {
    const match = await bcrypt.compare(pwd, user.password);
    console.log(`Password "${pwd}":`, match ? 'MATCHES' : 'does not match');
  }

  await prisma.$disconnect();
}

test();
