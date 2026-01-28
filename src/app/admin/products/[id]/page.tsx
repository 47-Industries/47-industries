'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUploader from '@/components/admin/ImageUploader'

interface Category {
  id: string
  name: string
  slug: string
}

interface ProductVariant {
  id: string
  name: string
  sku: string | null
  price: number
  stock: number
  options: Record<string, string>
  isActive: boolean
}

interface OptionType {
  id: string
  name: string
  values: string[]
}

interface Product {
  id: string
  name: string
  description: string
  shortDesc: string | null
  price: number
  comparePrice: number | null
  costPrice: number | null
  images: string[]
  categoryId: string
  stock: number
  sku: string | null
  weight: number | null
  dimensions: string | null
  featured: boolean
  active: boolean
  material: string | null
  printTime: number | null
  layerHeight: number | null
  infill: number | null
  variants?: ProductVariant[]
  productType?: 'PHYSICAL' | 'DIGITAL'
  linkedProductId?: string | null
  linkedProduct?: {
    id: string
    name: string
    slug: string
    price: number
    productType: 'PHYSICAL' | 'DIGITAL'
  } | null
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<string[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [optionTypes, setOptionTypes] = useState<OptionType[]>([])
  const [showAddVariant, setShowAddVariant] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCreateLinked, setShowCreateLinked] = useState(false)
  const [creatingLinked, setCreatingLinked] = useState(false)
  const [linkedPricePercentage, setLinkedPricePercentage] = useState(25)
  const [customLinkedPrice, setCustomLinkedPrice] = useState('')
  const [showLinkExisting, setShowLinkExisting] = useState(false)
  const [unlinking, setUnlinking] = useState(false)

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
    fetchProduct()
    fetchOptionTypes()
  }, [])

  const fetchOptionTypes = async () => {
    try {
      const res = await fetch('/api/admin/products/option-types')
      if (res.ok) {
        const data = await res.json()
        setOptionTypes(data.optionTypes || [])
      }
    } catch (error) {
      console.error('Failed to fetch option types:', error)
    }
  }

  const fetchVariants = async () => {
    try {
      const res = await fetch(`/api/admin/products/${id}/variants`)
      if (res.ok) {
        const data = await res.json()
        setVariants(data.variants || [])
      }
    } catch (error) {
      console.error('Failed to fetch variants:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${id}`)
      if (!res.ok) {
        router.push('/admin/products')
        return
      }
      const responseData = await res.json()
      const data: Product = responseData.product
      setProduct(data)

      setFormData({
        name: data.name,
        description: data.description,
        shortDesc: data.shortDesc || '',
        price: data.price.toString(),
        comparePrice: data.comparePrice?.toString() || '',
        costPrice: data.costPrice?.toString() || '',
        categoryId: data.categoryId,
        stock: data.stock.toString(),
        sku: data.sku || '',
        weight: data.weight?.toString() || '',
        dimensions: data.dimensions || '',
        featured: data.featured,
        active: data.active,
        material: data.material || '',
        printTime: data.printTime?.toString() || '',
        layerHeight: data.layerHeight?.toString() || '',
        infill: data.infill?.toString() || '',
      })

      setImages(data.images || [])
      setVariants(data.variants || [])
    } catch (error) {
      console.error('Failed to fetch product:', error)
      router.push('/admin/products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/admin/products')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete product')
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return

    try {
      const res = await fetch(`/api/admin/products/${id}/variants/${variantId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setVariants(variants.filter(v => v.id !== variantId))
      } else {
        alert('Failed to delete variant')
      }
    } catch (error) {
      console.error('Failed to delete variant:', error)
      alert('Failed to delete variant')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images,
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
        alert(error.error || 'Failed to update product')
      }
    } catch (error) {
      console.error('Failed to update product:', error)
      alert('Failed to update product')
    } finally {
      setSaving(false)
    }
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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
      }}>
        <div style={{
          color: '#71717a',
          fontSize: isMobile ? '14px' : '16px',
        }}>Loading product...</div>
      </div>
    )
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
          }}>Edit Product</h1>
          <p style={{
            color: '#71717a',
            margin: 0,
            fontSize: isMobile ? '14px' : '16px'
          }}>Update product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
          gap: isMobile ? '16px' : '24px',
        }}>
          {/* Left Column - Same as New Product */}
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

              <ImageUploader
                images={images}
                onChange={setImages}
                maxImages={10}
                folder="products"
              />
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

            {/* Linked Product (Physical/Digital) */}
            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '16px',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  background: product?.productType === 'DIGITAL' ? '#7c3aed' : '#3b82f6',
                  color: '#fff',
                }}>
                  {product?.productType || 'PHYSICAL'}
                </span>
                Linked Product
              </h2>

              {product?.linkedProduct ? (
                <div style={{
                  background: '#27272a',
                  borderRadius: '12px',
                  padding: '16px',
                }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                    {product.linkedProduct.name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '12px' }}>
                    <span style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      background: product.linkedProduct.productType === 'DIGITAL' ? '#7c3aed' : '#3b82f6',
                      color: '#fff',
                      marginRight: '8px',
                    }}>
                      {product.linkedProduct.productType}
                    </span>
                    ${Number(product.linkedProduct.price).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/products/${product.linkedProduct!.id}`)}
                      style={{
                        padding: '8px 16px',
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      View {product.linkedProduct.productType === 'DIGITAL' ? 'Digital' : 'Physical'} Version
                    </button>
                    <button
                      type="button"
                      disabled={unlinking}
                      onClick={async () => {
                        if (!confirm('Are you sure you want to unlink these products?')) return
                        setUnlinking(true)
                        try {
                          const res = await fetch(`/api/admin/products/${id}/link`, {
                            method: 'DELETE',
                          })
                          if (res.ok) {
                            fetchProduct()
                          } else {
                            const data = await res.json()
                            alert(data.error || 'Failed to unlink products')
                          }
                        } catch (error) {
                          console.error('Error unlinking:', error)
                          alert('Failed to unlink products')
                        } finally {
                          setUnlinking(false)
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: unlinking ? 'not-allowed' : 'pointer',
                        opacity: unlinking ? 0.5 : 1,
                      }}
                    >
                      {unlinking ? 'Unlinking...' : 'Unlink'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '12px' }}>
                    No {product?.productType === 'DIGITAL' ? 'physical' : 'digital'} version linked.
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowLinkExisting(true)}
                      style={{
                        padding: '10px 20px',
                        background: '#27272a',
                        color: '#fff',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      Link Existing Product
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Calculate suggested price (25% for digital)
                        const currentPrice = parseFloat(formData.price) || 0
                        if (product?.productType === 'PHYSICAL') {
                          setCustomLinkedPrice((currentPrice * 0.25).toFixed(2))
                        } else {
                          setCustomLinkedPrice((currentPrice / 0.25).toFixed(2))
                        }
                        setShowCreateLinked(true)
                      }}
                      style={{
                        padding: '10px 20px',
                        background: product?.productType === 'DIGITAL' ? '#3b82f6' : '#7c3aed',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      + Create New {product?.productType === 'DIGITAL' ? 'Physical' : 'Digital'} Version
                    </button>
                  </div>
                </div>
              )}
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

            {/* Danger Zone */}
            <div style={{
              background: '#18181b',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              padding: isMobile ? '20px' : '24px',
            }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: 600,
                marginBottom: '12px',
                margin: 0,
                color: '#ef4444'
              }}>Danger Zone</h2>
              <p style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '16px' }}>
                Permanently delete this product and all its variants.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>

        {/* Variants Section */}
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: isMobile ? '20px' : '24px',
          marginTop: '24px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              margin: 0
            }}>Product Variants</h2>
            <button
              type="button"
              onClick={() => setShowAddVariant(true)}
              style={{
                padding: '8px 16px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              + Add Variant
            </button>
          </div>

          {variants.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '32px',
              color: '#71717a',
              border: '1px dashed #3f3f46',
              borderRadius: '12px',
            }}>
              <p style={{ marginBottom: '8px' }}>No variants yet.</p>
              <p style={{ fontSize: '13px' }}>
                Add variants like different sizes or colors for this product.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272a' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>Variant</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>SKU</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>Price</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>Stock</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>Active</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, index) => (
                    <tr key={variant.id} style={{ borderBottom: index < variants.length - 1 ? '1px solid #27272a' : 'none' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 500 }}>{variant.name}</div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>
                          {Object.entries(variant.options || {}).map(([key, value]) => `${key}: ${value}`).join(' / ')}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#a1a1aa', fontSize: '13px' }}>{variant.sku || '-'}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '14px' }}>${Number(variant.price).toFixed(2)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <span style={{
                          color: variant.stock <= 0 ? '#ef4444' : variant.stock <= 5 ? '#f59e0b' : '#10b981'
                        }}>
                          {variant.stock}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: variant.isActive ? '#10b981' : '#71717a',
                          display: 'inline-block'
                        }} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(variant.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
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
            disabled={saving}
            style={{
              padding: isMobile ? '12px' : '12px 32px',
              background: saving ? '#27272a' : '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.5 : 1
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
            maxWidth: '400px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#ef4444',
              fontSize: '24px'
            }}>
              !
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Delete Product?</h3>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '24px' }}>
              This action cannot be undone. This will permanently delete "{product?.name}" and all its variants.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
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
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: deleting ? 0.5 : 1
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showAddVariant && product && (
        <AddVariantModal
          product={product}
          optionTypes={optionTypes}
          onClose={() => setShowAddVariant(false)}
          onSaved={() => {
            fetchVariants()
            setShowAddVariant(false)
          }}
        />
      )}

      {/* Create Linked Product Modal */}
      {showCreateLinked && product && (
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
            maxWidth: '480px',
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
              Create {product.productType === 'PHYSICAL' ? 'Digital' : 'Physical'} Version
            </h3>
            <p style={{ color: '#a1a1aa', fontSize: '14px', marginBottom: '24px' }}>
              This will create a new {product.productType === 'PHYSICAL' ? 'digital download' : 'physical'} version of "{product.name}" and link them together.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: '#a1a1aa' }}>
                {product.productType === 'PHYSICAL' ? 'Digital' : 'Physical'} Price
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customLinkedPrice}
                    onChange={(e) => setCustomLinkedPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 28px',
                      background: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '16px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#71717a', marginTop: '8px' }}>
                {product.productType === 'PHYSICAL'
                  ? `Suggested: $${(parseFloat(formData.price) * 0.25).toFixed(2)} (25% of physical price)`
                  : `Suggested: $${(parseFloat(formData.price) / 0.25).toFixed(2)} (4x digital price)`
                }
              </p>
            </div>

            <div style={{
              background: '#27272a',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '13px', color: '#a1a1aa', marginBottom: '8px' }}>Preview</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 500 }}>
                    {product.productType === 'PHYSICAL'
                      ? `${product.name} STL File`
                      : product.name.replace(' STL File', '').replace(' - STL', '')
                    }
                  </div>
                  <div style={{ fontSize: '12px', color: '#71717a' }}>
                    {product.productType === 'PHYSICAL' ? 'Digital Download' : 'Physical Product'}
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>
                  ${parseFloat(customLinkedPrice || '0').toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowCreateLinked(false)}
                disabled={creatingLinked}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#27272a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setCreatingLinked(true)
                  try {
                    const res = await fetch(`/api/admin/products/${id}/convert`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        targetType: product.productType === 'PHYSICAL' ? 'DIGITAL' : 'PHYSICAL',
                        customPrice: parseFloat(customLinkedPrice),
                      }),
                    })

                    const data = await res.json()

                    if (res.ok) {
                      // Navigate to the new product to let them review/edit it
                      router.push(`/admin/products/${data.product.id}`)
                    } else {
                      alert(data.error || 'Failed to create linked product')
                    }
                  } catch (error) {
                    console.error('Error creating linked product:', error)
                    alert('Failed to create linked product')
                  } finally {
                    setCreatingLinked(false)
                    setShowCreateLinked(false)
                  }
                }}
                disabled={creatingLinked || !customLinkedPrice}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: product.productType === 'PHYSICAL' ? '#7c3aed' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creatingLinked ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: creatingLinked || !customLinkedPrice ? 0.5 : 1,
                }}
              >
                {creatingLinked ? 'Creating...' : 'Create & Edit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Existing Product Modal */}
      {showLinkExisting && product && (
        <LinkExistingProductModal
          product={product}
          onClose={() => setShowLinkExisting(false)}
          onLinked={() => {
            setShowLinkExisting(false)
            fetchProduct()
          }}
        />
      )}
    </div>
  )
}

