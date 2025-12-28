import { prisma } from '@/lib/prisma'
import HomeClient from './HomeClient'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch featured products
  const featuredProducts = await prisma.product.findMany({
    where: {
      featured: true,
      active: true,
    },
    include: {
      category: true,
    },
    take: 4,
    orderBy: { createdAt: 'desc' },
  })

  // Fetch featured projects
  const featuredProjects = await prisma.serviceProject.findMany({
    where: {
      isFeatured: true,
      isActive: true,
    },
    take: 3,
    orderBy: { sortOrder: 'asc' },
  })

  // Serialize data
  const serializedProducts = featuredProducts.map(product => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDesc: product.shortDesc,
    price: product.price.toString(),
    comparePrice: product.comparePrice?.toString(),
    images: product.images as string[],
    categoryName: product.category.name,
  }))

  const serializedProjects = featuredProjects.map(project => ({
    id: project.id,
    title: project.title,
    slug: project.slug,
    category: project.category,
    description: project.description,
    thumbnailUrl: project.thumbnailUrl,
    liveUrl: project.liveUrl,
  }))

  return (
    <HomeClient
      featuredProducts={serializedProducts}
      featuredProjects={serializedProjects}
    />
  )
}

export const metadata = {
  title: '47 Industries - Advanced Manufacturing & Digital Innovation',
  description: 'Premium 3D printing, custom manufacturing, web development, and mobile app solutions. From prototypes to production.',
}
