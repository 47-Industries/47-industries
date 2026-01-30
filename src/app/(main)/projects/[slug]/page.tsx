import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import ScreenshotGallery from '@/components/projects/ScreenshotGallery'
import ImageLightbox from '@/components/projects/ImageLightbox'
import { BRANDS, BRAND_SLUG_MAP } from '@/config/brands'

// Force dynamic rendering - always fetch fresh data from database
export const dynamic = 'force-dynamic'
export const revalidate = 0

const CATEGORY_LABELS: Record<string, string> = {
  WEB_DEVELOPMENT: 'Web Development',
  WEB_APP: 'Web Application',
  IOS_APP: 'iOS App',
  ANDROID_APP: 'Android App',
  CROSS_PLATFORM_APP: 'Cross-Platform App',
  AI_AUTOMATION: 'AI Automation',
  DESKTOP_APP: 'Desktop App',
  THREE_D_PRINTING: '3D Printing',
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const project = await prisma.serviceProject.findUnique({
    where: { slug },
    select: { title: true, description: true },
  })

  if (!project) {
    return { title: 'Project Not Found - 47 Industries' }
  }

  return {
    title: `${project.title} - 47 Industries`,
    description: project.description?.slice(0, 160),
  }
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params

  const project = await prisma.serviceProject.findUnique({
    where: { slug },
    include: {
      products: {
        where: { active: true },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          images: true,
          brand: true,
        },
        take: 4,
        orderBy: { featured: 'desc' },
      },
    },
  })

  if (!project || !project.isActive) {
    notFound()
  }

  const linkedProducts = project.products || []

  const technologies = (project.technologies as string[]) || []
  const categories = (project.categories as string[]) || []

  // Handle both old string format and new object format for images
  interface ProjectImage {
    url: string
    type: 'mobile' | 'desktop'
  }
  const rawImages = (project.images as (string | ProjectImage)[]) || []
  const images: ProjectImage[] = rawImages.map(img => {
    if (typeof img === 'string') {
      return { url: img, type: 'mobile' as const }
    }
    return img
  })

  // Use categories array if available, otherwise fall back to single category
  const displayCategories = categories.length > 0 ? categories : [project.category]

  return (
    <div className="min-h-screen">
      {/* Hero Section - Text + Image side by side */}
      <div className="pt-20 pb-12 md:pt-24 md:pb-16">
        <div className="container mx-auto px-4 md:px-6">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link href="/services" className="text-sm text-text-secondary hover:text-accent transition-colors">
              ← Back to Services
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left: Hero Image */}
            {project.thumbnailUrl && (
              <div className="order-2 lg:order-1">
                <div className="rounded-xl overflow-hidden bg-surface inline-block">
                  <ImageLightbox
                    src={project.thumbnailUrl}
                    alt={project.title}
                    className="w-auto h-auto max-w-full max-h-[450px] object-contain"
                  />
                </div>
              </div>
            )}

            {/* Right: Text Content */}
            <div className={`order-1 lg:order-2 ${!project.thumbnailUrl ? 'lg:col-span-2 max-w-2xl' : ''}`}>
              {/* Category tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {displayCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-block px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full"
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">{project.title}</h1>

              {/* Client info with optional logo */}
              <div className="flex items-center gap-4 mb-6">
                {project.clientLogo && (
                  <img
                    src={project.clientLogo}
                    alt={project.clientName}
                    className="h-14 w-auto object-contain"
                  />
                )}
                <p className="text-lg text-text-secondary">{project.clientName}</p>
              </div>

              {/* Quick description */}
              <p className="text-text-secondary mb-6">
                {project.description}
              </p>

              {/* Tech tags - compact */}
              {technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {technologies.slice(0, 5).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-surface border border-border rounded text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                  {technologies.length > 5 && (
                    <span className="px-2 py-1 text-text-secondary text-xs">
                      +{technologies.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-5 py-2.5 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors text-sm"
                  >
                    View Live
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                {project.videoUrl && (
                  <a
                    href={project.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-5 py-2.5 bg-surface border border-border rounded-lg font-medium hover:bg-surface-elevated transition-colors text-sm"
                  >
                    Watch Video
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </a>
                )}
                <Link
                  href={(() => {
                    const params = new URLSearchParams()

                    // Map project category to service type
                    if (categories.includes('WEB_DEVELOPMENT') || project.category === 'WEB_DEVELOPMENT') {
                      params.set('type', 'WEB_DEVELOPMENT')
                    } else if (categories.includes('IOS_APP') || categories.includes('ANDROID_APP') || categories.includes('CROSS_PLATFORM_APP') || project.category === 'IOS_APP' || project.category === 'ANDROID_APP' || project.category === 'CROSS_PLATFORM_APP') {
                      params.set('type', 'APP_DEVELOPMENT')
                    } else if (categories.includes('AI_AUTOMATION') || project.category === 'AI_AUTOMATION') {
                      params.set('type', 'AI_SOLUTIONS')
                    }

                    // Add project reference
                    params.set('project', project.slug)
                    params.set('projectTitle', project.title)

                    // Add description template
                    const descTemplate = `I'm interested in a project similar to ${project.title}.${project.description ? `\n\nSimilar to: ${project.description}` : ''}`
                    params.set('description', descTemplate)

                    return `/services/inquiry?${params.toString()}`
                  })()}
                  className="inline-flex items-center px-5 py-2.5 border border-border rounded-lg font-medium hover:bg-surface transition-colors text-sm"
                >
                  Start Your Project
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Case Study Section - Only show if there's additional content */}
      {(project.challenge || project.solution || project.results) && (
        <div className="py-12 bg-surface/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Challenge */}
              {project.challenge && (
                <div className="bg-background/50 rounded-xl p-6">
                  <h2 className="text-lg font-bold mb-3">The Challenge</h2>
                  <p className="text-text-secondary text-sm leading-relaxed">{project.challenge}</p>
                </div>
              )}

              {/* Solution */}
              {project.solution && (
                <div className="bg-background/50 rounded-xl p-6">
                  <h2 className="text-lg font-bold mb-3">Our Solution</h2>
                  <p className="text-text-secondary text-sm leading-relaxed">{project.solution}</p>
                </div>
              )}

              {/* Results */}
              {project.results && (
                <div className="bg-background/50 rounded-xl p-6">
                  <h2 className="text-lg font-bold mb-3">Results</h2>
                  <p className="text-text-secondary text-sm leading-relaxed">{project.results}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Screenshots Gallery */}
      <ScreenshotGallery images={images} projectTitle={project.title} />

      {/* Testimonial */}
      {project.testimonial && (
        <div className="py-12 bg-surface/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-2xl mx-auto text-center">
              <svg className="w-8 h-8 text-accent mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-lg md:text-xl mb-4 italic">&ldquo;{project.testimonial}&rdquo;</p>
              {(project.testimonialAuthor || project.testimonialRole) && (
                <div>
                  {project.testimonialAuthor && (
                    <p className="font-semibold">{project.testimonialAuthor}</p>
                  )}
                  {project.testimonialRole && (
                    <p className="text-text-secondary text-sm">{project.testimonialRole}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shop Merch Section - Only show if project has linked products */}
      {linkedProducts.length > 0 && (
        <div className="py-12 bg-surface/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Shop {project.title} Merch</h2>
                <p className="text-text-secondary">
                  Official {project.title} apparel and merchandise
                </p>
              </div>
              {linkedProducts[0]?.brand && BRAND_SLUG_MAP[linkedProducts[0].brand.toLowerCase()] && (
                <Link
                  href={`/shop/brands/${BRANDS[linkedProducts[0].brand]?.slug || linkedProducts[0].brand.toLowerCase()}`}
                  className="hidden md:inline-flex items-center px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors text-sm"
                >
                  View Collection
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {linkedProducts.map((product) => {
                const images = product.images as string[]
                const price = Number(product.price)
                const comparePrice = product.comparePrice ? Number(product.comparePrice) : null
                const brandConfig = product.brand ? BRANDS[product.brand] : null

                return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.slug}`}
                    className="group"
                  >
                    <div className="bg-surface border border-border rounded-xl overflow-hidden transition-all hover:border-border/80 hover:shadow-lg">
                      <div className="aspect-square relative bg-surface-elevated overflow-hidden">
                        {images?.[0] ? (
                          <Image
                            src={images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-text-primary mb-1 line-clamp-2 group-hover:text-text-primary/80 transition-colors text-sm">
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold"
                            style={{ color: brandConfig?.accentColor || '#3b82f6' }}
                          >
                            ${price.toFixed(2)}
                          </span>
                          {comparePrice && comparePrice > price && (
                            <span className="text-xs text-text-secondary line-through">
                              ${comparePrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Mobile View Collection Button */}
            {linkedProducts[0]?.brand && (
              <div className="mt-6 text-center md:hidden">
                <Link
                  href={`/shop/brands/${BRANDS[linkedProducts[0].brand]?.slug || linkedProducts[0].brand.toLowerCase()}`}
                  className="inline-flex items-center px-6 py-3 border border-border rounded-lg hover:bg-surface transition-colors"
                >
                  View Full Collection
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="py-16">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Want something similar?</h2>
          <p className="text-text-secondary mb-6 max-w-md mx-auto">
            Let&apos;s discuss how we can help bring your project to life.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
          >
            Get in Touch
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
