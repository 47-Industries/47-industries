import Link from 'next/link'
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
      take: 6,
    }),
  ])

  // Serialize Decimal fields
  const serializedPackages = packages.map(pkg => ({
    ...pkg,
    price: pkg.price ? Number(pkg.price) : null,
    createdAt: pkg.createdAt.toISOString(),
    updatedAt: pkg.updatedAt.toISOString(),
  }))

  const serializedProjects = projects.map(project => ({
    ...project,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }))

  return <ServicesClient packages={serializedPackages} projects={serializedProjects} />
}

export const metadata = {
  title: 'Services - 47 Industries',
  description: 'Web development, mobile apps, and custom software solutions. View our service packages and portfolio.',
}
