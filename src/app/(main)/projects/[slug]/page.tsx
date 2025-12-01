import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const CATEGORY_LABELS: Record<string, string> = {
  WEB_DEVELOPMENT: 'Web Development',
  IOS_APP: 'iOS App',
  ANDROID_APP: 'Android App',
  CROSS_PLATFORM_APP: 'Cross-Platform App',
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
  })

  if (!project || !project.isActive) {
    notFound()
  }

  const technologies = (project.technologies as string[]) || []
  const images = (project.images as string[]) || []

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/services" className="text-text-secondary hover:text-accent transition-colors">
            ← Back to Services
          </Link>
        </div>

        {/* Header */}
        <div className="max-w-4xl mb-12">
          <div className="text-accent text-sm font-medium mb-4">
            {CATEGORY_LABELS[project.category] || project.category}
          </div>
          <h1 className="text-5xl font-bold mb-4">{project.title}</h1>
          <p className="text-xl text-text-secondary">{project.clientName}</p>
        </div>

        {/* Hero Image */}
        {project.thumbnailUrl && (
          <div className="mb-12 rounded-2xl overflow-hidden border border-border">
            <img
              src={project.thumbnailUrl}
              alt={project.title}
              className="w-full h-auto"
            />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <div>
              <h2 className="text-2xl font-bold mb-4">About the Project</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-text-secondary whitespace-pre-wrap">{project.description}</p>
              </div>
            </div>

            {/* Challenge */}
            {project.challenge && (
              <div>
                <h2 className="text-2xl font-bold mb-4">The Challenge</h2>
                <p className="text-text-secondary whitespace-pre-wrap">{project.challenge}</p>
              </div>
            )}

            {/* Solution */}
            {project.solution && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Our Solution</h2>
                <p className="text-text-secondary whitespace-pre-wrap">{project.solution}</p>
              </div>
            )}

            {/* Results */}
            {project.results && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Results</h2>
                <p className="text-text-secondary whitespace-pre-wrap">{project.results}</p>
              </div>
            )}

            {/* Gallery */}
            {images.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Gallery</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {images.map((img, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-border">
                      <img src={img} alt={`${project.title} screenshot ${i + 1}`} className="w-full h-auto" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonial */}
            {project.testimonial && (
              <div className="bg-surface rounded-2xl p-8 border border-border">
                <svg className="w-10 h-10 text-accent mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <p className="text-lg mb-4">{project.testimonial}</p>
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
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Client Logo */}
            {project.clientLogo && (
              <div className="bg-surface rounded-xl p-6 border border-border">
                <img src={project.clientLogo} alt={project.clientName} className="max-h-16" />
              </div>
            )}

            {/* Technologies */}
            {technologies.length > 0 && (
              <div className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="font-semibold mb-4">Technologies Used</h3>
                <div className="flex flex-wrap gap-2">
                  {technologies.map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-background border border-border rounded-full text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {(project.liveUrl || project.videoUrl) && (
              <div className="bg-surface rounded-xl p-6 border border-border space-y-3">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-colors"
                  >
                    View Live Project
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
                    className="flex items-center justify-center w-full py-3 border border-border rounded-lg font-medium hover:bg-surface-elevated transition-colors"
                  >
                    Watch Video
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="bg-accent/10 rounded-xl p-6 border border-accent/20">
              <h3 className="font-semibold mb-2">Want something similar?</h3>
              <p className="text-text-secondary text-sm mb-4">
                Let's discuss how we can help with your project.
              </p>
              <Link
                href="/contact"
                className="block w-full py-3 bg-accent text-white text-center rounded-lg font-medium hover:bg-accent/90 transition-colors"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
