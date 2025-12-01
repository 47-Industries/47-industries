'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface ServicePackage {
  id: string
  name: string
  slug: string
  category: string
  price: string | null
  priceDisplay: string | null
  billingType: string
  shortDesc: string
  isPopular: boolean
  isActive: boolean
  sortOrder: number
  estimatedDays: number | null
  _count?: { inquiries: number }
}

interface ServiceProject {
  id: string
  title: string
  slug: string
  category: string
  clientName: string
  thumbnailUrl: string | null
  isFeatured: boolean
  isActive: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  WEB_DEVELOPMENT: 'Web Development',
  APP_DEVELOPMENT: 'App Development',
  AI_SOLUTIONS: 'AI Solutions',
  THREE_D_PRINTING: '3D Printing',
  CONSULTATION: 'Consultation',
}

const CATEGORY_COLORS: Record<string, string> = {
  WEB_DEVELOPMENT: 'bg-blue-500/20 text-blue-400',
  APP_DEVELOPMENT: 'bg-purple-500/20 text-purple-400',
  AI_SOLUTIONS: 'bg-green-500/20 text-green-400',
  THREE_D_PRINTING: 'bg-orange-500/20 text-orange-400',
  CONSULTATION: 'bg-pink-500/20 text-pink-400',
}

export default function ServicesAdminPage() {
  const [activeTab, setActiveTab] = useState<'packages' | 'projects' | 'features'>('packages')
  const [packages, setPackages] = useState<ServicePackage[]>([])
  const [projects, setProjects] = useState<ServiceProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [deletingProject, setDeletingProject] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [packagesRes, projectsRes] = await Promise.all([
        fetch('/api/admin/services/packages'),
        fetch('/api/admin/services/projects'),
      ])

      if (packagesRes.ok) {
        const data = await packagesRes.json()
        setPackages(data.packages || [])
      }
      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
    setLoading(false)
  }

  const toggleProjectFeatured = async (project: ServiceProject) => {
    try {
      const res = await fetch(`/api/admin/services/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !project.isFeatured }),
      })
      if (res.ok) {
        setProjects(prev => prev.map(p =>
          p.id === project.id ? { ...p, isFeatured: !p.isFeatured } : p
        ))
      }
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const toggleProjectActive = async (project: ServiceProject) => {
    try {
      const res = await fetch(`/api/admin/services/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !project.isActive }),
      })
      if (res.ok) {
        setProjects(prev => prev.map(p =>
          p.id === project.id ? { ...p, isActive: !p.isActive } : p
        ))
      }
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const deleteProject = async (project: ServiceProject) => {
    if (!confirm(`Are you sure you want to delete "${project.title}"? This cannot be undone.`)) {
      return
    }
    setDeletingProject(project.id)
    try {
      const res = await fetch(`/api/admin/services/projects/${project.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== project.id))
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    } finally {
      setDeletingProject(null)
    }
  }

  const filteredPackages = selectedCategory
    ? packages.filter(p => p.category === selectedCategory)
    : packages

  const filteredProjects = selectedCategory
    ? projects.filter(p => p.category === selectedCategory)
    : projects

  const stats = {
    totalPackages: packages.length,
    activePackages: packages.filter(p => p.isActive).length,
    totalProjects: projects.length,
    featuredProjects: projects.filter(p => p.isFeatured).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Services Management</h1>
          <p className="text-text-secondary mt-1">
            Manage your service packages, pricing, and portfolio projects
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/services/packages/new"
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
          >
            + Add Package
          </Link>
          <Link
            href="/admin/services/projects/new"
            className="px-4 py-2 bg-surface border border-border text-white rounded-xl hover:bg-surface-elevated transition-colors font-medium"
          >
            + Add Project
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Total Packages</p>
          <p className="text-2xl font-bold mt-1">{stats.totalPackages}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Active Packages</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{stats.activePackages}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Portfolio Projects</p>
          <p className="text-2xl font-bold mt-1">{stats.totalProjects}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Featured Projects</p>
          <p className="text-2xl font-bold mt-1 text-yellow-400">{stats.featuredProjects}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('packages')}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === 'packages'
                ? 'text-white'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Service Packages
            {activeTab === 'packages' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === 'projects'
                ? 'text-white'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            Portfolio Projects
            {activeTab === 'projects' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
            )}
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedCategory === ''
              ? 'bg-blue-500 text-white'
              : 'bg-surface border border-border text-text-secondary hover:text-white'
          }`}
        >
          All Categories
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === key
                ? 'bg-blue-500 text-white'
                : 'bg-surface border border-border text-text-secondary hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : activeTab === 'packages' ? (
        <div className="space-y-4">
          {filteredPackages.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-semibold mb-2">No service packages yet</h3>
              <p className="text-text-secondary mb-4">
                Create your first service package to display pricing and offerings
              </p>
              <Link
                href="/admin/services/packages/new"
                className="inline-flex px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Package
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredPackages.map(pkg => (
                <div
                  key={pkg.id}
                  className="bg-surface border border-border rounded-xl p-5 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{pkg.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[pkg.category]}`}>
                          {CATEGORY_LABELS[pkg.category]}
                        </span>
                        {pkg.isPopular && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                            Popular
                          </span>
                        )}
                        {!pkg.isActive && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-text-secondary text-sm line-clamp-2">{pkg.shortDesc}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-bold">
                        {pkg.price ? `$${Number(pkg.price).toLocaleString()}` : 'Custom'}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {pkg.billingType === 'one_time' ? 'One-time' : pkg.billingType}
                      </div>
                      {pkg.estimatedDays && (
                        <div className="text-xs text-text-secondary mt-1">
                          ~{pkg.estimatedDays} days
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div className="text-sm text-text-secondary">
                      {pkg._count?.inquiries || 0} inquiries
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/services/packages/${pkg.id}`}
                        className="px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-sm hover:border-blue-500/50 transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="bg-surface border border-border rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-lg font-semibold mb-2">No portfolio projects yet</h3>
              <p className="text-text-secondary mb-4">
                Showcase your work by adding portfolio projects
              </p>
              <Link
                href="/admin/services/projects/new"
                className="inline-flex px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add Project
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map(project => (
                <div
                  key={project.id}
                  className={`bg-surface border rounded-xl overflow-hidden transition-colors ${
                    project.isActive ? 'border-border hover:border-blue-500/50' : 'border-red-500/30 opacity-60'
                  }`}
                >
                  <div className="aspect-video bg-surface-elevated flex items-center justify-center relative">
                    {project.thumbnailUrl ? (
                      <Image
                        src={project.thumbnailUrl}
                        alt={project.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-4xl">🖼️</span>
                    )}
                    {!project.isActive && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="px-3 py-1 bg-red-500/80 text-white text-sm rounded-full">
                          Hidden
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[project.category]}`}>
                        {CATEGORY_LABELS[project.category]}
                      </span>
                      {project.isFeatured && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                          Featured
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{project.title}</h3>
                    <p className="text-sm text-text-secondary">{project.clientName}</p>
                    <div className="flex gap-2 mt-3">
                      <Link
                        href={`/admin/services/projects/${project.id}`}
                        className="flex-1 px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-sm text-center hover:border-blue-500/50 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => toggleProjectFeatured(project)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          project.isFeatured
                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                            : 'bg-surface-elevated border border-border hover:border-yellow-500/50'
                        }`}
                        title={project.isFeatured ? 'Remove from featured' : 'Mark as featured'}
                      >
                        ⭐
                      </button>
                      <button
                        onClick={() => toggleProjectActive(project)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          project.isActive
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}
                        title={project.isActive ? 'Hide project' : 'Show project'}
                      >
                        {project.isActive ? '👁️' : '👁️‍🗨️'}
                      </button>
                      <button
                        onClick={() => deleteProject(project)}
                        disabled={deletingProject === project.id}
                        className="px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-colors disabled:opacity-50"
                        title="Delete project"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
