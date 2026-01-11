import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/features'
import ServicesClient from './ServicesClient'

// Force dynamic rendering - database not available at build time
export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  // Check if services are enabled
  const webEnabled = await isFeatureEnabled('webDevServicesEnabled')
  const appEnabled = await isFeatureEnabled('appDevServicesEnabled')

  if (!webEnabled && !appEnabled) {
    notFound()
  }

  // Fetch packages and projects from database
  const [packages, projects] = await Promise.all([
    prisma.servicePackage.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    }),
    prisma.serviceProject.findMany({
      where: { isActive: true },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 8,
    }),
  ])

  // Serialize for client component
  const serializedPackages = packages.map(pkg => ({
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    category: pkg.category,
    price: pkg.price ? Number(pkg.price) : null,
    priceDisplay: pkg.priceDisplay,
    priceNote: pkg.priceNote,
    billingType: pkg.billingType,
    shortDesc: pkg.shortDesc,
    description: pkg.description,
    features: pkg.features,
    isPopular: pkg.isPopular,
    badge: pkg.badge,
    estimatedDays: pkg.estimatedDays,
    estimatedWeeks: pkg.estimatedWeeks,
  }))

  const serializedProjects = projects.map(project => ({
    id: project.id,
    title: project.title,
    slug: project.slug,
    category: project.category,
    clientName: project.clientName,
    thumbnailUrl: project.thumbnailUrl,
    isFeatured: project.isFeatured,
    accentColor: project.accentColor,
  }))

  return <ServicesClient packages={serializedPackages} projects={serializedProjects} />
}

export const metadata = {
  title: 'Services - 47 Industries',
  description: 'Web development, mobile apps, and custom software solutions. View our service packages and portfolio.',
}
