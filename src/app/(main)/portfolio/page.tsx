import { prisma } from '@/lib/prisma'
import PortfolioClient from './PortfolioClient'

// Force dynamic rendering - database not available at build time
export const dynamic = 'force-dynamic'

export default async function PortfolioPage() {
  // Fetch all active projects
  const projects = await prisma.serviceProject.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
  })

  // Get unique categories for filtering
  const allCategories = new Set<string>()
  projects.forEach(project => {
    allCategories.add(project.category)
    const cats = project.categories as string[] | null
    if (cats) {
      cats.forEach(cat => allCategories.add(cat))
    }
  })

  // Serialize for client component
  const serializedProjects = projects.map(project => ({
    id: project.id,
    title: project.title,
    slug: project.slug,
    category: project.category,
    categories: (project.categories as string[]) || [],
    clientName: project.clientName,
    description: project.description,
    thumbnailUrl: project.thumbnailUrl,
    liveUrl: project.liveUrl,
    isFeatured: project.isFeatured,
    accentColor: project.accentColor,
  }))

  return (
    <PortfolioClient
      projects={serializedProjects}
      categories={Array.from(allCategories)}
    />
  )
}

export const metadata = {
  title: 'Portfolio - 47 Industries',
  description: 'Explore our complete portfolio of web development, mobile apps, and software projects.',
}
