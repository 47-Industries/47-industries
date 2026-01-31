'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

// ============================================
// TYPES
// ============================================

interface Product {
  id: string
  name: string
  slug: string
  price: number
  stock: number
  active: boolean
  images: string[]
  category: {
    id: string
    name: string
  }
  sku?: string
  productType: 'PHYSICAL' | 'DIGITAL'
  fulfillmentType?: 'SELF_FULFILLED' | 'PRINTFUL' | null
  brand?: string | null
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  productType: 'PHYSICAL' | 'DIGITAL'
  parentId: string | null
  active: boolean
  _count?: {
    products: number
  }
}

interface StockMovement {
  id: string
  productId: string
  product: { name: string }
  type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  reason: string | null
  createdAt: string
}

interface InventoryAlert {
  id: string
  productId: string
  product: { name: string; stock: number }
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK'
  threshold: number
  isResolved: boolean
  createdAt: string
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function AdminProductsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')
  const activeTab = (['products', 'categories', 'brands', 'inventory'].includes(tabParam || '') ? tabParam : 'products') as 'products' | 'categories' | 'brands' | 'inventory'
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const tabs = [
    { id: 'products', label: 'Products' },
    { id: 'categories', label: 'Categories' },
    { id: 'brands', label: 'Brands' },
    { id: 'inventory', label: 'Inventory' },
  ]

  const handleTabChange = (tabId: string) => {
    router.push(`/admin/products?tab=${tabId}`)
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: '24px',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '16px' : '0'
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: 700,
            marginBottom: '8px',
            margin: 0
          }}>Products</h1>
          <p style={{
            color: '#71717a',
            margin: 0,
            fontSize: isMobile ? '14px' : '16px'
          }}>Manage your product catalog, categories, and inventory</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '1px solid #27272a',
        paddingBottom: '12px',
        overflowX: 'auto'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#a1a1aa',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'products' && <ProductsTab isMobile={isMobile} />}
      {activeTab === 'categories' && <CategoriesTab isMobile={isMobile} />}
      {activeTab === 'brands' && <BrandsTab isMobile={isMobile} />}
      {activeTab === 'inventory' && <InventoryTab />}
    </div>
  )
}

// ============================================
// PRODUCTS TAB
// ============================================

