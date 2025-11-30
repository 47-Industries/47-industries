'use client'

import { useState, useEffect } from 'react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  productType: 'PHYSICAL' | 'DIGITAL'
  parentId: string | null
  active: boolean
  _count: {
    products: number
  }
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'PHYSICAL' | 'DIGITAL'>('ALL')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    productType: 'PHYSICAL' as 'PHYSICAL' | 'DIGITAL',
    active: true,
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [filter])

  const fetchCategories = async () => {
    try {
      const params = new URLSearchParams({ includeInactive: 'true' })
      if (filter !== 'ALL') {
        params.set('productType', filter)
      }
      const res = await fetch(`/api/admin/categories?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        description: category.description || '',
        productType: category.productType,
        active: category.active,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        description: '',
        productType: filter === 'ALL' ? 'PHYSICAL' : filter,
        active: true,
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCategory(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories'
      const method = editingCategory ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        closeModal()
        fetchCategories()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save category')
      }
    } catch (error) {
      console.error('Failed to save category:', error)
      alert('Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (category._count.products > 0) {
      alert(`Cannot delete category with ${category._count.products} products. Move or delete products first.`)
      return
    }

    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchCategories()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      alert('Failed to delete category')
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    background: '#0a0a0a',
    border: '1px solid #27272a',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
  }

  const physicalCategories = categories.filter(c => c.productType === 'PHYSICAL')
  const digitalCategories = categories.filter(c => c.productType === 'DIGITAL')

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
            Categories
          </h1>
          <p style={{ color: '#a1a1aa', fontSize: '14px' }}>
            Manage product categories for your store
          </p>
        </div>
        <button
          onClick={() => openModal()}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          + Add Category
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
      }}>
        {(['ALL', 'PHYSICAL', 'DIGITAL'] as const).map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              background: filter === type ? '#3b82f6' : '#27272a',
              color: '#fff',
            }}
          >
            {type === 'ALL' ? 'All Categories' : type === 'PHYSICAL' ? 'Physical Products' : 'Digital Products'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#a1a1aa' }}>
          Loading categories...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Physical Categories */}
          {(filter === 'ALL' || filter === 'PHYSICAL') && (
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981'
                }} />
                Physical Product Categories
                <span style={{ color: '#71717a', fontWeight: 400 }}>
                  ({physicalCategories.length})
                </span>
              </h2>

              {physicalCategories.length === 0 ? (
                <div style={{
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                  color: '#71717a'
                }}>
                  <p>No physical product categories yet.</p>
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, productType: 'PHYSICAL' }))
                      openModal()
                    }}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      background: '#27272a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Create Physical Category
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  {physicalCategories.map(category => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={() => openModal(category)}
                      onDelete={() => handleDelete(category)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Digital Categories */}
          {(filter === 'ALL' || filter === 'DIGITAL') && (
            <div>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#8b5cf6'
                }} />
                Digital Product Categories
                <span style={{ color: '#71717a', fontWeight: 400 }}>
                  ({digitalCategories.length})
                </span>
              </h2>

              {digitalCategories.length === 0 ? (
                <div style={{
                  background: '#18181b',
                  border: '1px solid #27272a',
                  borderRadius: '12px',
                  padding: '40px',
                  textAlign: 'center',
                  color: '#71717a'
                }}>
                  <p>No digital product categories yet.</p>
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, productType: 'DIGITAL' }))
                      openModal()
                    }}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      background: '#27272a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    Create Digital Category
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px'
                }}>
                  {digitalCategories.map(category => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={() => openModal(category)}
                      onDelete={() => handleDelete(category)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            background: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '480px'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  placeholder="e.g., 3D Printed Models"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Optional description for this category"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                  Product Type *
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, productType: 'PHYSICAL' })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: formData.productType === 'PHYSICAL' ? '2px solid #10b981' : '1px solid #27272a',
                      background: formData.productType === 'PHYSICAL' ? 'rgba(16, 185, 129, 0.1)' : '#0a0a0a',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>Physical</div>
                    <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                      Shipped products
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, productType: 'DIGITAL' })}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '8px',
                      border: formData.productType === 'DIGITAL' ? '2px solid #8b5cf6' : '1px solid #27272a',
                      background: formData.productType === 'DIGITAL' ? 'rgba(139, 92, 246, 0.1)' : '#0a0a0a',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>Digital</div>
                    <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                      Downloadable files
                    </div>
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  color: '#a1a1aa',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }}
                  />
                  Active (visible in store)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '12px 24px',
                    background: '#27272a',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    background: saving ? '#27272a' : '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryCard({
  category,
  onEdit,
  onDelete
}: {
  category: Category
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div style={{
      background: '#18181b',
      border: '1px solid #27272a',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
            {category.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: category.productType === 'PHYSICAL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
              color: category.productType === 'PHYSICAL' ? '#10b981' : '#8b5cf6'
            }}>
              {category.productType}
            </span>
            {!category.active && (
              <span style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444'
              }}>
                Inactive
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEdit}
            style={{
              padding: '6px 12px',
              background: '#27272a',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            style={{
              padding: '6px 12px',
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {category.description && (
        <p style={{ fontSize: '13px', color: '#71717a', margin: 0 }}>
          {category.description}
        </p>
      )}

      <div style={{
        fontSize: '13px',
        color: '#a1a1aa',
        paddingTop: '8px',
        borderTop: '1px solid #27272a'
      }}>
        {category._count.products} {category._count.products === 1 ? 'product' : 'products'}
      </div>
    </div>
  )
}