function AddVariantModal({
  product,
  optionTypes,
  onClose,
  onSaved
}: {
  product: Product
  optionTypes: OptionType[]
  onClose: () => void
  onSaved: () => void
}) {
  const [formData, setFormData] = useState({
    options: {} as Record<string, string>,
    price: product.price,
    stock: 0,
    sku: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (Object.keys(formData.options).length === 0) {
      alert('Please select at least one option')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/products/${product.id}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSaved()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create variant')
      }
    } catch (error) {
      console.error('Error creating variant:', error)
      alert('Failed to create variant')
    } finally {
      setSaving(false)
    }
  }

  const variantName = Object.values(formData.options).filter(Boolean).join(' / ') || 'New Variant'

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        background: '#18181b',
        borderRadius: '16px',
        border: '1px solid #27272a',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Add Variant</h2>
            <p style={{ fontSize: '14px', color: '#71717a', margin: '4px 0 0' }}>{product.name}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            x
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {optionTypes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p style={{ color: '#f59e0b', marginBottom: '12px' }}>
                No option types defined yet.
              </p>
              <p style={{ color: '#71717a', fontSize: '13px' }}>
                Go to Products &gt; Manage Variants to create option types like Size or Color first.
              </p>
            </div>
          ) : (
            <>
              <div style={{
                background: '#27272a',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>Variant Name</div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>{variantName}</div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>Options</label>
                {optionTypes.map(option => (
                  <div key={option.id} style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '13px', color: '#71717a', marginBottom: '6px', display: 'block' }}>{option.name}</label>
                    <select
                      value={formData.options[option.name] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        options: { ...formData.options, [option.name]: e.target.value }
                      })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '14px',
                        background: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '8px',
                        color: '#ffffff',
                        outline: 'none'
                      }}
                    >
                      <option value="">Select {option.name}</option>
                      {option.values.map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>SKU (Optional)</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g., PROD-001-SM-BLK"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    background: '#27272a',
                    border: '1px solid #3f3f46',
                    borderRadius: '8px',
                    color: '#ffffff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>Price</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      background: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', display: 'block' }}>Stock</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '14px',
                      background: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '8px',
                      color: '#ffffff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #27272a',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              background: 'transparent',
              color: '#a1a1aa',
              border: '1px solid #3f3f46',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || optionTypes.length === 0}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              cursor: saving || optionTypes.length === 0 ? 'not-allowed' : 'pointer',
              opacity: saving || optionTypes.length === 0 ? 0.5 : 1
            }}
          >
            {saving ? 'Creating...' : 'Create Variant'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface LinkableProduct {
  id: string
  name: string
  slug: string
  price: number
  productType: 'PHYSICAL' | 'DIGITAL'
  sku: string | null
  images: string[]
}

function LinkExistingProductModal({
  product,
  onClose,
  onLinked
}: {
  product: Product
  onClose: () => void
  onLinked: () => void
}) {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<LinkableProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<LinkableProduct | null>(null)

  useEffect(() => {
    fetchLinkableProducts()
  }, [])

  const fetchLinkableProducts = async (searchTerm = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        productType: product.productType || 'PHYSICAL',
        ...(searchTerm && { search: searchTerm })
      })
      const res = await fetch(`/api/admin/products/linkable?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Error fetching linkable products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchLinkableProducts(value)
    }, 300)
    return () => clearTimeout(timeoutId)
  }

  const handleLink = async () => {
    if (!selectedProduct) return
    setLinking(true)
    try {
      const res = await fetch(`/api/admin/products/${product.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedProductId: selectedProduct.id })
      })

      if (res.ok) {
        onLinked()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to link products')
      }
    } catch (error) {
      console.error('Error linking products:', error)
      alert('Failed to link products')
    } finally {
      setLinking(false)
    }
  }

  const targetType = product.productType === 'PHYSICAL' ? 'Digital' : 'Physical'

  return (
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
        width: '100%',
        maxWidth: '560px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #27272a' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            Link to {targetType} Product
          </h3>
          <p style={{ color: '#a1a1aa', fontSize: '14px', margin: 0 }}>
            Select an existing {targetType.toLowerCase()} product to link with "{product.name}"
          </p>
        </div>

        {/* Search */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #27272a' }}>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={handleSearch}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#27272a',
              border: '1px solid #3f3f46',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {/* Products List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>
              <p style={{ marginBottom: '8px' }}>No available {targetType.toLowerCase()} products found.</p>
              <p style={{ fontSize: '13px' }}>Products must not already be linked to another product.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProduct(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: selectedProduct?.id === p.id ? 'rgba(59, 130, 246, 0.2)' : '#27272a',
                    border: selectedProduct?.id === p.id ? '2px solid #3b82f6' : '1px solid #3f3f46',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        background: '#18181b'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: '#18181b',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#71717a'
                    }}>
                      {p.productType === 'DIGITAL' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px', color: '#fff' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#71717a' }}>
                      {p.sku && <span style={{ marginRight: '8px' }}>SKU: {p.sku}</span>}
                      <span style={{ color: '#10b981', fontWeight: 500 }}>${Number(p.price).toFixed(2)}</span>
                    </div>
                  </div>
                  {selectedProduct?.id === p.id && (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #27272a',
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            disabled={linking}
            style={{
              flex: 1,
              padding: '12px',
              background: '#27272a',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleLink}
            disabled={linking || !selectedProduct}
            style={{
              flex: 1,
              padding: '12px',
              background: product.productType === 'PHYSICAL' ? '#7c3aed' : '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: linking || !selectedProduct ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              opacity: linking || !selectedProduct ? 0.5 : 1,
            }}
          >
            {linking ? 'Linking...' : 'Link Products'}
          </button>
        </div>
      </div>
    </div>
  )
}
