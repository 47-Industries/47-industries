const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:IoOlsZtgeKEPyMcMVPcyAlASLinJYgTq@shuttle.proxy.rlwy.net:11561/railway'
    }
  }
});

async function main() {
  // List all media
  console.log('=== MEDIA FILES ===');
  const media = await prisma.media.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' }
  });
  media.forEach(m => console.log(`${m.name}: ${m.url}`));

  // List all service projects
  console.log('\n=== SERVICE PROJECTS ===');
  const projects = await prisma.serviceProject.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  projects.forEach(p => console.log(`${p.title} | thumbnail: ${p.thumbnailUrl} | images: ${JSON.stringify(p.images)}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