function ProductsTab({ isMobile }: { isMobile: boolean }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [productTypeFilter, setProductTypeFilter] = useState<'PHYSICAL' | 'DIGITAL' | 'APPAREL'>('PHYSICAL')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      // Fetch all products (high limit to get everything)
      const res = await fetch('/api/admin/products?limit=1000')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      } else {
        console.error('Failed to fetch products:', res.status)
        setProducts([])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchProducts()
      } else {
        alert('Failed to delete product')
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('Failed to delete product')
    }
  }

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const product = products.find(p => p.id === id)
      if (!product) return

      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          active: !currentActive,
        }),
      })

      if (res.ok) {
        fetchProducts()
      }
    } catch (error) {
      console.error('Failed to update product:', error)
    }
  }

  // Filter products by type
  // Note: productType/fulfillmentType can be null/undefined for older products
  // Treat missing productType as PHYSICAL, missing fulfillmentType as SELF_FULFILLED
  const filteredProducts = products.filter(p => {
    const pType = p.productType || 'PHYSICAL'
    const fType = p.fulfillmentType

    if (productTypeFilter === 'APPAREL') {
      return pType === 'PHYSICAL' && fType === 'PRINTFUL'
    } else if (productTypeFilter === 'PHYSICAL') {
      // Show physical products that are NOT Printful (including null/undefined)
      return pType === 'PHYSICAL' && fType !== 'PRINTFUL'
    } else {
      return pType === 'DIGITAL'
    }
  })
  const physicalCount = products.filter(p => (p.productType || 'PHYSICAL') === 'PHYSICAL' && p.fulfillmentType !== 'PRINTFUL').length
  const digitalCount = products.filter(p => p.productType === 'DIGITAL').length
  const apparelCount = products.filter(p => (p.productType || 'PHYSICAL') === 'PHYSICAL' && p.fulfillmentType === 'PRINTFUL').length

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ color: '#71717a', fontSize: isMobile ? '14px' : '16px' }}>Loading products...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Product Type Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        background: '#18181b',
        padding: '4px',
        borderRadius: '12px',
        width: 'fit-content',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setProductTypeFilter('PHYSICAL')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            background: productTypeFilter === 'PHYSICAL' ? '#10b981' : 'transparent',
            color: productTypeFilter === 'PHYSICAL' ? '#fff' : '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          Physical Products
          <span style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '12px',
            background: productTypeFilter === 'PHYSICAL' ? 'rgba(255,255,255,0.2)' : '#27272a',
            color: productTypeFilter === 'PHYSICAL' ? '#fff' : '#71717a'
          }}>
            {physicalCount}
          </span>
        </button>
        <button
          onClick={() => setProductTypeFilter('APPAREL')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            background: productTypeFilter === 'APPAREL' ? '#f59e0b' : 'transparent',
            color: productTypeFilter === 'APPAREL' ? '#fff' : '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Apparel
          <span style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '12px',
            background: productTypeFilter === 'APPAREL' ? 'rgba(255,255,255,0.2)' : '#27272a',
            color: productTypeFilter === 'APPAREL' ? '#fff' : '#71717a'
          }}>
            {apparelCount}
          </span>
        </button>
        <button
          onClick={() => setProductTypeFilter('DIGITAL')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            background: productTypeFilter === 'DIGITAL' ? '#7c3aed' : 'transparent',
            color: productTypeFilter === 'DIGITAL' ? '#fff' : '#a1a1aa',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Digital Downloads
          <span style={{
            padding: '2px 8px',
            borderRadius: '10px',
            fontSize: '12px',
            background: productTypeFilter === 'DIGITAL' ? 'rgba(255,255,255,0.2)' : '#27272a',
            color: productTypeFilter === 'DIGITAL' ? '#fff' : '#71717a'
          }}>
            {digitalCount}
          </span>
        </button>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {productTypeFilter === 'APPAREL' ? (
          <Link
            href="/admin/printful"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              background: '#f59e0b',
              color: '#ffffff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync from Printful
          </Link>
        ) : (
          <Link
            href="/admin/products/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 20px',
              background: productTypeFilter === 'DIGITAL' ? '#7c3aed' : '#10b981',
              color: '#ffffff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            + Add {productTypeFilter === 'DIGITAL' ? 'Digital' : 'Physical'} Product
          </Link>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: productTypeFilter === 'DIGITAL'
              ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
              : productTypeFilter === 'APPAREL'
              ? 'linear-gradient(135deg, #f59e0b, #fbbf24)'
              : 'linear-gradient(135deg, #10b981, #34d399)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.3
          }}>
            {productTypeFilter === 'DIGITAL' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            ) : productTypeFilter === 'APPAREL' ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            )}
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
            {productTypeFilter === 'DIGITAL'
              ? 'No digital downloads yet'
              : productTypeFilter === 'APPAREL'
              ? 'No apparel products yet'
              : 'No physical products yet'
            }
          </h3>
          <p style={{ color: '#71717a', margin: '0 0 24px 0' }}>
            {productTypeFilter === 'DIGITAL'
              ? 'Start by adding your first digital download (STL files, etc.)'
              : productTypeFilter === 'APPAREL'
              ? 'Sync your first apparel products from Printful'
              : 'Start by adding your first physical product to the catalog'
            }
          </p>
          {productTypeFilter === 'APPAREL' ? (
            <Link
              href="/admin/printful"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 24px',
                background: '#f59e0b',
                color: '#ffffff',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Go to Printful Sync
            </Link>
          ) : (
            <Link
              href="/admin/products/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '12px 24px',
                background: productTypeFilter === 'DIGITAL' ? '#7c3aed' : '#10b981',
                color: '#ffffff',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              + Add Your First {productTypeFilter === 'DIGITAL' ? 'Digital Download' : 'Product'}
            </Link>
          )}
        </div>
      ) : isMobile ? (
        // Mobile: Card View
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      background: '#27272a'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#27272a',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#71717a'
                  }}>
                    {product.productType === 'DIGITAL' ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{product.name}</div>
                  <div style={{ fontSize: '12px', color: '#71717a', marginBottom: '4px' }}>{product.category.name}</div>
                  <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 500 }}>${Number(product.price).toFixed(2)}</div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid #27272a'
              }}>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#a1a1aa' }}>
                  <span>{product.productType === 'DIGITAL' ? 'Unlimited' : `Stock: ${product.stock}`}</span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: product.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: product.active ? '#10b981' : '#ef4444',
                    fontSize: '11px',
                    fontWeight: 500
                  }}>
                    {product.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <Link
                  href={`/admin/products/${product.id}`}
                  style={{
                    padding: '6px 12px',
                    background: '#27272a',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop: Table View
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #27272a' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Product</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Price</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Stock</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 600, color: '#71717a', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #27272a' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {product.images && product.images[0] ? (
                        <img src={product.images[0]} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', background: '#27272a' }} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', background: '#27272a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a' }}>
                          {product.productType === 'DIGITAL' ? (
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
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '2px' }}>{product.name}</div>
                        {product.sku && <div style={{ fontSize: '12px', color: '#71717a' }}>SKU: {product.sku}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#a1a1aa' }}>{product.category.name}</td>
                  <td style={{ padding: '16px', fontSize: '14px', fontWeight: 500, color: '#10b981' }}>${Number(product.price).toFixed(2)}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: product.productType === 'DIGITAL' ? '#a1a1aa' : product.stock > 0 ? '#ffffff' : '#ef4444' }}>
                    {product.productType === 'DIGITAL' ? 'Unlimited' : product.stock}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button
                      onClick={() => toggleActive(product.id, product.active)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        background: product.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: product.active ? '#10b981' : '#ef4444',
                      }}
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        style={{
                          padding: '8px 16px',
                          background: '#27272a',
                          color: '#ffffff',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 500,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </div>
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

// ============================================
// CATEGORIES TAB
// ============================================

function CategoriesTab({ isMobile }: { isMobile: boolean }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
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
        setCategories(data.categories || [])
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
    const productCount = category._count?.products || 0
    if (productCount > 0) {
      alert(`Cannot delete category with ${productCount} products. Move or delete products first.`)
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

  const physicalCategories = categories.filter(c => c.productType === 'PHYSICAL')
  const digitalCategories = categories.filter(c => c.productType === 'DIGITAL')

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#a1a1aa' }}>
        Loading categories...
      </div>
    )
  }

  return (
    <div>
      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'PHYSICAL', 'DIGITAL'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                background: filter === type ? '#3b82f6' : '#27272a',
                color: '#fff',
              }}
            >
              {type === 'ALL' ? 'All' : type === 'PHYSICAL' ? 'Physical' : 'Digital'}
            </button>
          ))}
        </div>
        <button
          onClick={() => openModal()}
          style={{
            padding: '10px 20px',
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

      {/* Categories Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Physical Categories */}
        {(filter === 'ALL' || filter === 'PHYSICAL') && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#10b981' }}>
              Physical Products ({physicalCategories.length})
            </h3>
            {physicalCategories.length === 0 ? (
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#71717a' }}>
                No physical categories yet
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {physicalCategories.map(category => (
                  <CategoryCard key={category.id} category={category} onEdit={() => openModal(category)} onDelete={() => handleDelete(category)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Digital Categories */}
        {(filter === 'ALL' || filter === 'DIGITAL') && (
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#8b5cf6' }}>
              Digital Products ({digitalCategories.length})
            </h3>
            {digitalCategories.length === 0 ? (
              <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#71717a' }}>
                No digital categories yet
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                {digitalCategories.map(category => (
                  <CategoryCard key={category.id} category={category} onEdit={() => openModal(category)} onDelete={() => handleDelete(category)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
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
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Optional description"
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
                    Physical
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
                    Digital
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#a1a1aa', cursor: 'pointer' }}>
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

function CategoryCard({ category, onEdit, onDelete }: { category: Category; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{
      background: '#18181b',
      border: '1px solid #27272a',
      borderRadius: '12px',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{category.name}</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              background: category.productType === 'PHYSICAL' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)',
              color: category.productType === 'PHYSICAL' ? '#10b981' : '#8b5cf6'
            }}>
              {category.productType}
            </span>
            {!category.active && (
              <span style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#ef4444'
              }}>
                Inactive
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={onEdit} style={{ padding: '4px 10px', background: '#27272a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            Edit
          </button>
          <button onClick={onDelete} style={{ padding: '4px 10px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
            Delete
          </button>
        </div>
      </div>
      {category.description && (
        <p style={{ fontSize: '13px', color: '#71717a', margin: '8px 0 0 0' }}>{category.description}</p>
      )}
      <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #27272a' }}>
        {category._count?.products || 0} {(category._count?.products || 0) === 1 ? 'product' : 'products'}
      </div>
    </div>
  )
}

// ============================================
// BRANDS TAB
// ============================================

interface BrandConfig {
  id: string
  key: string
  name: string
  slug: string
  tagline: string | null
  description: string | null
  accentColor: string | null
  logo: string | null
  active: boolean
  projectId: string | null
  project: {
    id: string
    title: string
    slug: string
  } | null
  productCount: number
}

interface Project {
  id: string
  title: string
  slug: string
}

function BrandsTab({ isMobile }: { isMobile: boolean }) {
  const [brands, setBrands] = useState<BrandConfig[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBrand, setEditingBrand] = useState<BrandConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    accentColor: '#f59e0b',
    logo: '',
    projectId: '',
    active: true,
  })

  useEffect(() => {
    fetchBrands()
    fetchProjects()
  }, [])

  const fetchBrands = async () => {
    try {
      const res = await fetch('/api/admin/brands?includeInactive=true')
      if (res.ok) {
        const data = await res.json()
        setBrands(data.brands || [])
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/admin/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    }
  }

  const openModal = (brand?: BrandConfig) => {
    if (brand) {
      setEditingBrand(brand)
      setFormData({
        name: brand.name,
        slug: brand.slug,
        tagline: brand.tagline || '',
        description: brand.description || '',
        accentColor: brand.accentColor || '#f59e0b',
        logo: brand.logo || '',
        projectId: brand.projectId || '',
        active: brand.active,
      })
    } else {
      setEditingBrand(null)
      setFormData({
        name: '',
        slug: '',
        tagline: '',
        description: '',
        accentColor: '#f59e0b',
        logo: '',
        projectId: '',
        active: true,
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBrand(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingBrand
        ? `/api/admin/brands/${editingBrand.id}`
        : '/api/admin/brands'
      const method = editingBrand ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectId: formData.projectId || null,
        }),
      })

      if (res.ok) {
        closeModal()
        fetchBrands()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save brand')
      }
    } catch (error) {
      console.error('Failed to save brand:', error)
      alert('Failed to save brand')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (brand: BrandConfig) => {
    if (brand.productCount > 0) {
      alert(`Cannot delete brand with ${brand.productCount} products. Remove products first.`)
      return
    }

    if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/brands/${brand.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchBrands()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete brand')
      }
    } catch (error) {
      console.error('Failed to delete brand:', error)
      alert('Failed to delete brand')
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#a1a1aa' }}>
        Loading brands...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <p style={{ color: '#71717a', fontSize: '14px', margin: 0 }}>
            Manage apparel brands. Brands can be linked to portfolio projects.
          </p>
        </div>
        <button
          onClick={() => openModal()}
          style={{
            padding: '10px 20px',
            background: '#f59e0b',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          + Add Brand
        </button>
      </div>

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.3
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>No brands yet</h3>
          <p style={{ color: '#71717a', margin: '0 0 24px 0' }}>
            Create your first brand for apparel products
          </p>
          <button
            onClick={() => openModal()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px',
              background: '#f59e0b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            + Create Your First Brand
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {brands.map(brand => (
            <div
              key={brand.id}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '20px',
                borderLeft: `4px solid ${brand.accentColor || '#f59e0b'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', background: '#27272a' }} />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: brand.accentColor || '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: '16px'
                    }}>
                      {brand.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '2px' }}>{brand.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#71717a' }}>/{brand.slug}</span>
                      {!brand.active && (
                        <span style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#ef4444'
                        }}>
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => openModal(brand)}
                    style={{ padding: '6px 12px', background: '#27272a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(brand)}
                    style={{ padding: '6px 12px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {brand.tagline && (
                <p style={{ fontSize: '13px', color: '#a1a1aa', margin: '0 0 8px 0', fontStyle: 'italic' }}>
                  "{brand.tagline}"
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #27272a' }}>
                <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                  <span style={{ fontWeight: 600, color: brand.accentColor || '#f59e0b' }}>{brand.productCount}</span> products
                </div>
                {brand.project && (
                  <div style={{ fontSize: '12px', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Linked to: <span style={{ color: '#3b82f6' }}>{brand.project.title}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
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
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>
              {editingBrand ? 'Edit Brand' : 'Create Brand'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                  Brand Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value
                    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    setFormData({ ...formData, name, slug: editingBrand ? formData.slug : slug })
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="e.g., BookFade"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                  URL Slug *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#71717a', fontSize: '14px' }}>/shop/brands/</span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    style={{
                      flex: 1,
                      padding: '12px 16px',
                      background: '#0a0a0a',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    placeholder="bookfade"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                  Tagline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  placeholder="Professional barber apparel"
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                    minHeight: '80px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="Brand description for the shop page..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                    Accent Color
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      style={{
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        border: '2px solid #27272a',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      style={{
                        flex: 1,
                        padding: '12px',
                        background: '#0a0a0a',
                        border: '1px solid #27272a',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '13px',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                    Logo URL
                  </label>
                  <input
                    type="text"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#0a0a0a',
                      border: '1px solid #27272a',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#a1a1aa', marginBottom: '8px' }}>
                  Link to Portfolio Project (Optional)
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: '#0a0a0a',
                    border: '1px solid #27272a',
                    borderRadius: '12px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                >
                  <option value="">No project linked</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.title}</option>
                  ))}
                </select>
                <p style={{ fontSize: '12px', color: '#71717a', marginTop: '6px' }}>
                  Linking to a project shows "Shop Merch" on the project page
                </p>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#a1a1aa', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: '#f59e0b' }}
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
                    background: saving ? '#27272a' : '#f59e0b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  {saving ? 'Saving...' : editingBrand ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// INVENTORY TAB
// ============================================

function InventoryTab() {
  const [products, setProducts] = useState<any[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [alerts, setAlerts] = useState<InventoryAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [inventoryView, setInventoryView] = useState<'overview' | 'movements' | 'alerts'>('overview')
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all')
  const [showAdjustModal, setShowAdjustModal] = useState<any>(null)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const [productsRes, movementsRes, alertsRes] = await Promise.all([
        fetch('/api/admin/inventory'),
        fetch('/api/admin/inventory/movements'),
        fetch('/api/admin/inventory/alerts'),
      ])

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.products || [])
      }
      if (movementsRes.ok) {
        const data = await movementsRes.json()
        setMovements(data.movements || [])
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    }
    setLoading(false)
  }

  const LOW_STOCK_THRESHOLD = 10

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(search.toLowerCase()))

    let matchesStock = true
    if (stockFilter === 'low') {
      matchesStock = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD
    } else if (stockFilter === 'out') {
      matchesStock = product.stock === 0
    } else if (stockFilter === 'healthy') {
      matchesStock = product.stock > LOW_STOCK_THRESHOLD
    }

    return matchesSearch && matchesStock
  })

  const stats = {
    totalProducts: products.length,
    lowStock: products.filter((p: any) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD).length,
    outOfStock: products.filter((p: any) => p.stock === 0).length,
    totalValue: products.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0),
    activeAlerts: alerts.filter(a => !a.isResolved).length,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
        <div style={{ color: '#71717a' }}>Loading inventory...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '4px' }}>Total Products</p>
          <p style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalProducts}</p>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '4px' }}>Low Stock</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#facc15' }}>{stats.lowStock}</p>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '4px' }}>Out of Stock</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>{stats.outOfStock}</p>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '16px' }}>
          <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '4px' }}>Inventory Value</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[
          { id: 'overview', label: 'Stock Overview' },
          { id: 'movements', label: 'Movements' },
          { id: 'alerts', label: `Alerts (${stats.activeAlerts})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setInventoryView(tab.id as any)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              background: inventoryView === tab.id ? '#27272a' : 'transparent',
              color: inventoryView === tab.id ? '#fff' : '#71717a',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {inventoryView === 'overview' && (
        <div>
          {/* Search & Filter */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '10px 16px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { value: 'all', label: 'All' },
                { value: 'low', label: 'Low' },
                { value: 'out', label: 'Out' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setStockFilter(f.value as any)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    background: stockFilter === f.value ? '#3b82f6' : '#27272a',
                    color: '#fff',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products List */}
          <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
            {filteredProducts.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
                No products found
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272a' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>Product</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>SKU</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>Stock</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: '#71717a', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product: any) => {
                    const status = product.stock === 0 ? 'out' : product.stock <= LOW_STOCK_THRESHOLD ? 'low' : 'healthy'
                    return (
                      <tr key={product.id} style={{ borderBottom: '1px solid #27272a' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 500 }}>{product.name}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: '#71717a', fontFamily: 'monospace' }}>{product.sku || '-'}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: 600, color: status === 'out' ? '#ef4444' : status === 'low' ? '#facc15' : '#10b981' }}>
                          {product.stock}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 500,
                            background: status === 'out' ? 'rgba(239, 68, 68, 0.2)' : status === 'low' ? 'rgba(250, 204, 21, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: status === 'out' ? '#ef4444' : status === 'low' ? '#facc15' : '#10b981',
                          }}>
                            {status === 'out' ? 'Out' : status === 'low' ? 'Low' : 'OK'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            onClick={() => setShowAdjustModal(product)}
                            style={{
                              padding: '6px 12px',
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#3b82f6',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '12px',
                              cursor: 'pointer',
                            }}
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {inventoryView === 'movements' && (
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', overflow: 'hidden' }}>
          {movements.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#71717a' }}>
              No stock movements yet
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #27272a' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a' }}>Product</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a' }}>Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a' }}>Qty</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#71717a' }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #27272a' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#71717a' }}>{new Date(m.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>{m.product?.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        background: m.type === 'IN' ? 'rgba(16, 185, 129, 0.2)' : m.type === 'OUT' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: m.type === 'IN' ? '#10b981' : m.type === 'OUT' ? '#ef4444' : '#3b82f6',
                      }}>
                        {m.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: m.quantity >= 0 ? '#10b981' : '#ef4444' }}>
                      {m.quantity >= 0 ? '+' : ''}{m.quantity}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#71717a' }}>{m.reason || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {inventoryView === 'alerts' && (
        <div>
          {alerts.filter(a => !a.isResolved).length === 0 ? (
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
              <svg className="w-8 h-8 mx-auto mb-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p style={{ color: '#71717a' }}>No active alerts</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.filter(a => !a.isResolved).map(alert => (
                <div key={alert.id} style={{
                  background: '#18181b',
                  border: `1px solid ${alert.type === 'OUT_OF_STOCK' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(250, 204, 21, 0.5)'}`,
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>{alert.product?.name}</p>
                    <p style={{ fontSize: '13px', color: '#71717a' }}>
                      {alert.type === 'OUT_OF_STOCK' ? 'Out of stock' : `Low stock (${alert.product?.stock})`}
                    </p>
                  </div>
                  <button
                    onClick={async () => {
                      await fetch(`/api/admin/inventory/alerts/${alert.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isResolved: true }),
                      })
                      fetchInventory()
                    }}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && (
        <AdjustStockModal
          product={showAdjustModal}
          onClose={() => setShowAdjustModal(null)}
          onSaved={() => {
            setShowAdjustModal(null)
            fetchInventory()
          }}
        />
      )}
    </div>
  )
}

function AdjustStockModal({ product, onClose, onSaved }: { product: any; onClose: () => void; onSaved: () => void }) {
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'add' | 'subtract'>('add')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/inventory/${product.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: adjustmentType,
          quantity: parseInt(quantity),
          reason,
        }),
      })

      if (res.ok) {
        onSaved()
      } else {
        alert('Failed to adjust stock')
      }
    } catch (error) {
      alert('Failed to adjust stock')
    } finally {
      setLoading(false)
    }
  }

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
        padding: '24px',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Adjust Stock</h2>

        <div style={{ background: '#0a0a0a', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <p style={{ fontWeight: 500 }}>{product.name}</p>
          <p style={{ fontSize: '13px', color: '#71717a' }}>Current stock: {product.stock}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['add', 'subtract', 'set'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setAdjustmentType(type as any)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  background: adjustmentType === type ? '#3b82f6' : '#27272a',
                  color: '#fff',
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <input
            type="number"
            required
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantity"
            style={{
              width: '100%',
              padding: '12px',
              background: '#0a0a0a',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              marginBottom: '12px',
              outline: 'none'
            }}
          />

          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            style={{
              width: '100%',
              padding: '12px',
              background: '#0a0a0a',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              marginBottom: '16px',
              outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                background: '#27272a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !quantity}
              style={{
                flex: 1,
                padding: '12px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                opacity: loading || !quantity ? 0.5 : 1,
              }}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
