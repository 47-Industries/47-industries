const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'mysql://root:IoOlsZtgeKEPyMcMVPcyAlASLinJYgTq@shuttle.proxy.rlwy.net:11561/railway'
    }
  }
});

async function main() {
  // List all categories
  console.log('=== CATEGORIES ===');
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
      parent: true
    },
    orderBy: { name: 'asc' }
  });
  categories.forEach(c => console.log(`${c.name}: ${c._count.products} products`));

  // List all products with their categories
  console.log('\n=== PRODUCTS ===');
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: 'asc' }
  });
  products.forEach(p => console.log(`${p.name} -> ${p.category.name}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
