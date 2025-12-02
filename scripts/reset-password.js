const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function resetPassword() {
  const prisma = new PrismaClient();

  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.log('Usage: node scripts/reset-password.js <email> <newPassword>');
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

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  console.log('New hash:', hashedPassword);

  // Update the user
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  console.log('Password updated successfully!');

  // Verify it works
  const verify = await bcrypt.compare(newPassword, hashedPassword);
  console.log('Verification:', verify ? 'SUCCESS' : 'FAILED');

  await prisma.$disconnect();
}

resetPassword();
