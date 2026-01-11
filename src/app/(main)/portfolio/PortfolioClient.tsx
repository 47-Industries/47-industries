'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  slug: string
  category: string
  categories: string[]
  clientName: string
  description: string
  thumbnailUrl: string | null
  liveUrl: string | null
  isFeatured: boolean
  accentColor: string | null
}

// Category-specific icons for placeholders
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  AI_AUTOMATION: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  WEB_DEVELOPMENT: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  WEB_APP: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  IOS_APP: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  ANDROID_APP: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  CROSS_PLATFORM_APP: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
}

interface PortfolioClientProps {
  projects: Project[]
  categories: string[]
}

const CATEGORY_LABELS: Record<string, string> = {
  WEB_DEVELOPMENT: 'Web Development',
  WEB_APP: 'Web App',
  IOS_APP: 'iOS App',
  ANDROID_APP: 'Android App',
  CROSS_PLATFORM_APP: 'Cross-Platform App',
  AI_AUTOMATION: 'AI Automation',
  DESKTOP_APP: 'Desktop App',
  THREE_D_PRINTING: '3D Printing',
  LANDING_PAGE: 'Landing Page',
}

export default function PortfolioClient({ projects, categories }: PortfolioClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Filter projects by category
  const filteredProjects = selectedCategory
    ? projects.filter(project => {
        if (project.category === selectedCategory) return true
        if (project.categories.includes(selectedCategory)) return true
        return false
      })
    : projects

  // Separate featured and regular projects
  const featuredProjects = filteredProjects.filter(p => p.isFeatured)
  const regularProjects = filteredProjects.filter(p => !p.isFeatured)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="pt-20 pb-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Portfolio</h1>
            <p className="text-lg text-text-secondary mb-8">
              Explore our work across web development, mobile apps, and custom software solutions.
              Each project represents our commitment to quality and innovation.
            </p>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === null
                    ? 'bg-accent text-white'
                    : 'bg-surface border border-border text-text-secondary hover:text-white hover:border-accent/50'
                }`}
              >
                All Projects
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-accent text-white'
                      : 'bg-surface border border-border text-text-secondary hover:text-white hover:border-accent/50'
                  }`}
                >
                  {CATEGORY_LABELS[category] || category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 pb-20">
        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured Projects
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* All Projects */}
        <div>
          {featuredProjects.length > 0 && regularProjects.length > 0 && (
            <h2 className="text-2xl font-bold mb-6">All Projects</h2>
          )}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-2xl">
              <p className="text-text-secondary">No projects found in this category.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(featuredProjects.length > 0 ? regularProjects : filteredProjects).map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-6 bg-surface rounded-xl border border-border">
            <div className="text-3xl font-bold text-accent mb-1">{projects.length}</div>
            <div className="text-sm text-text-secondary">Total Projects</div>
          </div>
          <div className="text-center p-6 bg-surface rounded-xl border border-border">
            <div className="text-3xl font-bold text-accent mb-1">
              {projects.filter(p => p.category === 'WEB_DEVELOPMENT' || p.categories.includes('WEB_DEVELOPMENT')).length}
            </div>
            <div className="text-sm text-text-secondary">Web Projects</div>
          </div>
          <div className="text-center p-6 bg-surface rounded-xl border border-border">
            <div className="text-3xl font-bold text-accent mb-1">
              {projects.filter(p =>
                p.category === 'IOS_APP' || p.category === 'ANDROID_APP' || p.category === 'CROSS_PLATFORM_APP' ||
                p.categories.includes('IOS_APP') || p.categories.includes('ANDROID_APP') || p.categories.includes('CROSS_PLATFORM_APP')
              ).length}
            </div>
            <div className="text-sm text-text-secondary">Mobile Apps</div>
          </div>
          <div className="text-center p-6 bg-surface rounded-xl border border-border">
            <div className="text-3xl font-bold text-accent mb-1">
              {new Set(projects.map(p => p.clientName)).size}
            </div>
            <div className="text-sm text-text-secondary">Happy Clients</div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center py-16 bg-surface rounded-3xl border border-border">
          <h2 className="text-3xl font-bold mb-4">Ready to start your project?</h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            Let's discuss your ideas and create something amazing together.
          </p>
          <Link
            href="/services/inquiry"
            className="inline-flex items-center px-8 py-4 bg-accent text-white rounded-lg font-medium hover:bg-accent/90 transition-all"
          >
            Start Your Project
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  // Get all categories for display
  const displayCategories = project.categories.length > 0
    ? project.categories
    : [project.category]

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-all bg-surface"
    >
      <div className="aspect-video bg-surface-elevated flex items-center justify-center relative overflow-hidden">
        {project.thumbnailUrl ? (
          <img
            src={project.thumbnailUrl}
            alt={project.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          /* Styled placeholder with category icon and accent color */
          <div
            className="w-full h-full flex flex-col items-center justify-center p-4"
            style={{
              background: project.accentColor
                ? `linear-gradient(135deg, ${project.accentColor}15 0%, ${project.accentColor}05 100%)`
                : 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.02) 100%)'
            }}
          >
            <div
              className="mb-2 opacity-80"
              style={{ color: project.accentColor || '#3b82f6' }}
            >
              {CATEGORY_ICONS[project.category] || (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              )}
            </div>
            <span
              className="text-sm font-semibold text-center line-clamp-1 px-2"
              style={{ color: project.accentColor || '#3b82f6' }}
            >
              {project.title}
            </span>
          </div>
        )}
        {project.isFeatured && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/90 text-black text-xs font-semibold rounded">
            Featured
          </div>
        )}
        {project.liveUrl && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-green-500/90 text-white text-xs font-semibold rounded flex items-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full mr-1.5 animate-pulse"></span>
            Live
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-1 mb-2">
          {displayCategories.slice(0, 2).map(cat => (
            <span key={cat} className="text-xs text-accent font-medium">
              {CATEGORY_LABELS[cat] || cat}
              {displayCategories.indexOf(cat) < Math.min(displayCategories.length, 2) - 1 && (
                <span className="text-text-muted mx-1">/</span>
              )}
            </span>
          ))}
          {displayCategories.length > 2 && (
            <span className="text-xs text-text-muted">+{displayCategories.length - 2}</span>
          )}
        </div>
        <h3 className="text-lg font-bold mb-1 group-hover:text-accent transition-colors line-clamp-1">
          {project.title}
        </h3>
        <p className="text-text-secondary text-sm mb-2">{project.clientName}</p>
        <p className="text-text-muted text-xs line-clamp-2">{project.description}</p>
      </div>
    </Link>
  )
}
