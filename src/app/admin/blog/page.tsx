'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverImage: string | null
  category: { id: string; name: string } | null
  author: { name: string | null; email: string } | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  _count?: { views: number }
}

interface BlogCategory {
  id: string
  name: string
  slug: string
  _count: { posts: number }
}

const statusColors: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  PUBLISHED: { bg: 'bg-green-500/20', text: 'text-green-400' },
  ARCHIVED: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'posts' | 'categories'>('posts')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [statusFilter, categoryFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)

      const [postsRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/blog/posts?${params}`),
        fetch('/api/admin/blog/categories'),
      ])

      if (postsRes.ok) {
        const data = await postsRes.json()
        setPosts(data.posts || [])
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch blog data:', error)
    }
    setLoading(false)
  }

  const deletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const res = await fetch(`/api/admin/blog/posts/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (error) {
      console.error('Failed to delete post:', error)
    }
  }

  const stats = {
    totalPosts: posts.length,
    published: posts.filter(p => p.status === 'PUBLISHED').length,
    drafts: posts.filter(p => p.status === 'DRAFT').length,
    categories: categories.length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Blog</h1>
          <p className="text-text-secondary mt-1">
            Manage blog posts and content
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewCategoryModal(true)}
            className="px-4 py-2 bg-surface border border-border text-white rounded-xl hover:bg-surface-elevated transition-colors font-medium"
          >
            + Category
          </button>
          <button
            onClick={() => setShowNewPostModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
          >
            + New Post
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Total Posts</p>
          <p className="text-2xl font-bold mt-1">{stats.totalPosts}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Published</p>
          <p className="text-2xl font-bold mt-1 text-green-400">{stats.published}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Drafts</p>
          <p className="text-2xl font-bold mt-1 text-yellow-400">{stats.drafts}</p>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-text-secondary text-sm">Categories</p>
          <p className="text-2xl font-bold mt-1 text-purple-400">{stats.categories}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {[
            { id: 'posts', label: 'Posts' },
            { id: 'categories', label: 'Categories' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <>
          {activeTab === 'posts' && (
            <PostsList
              posts={posts}
              categories={categories}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              onDelete={deletePost}
            />
          )}
          {activeTab === 'categories' && (
            <CategoriesList
              categories={categories}
              onRefresh={fetchData}
            />
          )}
        </>
      )}

      {/* New Post Modal */}
      {showNewPostModal && (
        <NewPostModal
          categories={categories}
          onClose={() => setShowNewPostModal(false)}
          onCreated={() => {
            setShowNewPostModal(false)
            fetchData()
          }}
        />
      )}

      {/* New Category Modal */}
      {showNewCategoryModal && (
        <NewCategoryModal
          onClose={() => setShowNewCategoryModal(false)}
          onCreated={() => {
            setShowNewCategoryModal(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function PostsList({
  posts,
  categories,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  onDelete,
}: {
  posts: BlogPost[]
  categories: BlogCategory[]
  statusFilter: string
  setStatusFilter: (s: string) => void
  categoryFilter: string
  setCategoryFilter: (s: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-surface border border-border rounded-xl focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
          <p className="text-text-secondary">
            Create your first blog post to share news and updates
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div
              key={post.id}
              className="bg-surface border border-border rounded-xl p-6 flex gap-6"
            >
              {/* Cover Image */}
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-32 h-24 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-32 h-24 rounded-lg bg-surface-elevated flex items-center justify-center text-3xl flex-shrink-0">
                  📄
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{post.title}</h3>
                    <p className="text-text-secondary text-sm mt-1 line-clamp-2">
                      {post.excerpt || 'No excerpt'}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                    statusColors[post.status]?.bg || 'bg-gray-500/20'
                  } ${statusColors[post.status]?.text || 'text-gray-400'}`}>
                    {post.status}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-text-secondary">
                  {post.category && (
                    <span className="bg-surface-elevated px-2 py-1 rounded">
                      {post.category.name}
                    </span>
                  )}
                  <span>By {post.author?.name || 'Unknown'}</span>
                  <span>
                    {post.publishedAt
                      ? `Published ${new Date(post.publishedAt).toLocaleDateString()}`
                      : `Created ${new Date(post.createdAt).toLocaleDateString()}`
                    }
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors text-center"
                >
                  Edit
                </Link>
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="px-4 py-2 bg-surface-elevated border border-border rounded-lg text-sm hover:border-blue-500/50 transition-colors text-center"
                >
                  View
                </Link>
                <button
                  onClick={() => onDelete(post.id)}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoriesList({
  categories,
  onRefresh,
}: {
  categories: BlogCategory[]
  onRefresh: () => void
}) {
  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure? All posts in this category will be uncategorized.')) return

    try {
      const res = await fetch(`/api/admin/blog/categories/${id}`, { method: 'DELETE' })
      if (res.ok) onRefresh()
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold mb-2">No categories yet</h3>
          <p className="text-text-secondary">
            Create categories to organize your blog posts
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-surface-elevated">
                <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Slug</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-text-secondary">Posts</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-4 font-medium">{category.name}</td>
                  <td className="px-6 py-4 text-text-secondary font-mono text-sm">{category.slug}</td>
                  <td className="px-6 py-4">{category._count?.posts || 0}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function NewPostModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: BlogCategory[]
  onClose: () => void
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT')
  const [coverImage, setCoverImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }, [title])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug,
          excerpt,
          content,
          categoryId: categoryId || null,
          status,
          coverImage: coverImage || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create post')
      }

      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-2xl w-full my-8">
        <h2 className="text-xl font-bold mb-4">New Blog Post</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="post-url-slug"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <input
              type="text"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief description for previews"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cover Image URL</label>
            <input
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content *</label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Write your blog post content here... (Markdown supported)"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">No Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Publish Now</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-surface-elevated border border-border rounded-lg font-medium hover:bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function NewCategoryModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (name && !slug) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }, [name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create category')
      }

      onCreated()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">New Category</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug *</label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="category-slug"
              className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:border-blue-500 font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Category'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-surface-elevated border border-border rounded-lg font-medium hover:bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
