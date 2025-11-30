'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUploader from '@/components/admin/ImageUploader'

interface Category {
  id: string
  name: string
  slug: string
  productType: 'PHYSICAL' | 'DIGITAL'
}

export default function NewProductPage() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<string[]>([])
  const [productType, setProductType] = useState<'PHYSICAL' | 'DIGITAL'>('PHYSICAL')
  const [uploadingFile, setUploadingFile] = useState(false)
  const [digitalFileUrl, setDigitalFileUrl] = useState('')
  const [digitalFileName, setDigitalFileName] = useState('')
  const [digitalFileSize, setDigitalFileSize] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    downloadLimit: '5',
    downloadExpiry: '30',
  })

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [productType])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/admin/categories?productType=${productType}`)
      const data = await res.json()
      setCategories(data || [])
      // Reset category selection when product type changes
      setFormData(prev => ({ ...prev, categoryId: '' }))
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    setDigitalFileName(file.name)
    setDigitalFileSize(file.size)

    try {
      // Create form data for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'digital-products')

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setDigitalFileUrl(data.url)
      } else {
        alert('Failed to upload file')
        setDigitalFileName('')
        setDigitalFileSize(0)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
      setDigitalFileName('')
      setDigitalFileSize(0)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate digital product has a file
    if (productType === 'DIGITAL' && !digitalFileUrl) {
      alert('Please upload a digital file for this product')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          productType,
          images,
          price: parseFloat(formData.price),
          comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          stock: productType === 'DIGITAL' ? 999999 : parseInt(formData.stock), // Digital products have unlimited stock
          weight: formData.weight ? parseFloat(formData.weight) : null,
          printTime: formData.printTime ? parseInt(formData.printTime) : null,
          layerHeight: formData.layerHeight ? parseFloat(formData.layerHeight) : null,
          infill: formData.infill ? parseInt(formData.infill) : null,
          // Digital product fields
          digitalFileUrl: productType === 'DIGITAL' ? digitalFileUrl : null,
          digitalFileName: productType === 'DIGITAL' ? digitalFileName : null,
          digitalFileSize: productType === 'DIGITAL' ? digitalFileSize : null,
          downloadLimit: productType === 'DIGITAL' ? parseInt(formData.downloadLimit) : null,
          downloadExpiry: productType === 'DIGITAL' ? parseInt(formData.downloadExpiry) : null,
          requiresShipping: productType === 'PHYSICAL',
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

      {/* Product Type Toggle */}
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: isMobile ? '20px' : '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontSize: '18px',
          fontWeight: 600,
          marginBottom: '16px',
          margin: 0
        }}>Product Type</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setProductType('PHYSICAL')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '20px',
              borderRadius: '12px',
              border: productType === 'PHYSICAL' ? '2px solid #10b981' : '1px solid #27272a',
              background: productType === 'PHYSICAL' ? 'rgba(16, 185, 129, 0.1)' : '#0a0a0a',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
              Physical Product
            </div>
            <div style={{ fontSize: '13px', color: '#71717a' }}>
              Tangible items that need to be shipped to customers
            </div>
          </button>
          <button
            type="button"
            onClick={() => setProductType('DIGITAL')}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '20px',
              borderRadius: '12px',
              border: productType === 'DIGITAL' ? '2px solid #8b5cf6' : '1px solid #27272a',
              background: productType === 'DIGITAL' ? 'rgba(139, 92, 246, 0.1)' : '#0a0a0a',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
              Digital Product
            </div>
            <div style={{ fontSize: '13px', color: '#71717a' }}>
              Downloadable files like STL, PDFs, or software
            </div>
          </button>
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
              }}>Product Images</h2>

              <ImageUploader
                images={images}
                onChange={setImages}
                maxImages={10}
                folder="products"
              />
            </div>

            {/* Digital File Upload - Only for Digital Products */}
            {productType === 'DIGITAL' && (
              <div style={{
                background: '#18181b',
                border: '1px solid #8b5cf6',
                borderRadius: '16px',
                padding: isMobile ? '20px' : '24px',
              }}>
                <h2 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  marginBottom: '20px',
                  margin: 0,
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
                  Digital File *
                </h2>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  accept=".stl,.obj,.3mf,.gcode,.pdf,.zip,.rar"
                />

                {!digitalFileUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: '2px dashed #3f3f46',
                      borderRadius: '12px',
                      padding: '40px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {uploadingFile ? (
                      <p style={{ color: '#a1a1aa' }}>Uploading...</p>
                    ) : (
                      <>
                        <p style={{ color: '#a1a1aa', marginBottom: '8px' }}>
                          Click to upload the digital file
                        </p>
                        <p style={{ color: '#71717a', fontSize: '13px' }}>
                          Supported: STL, OBJ, 3MF, GCODE, PDF, ZIP, RAR
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{
                    background: '#0a0a0a',
                    borderRadius: '12px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ fontWeight: 500, marginBottom: '4px' }}>{digitalFileName}</p>
                      <p style={{ fontSize: '13px', color: '#71717a' }}>
                        {formatFileSize(digitalFileSize)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDigitalFileUrl('')
                        setDigitalFileName('')
                        setDigitalFileSize(0)
                      }}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px'
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}

                {/* Download Settings */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginTop: '20px'
                }}>
                  <div>
                    <label style={labelStyle}>Download Limit</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.downloadLimit}
                      onChange={(e) => setFormData({ ...formData, downloadLimit: e.target.value })}
                      style={inputStyle}
                      placeholder="5"
                    />
                    <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                      Max downloads per purchase
                    </p>
                  </div>
                  <div>
                    <label style={labelStyle}>Link Expiry (days)</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.downloadExpiry}
                      onChange={(e) => setFormData({ ...formData, downloadExpiry: e.target.value })}
                      style={inputStyle}
                      placeholder="30"
                    />
                    <p style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                      Days until download link expires
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Physical Product: 3D Printing Specs */}
            {productType === 'PHYSICAL' && (
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
            )}
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
                <label style={labelStyle}>
                  Category *
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '12px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: productType === 'PHYSICAL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
                    color: productType === 'PHYSICAL' ? '#10b981' : '#8b5cf6'
                  }}>
                    {productType}
                  </span>
                </label>
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
                  <div style={{
                    fontSize: '12px',
                    color: '#ef4444',
                    marginTop: '8px',
                  }}>
                    No {productType.toLowerCase()} categories found.{' '}
                    <Link href="/admin/categories" style={{ color: '#3b82f6' }}>
                      Create one first
                    </Link>
                  </div>
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

            {/* Inventory - Only for Physical Products */}
            {productType === 'PHYSICAL' && (
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
            )}

            {/* Shipping - Only for Physical Products */}
            {productType === 'PHYSICAL' && (
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
            )}

            {/* Digital Product Info */}
            {productType === 'DIGITAL' && (
              <div style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '16px',
                padding: isMobile ? '20px' : '24px',
              }}>
                <h2 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  color: '#8b5cf6'
                }}>Digital Product</h2>
                <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6 }}>
                  After purchase, customers will receive an email with a secure download link.
                  The link will expire after the set number of days or downloads.
                </p>
              </div>
            )}
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
