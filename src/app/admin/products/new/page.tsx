'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([''])

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDesc: '',
    price: '',
    comparePrice: '',
    costPrice: '',
    categoryId: '',
    stock: '0',
    sku: '',
    weight: '',
    dimensions: '',
    featured: false,
    active: true,
    material: '',
    printTime: '',
    layerHeight: '',
    infill: '',
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      setCategories(data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const filteredImages = imageUrls.filter(url => url.trim() !== '')

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: filteredImages,
          price: parseFloat(formData.price),
          comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          stock: parseInt(formData.stock),
          weight: formData.weight ? parseFloat(formData.weight) : null,
          printTime: formData.printTime ? parseInt(formData.printTime) : null,
          layerHeight: formData.layerHeight ? parseFloat(formData.layerHeight) : null,
          infill: formData.infill ? parseInt(formData.infill) : null,
        }),
      })

      if (res.ok) {
        router.push('/admin/products')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create product')
      }
    } catch (error) {
      console.error('Failed to create product:', error)
      alert('Failed to create product')
    } finally {
      setLoading(false)
    }
  }

  const addImageUrl = () => {
    setImageUrls([...imageUrls, ''])
  }

  const updateImageUrl = (index: number, value: string) => {
    const newUrls = [...imageUrls]
    newUrls[index] = value
    setImageUrls(newUrls)
  }

  const removeImageUrl = (index: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '10px 14px' : '12px 16px',
    background: '#0a0a0a',
    border: '1px solid #27272a',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px',
    color: '#a1a1aa',
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isMobile ? '24px' : '32px',
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: 700,
            marginBottom: '8px',
            margin: 0
          }}>Add New Product</h1>
          <p style={{
            color: '#71717a',
            margin: 0,
            fontSize: isMobile ? '14px' : '16px'
          }}>Create a new product listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: isMobile ? '16px' : '24px',
        }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            {/* Basic Info */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
                margin: 0
              }}>Basic Information</h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={inputStyle}
                  placeholder="Enter product name"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Short Description</label>
                <input
                  type="text"
                  value={formData.shortDesc}
                  onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })}
                  style={inputStyle}
                  placeholder="Brief description (max 500 characters)"
                  maxLength={500}
                />
              </div>

              <div>
                <label style={labelStyle}>Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    ...inputStyle,
                    minHeight: isMobile ? '120px' : '150px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Detailed product description"
                />
              </div>
            </div>

            {/* Pricing */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
                margin: 0
              }}>Pricing</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '16px'
              }}>
                <div>
                  <label style={labelStyle}>Price *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    style={inputStyle}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Compare Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData({ ...formData, comparePrice: e.target.value })}
                    style={inputStyle}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    style={inputStyle}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
                margin: 0
              }}>Images</h2>

              {imageUrls.map((url, index) => (
                <div key={index} style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    placeholder="https://example.com/image.jpg"
                  />
                  {imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageUrl(index)}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 500,
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addImageUrl}
                style={{
                  padding: '10px 16px',
                  background: '#27272a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  marginTop: '8px'
                }}
              >
                + Add Image URL
              </button>
            </div>

            {/* 3D Printing Specs */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
                margin: 0
              }}>3D Printing Specifications (Optional)</h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                gap: '16px'
              }}>
                <div>
                  <label style={labelStyle}>Material</label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    style={inputStyle}
                    placeholder="e.g., PLA, ABS, PETG"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Print Time (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.printTime}
                    onChange={(e) => setFormData({ ...formData, printTime: e.target.value })}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Layer Height (mm)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.layerHeight}
                    onChange={(e) => setFormData({ ...formData, layerHeight: e.target.value })}
                    style={inputStyle}
                    placeholder="0.200"
                  />
                </div>

                <div>
                  <label style={labelStyle}>Infill (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.infill}
                    onChange={(e) => setFormData({ ...formData, infill: e.target.value })}
                    style={inputStyle}
                    placeholder="20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            {/* Status */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
                margin: 0
              }}>Status</h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginRight: '10px',
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  Active
                </label>
              </div>

              <div>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    style={{
                      width: '18px',
                      height: '18px',
                      marginRight: '10px',
                      cursor: 'pointer',
                      accentColor: '#3b82f6'
                    }}
                  />
                  Featured Product
                </label>
              </div>
            </div>

            {/* Organization */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
                margin: 0
              }}>Organization</h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p style={{
                    fontSize: '12px',
                    color: '#ef4444',
                    marginTop: '8px',
                    margin: '8px 0 0 0'
                  }}>
                    No categories found. Create a category first.
                  </p>
                )}
              </div>

              <div>
                <label style={labelStyle}>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  style={inputStyle}
                  placeholder="Product SKU"
                />
              </div>
            </div>

            {/* Inventory */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
                margin: 0
              }}>Inventory</h2>

              <div>
                <label style={labelStyle}>Stock Quantity *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  style={inputStyle}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Shipping */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '20px',
                margin: 0
              }}>Shipping</h2>

              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Weight (lbs)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  style={inputStyle}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label style={labelStyle}>Dimensions</label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  style={inputStyle}
                  placeholder="L x W x H (inches)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: isMobile ? '24px' : '32px',
          flexDirection: isMobile ? 'column' : 'row'
        }}>
          <Link
            href="/admin/products"
            style={{
              padding: isMobile ? '12px' : '12px 24px',
              background: '#27272a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || categories.length === 0}
            style={{
              padding: isMobile ? '12px' : '12px 32px',
              background: loading || categories.length === 0 ? '#27272a' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading || categories.length === 0 ? 'not-allowed' : 'pointer',
              opacity: loading || categories.length === 0 ? 0.5 : 1
            }}
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
