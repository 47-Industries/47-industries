const { PrismaClient } = require('@prisma/client');

async function setUsername() {
  const prisma = new PrismaClient();

  const email = process.argv[2];
  const username = process.argv[3];

  if (!email || !username) {
    console.log('Usage: node scripts/set-username.js <email> <username>');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { email }
  });

  if (!user) {
    console.log('User not found:', email);
    await prisma.$disconnect();
    return;
  }

  console.log('Found user:', user.name, user.email);

  // Update the username
  await prisma.user.update({
    where: { id: user.id },
    data: { username }
  });

  console.log('Username set to:', username);

  await prisma.$disconnect();
}

setUsername();
