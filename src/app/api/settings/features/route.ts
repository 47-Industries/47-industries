import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Default feature settings
const DEFAULT_FEATURES = {
  shopEnabled: true,
  custom3DPrintingEnabled: true,
  webDevServicesEnabled: true,
  appDevServicesEnabled: true,
  motorevEnabled: true,
}

// GET /api/settings/features - Get feature toggle settings (public, cached)
export async function GET() {
  try {
    // Fetch settings and featured projects in parallel
    const [settings, featuredProjects] = await Promise.all([
      prisma.setting.findMany({
        where: {
          key: {
            in: [
              'shopEnabled',
              'custom3DPrintingEnabled',
              'webDevServicesEnabled',
              'appDevServicesEnabled',
              'motorevEnabled',
            ],
          },
        },
      }),
      prisma.serviceProject.findMany({
        where: {
          isFeatured: true,
          isActive: true,
        },
        select: {
          id: true,
          title: true,
          slug: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      }),
    ])

    // Start with defaults, override with database values
    const features: Record<string, boolean | { id: string; title: string; slug: string }[]> = { ...DEFAULT_FEATURES }

    settings.forEach((s) => {
      // Convert string 'true'/'false' to boolean
      features[s.key as keyof typeof DEFAULT_FEATURES] = s.value === 'true'
    })

    // Add featured projects to response
    features.featuredProjects = featuredProjects

    // Cache for 60 seconds to reduce database load
    return NextResponse.json(features, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error fetching feature settings:', error)
    // Return defaults on error
    return NextResponse.json({ ...DEFAULT_FEATURES, featuredProjects: [] })
  }
}
