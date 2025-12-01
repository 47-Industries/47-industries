'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
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
        }}>Loading products...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        marginBottom: isMobile ? '24px' : '32px',
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
          }}>Manage your product catalog</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            href="/admin/products/variants"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: isMobile ? '10px 20px' : '12px 24px',
              background: 'transparent',
              color: '#a1a1aa',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              border: '1px solid #3f3f46',
              whiteSpace: 'nowrap',
            }}
          >
            Manage Variants
          </Link>
          <Link
            href="/admin/products/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: isMobile ? '10px 20px' : '12px 24px',
              background: '#3b82f6',
              color: '#ffffff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6'
            }}
          >
            + Add Product
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{
          background: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '16px',
          padding: isMobile ? '32px 16px' : '48px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.2
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h3 style={{
            fontSize: isMobile ? '20px' : '24px',
            fontWeight: 700,
            marginBottom: '8px'
          }}>No products yet</h3>
          <p style={{
            color: '#71717a',
            margin: '0 0 24px 0',
            fontSize: isMobile ? '14px' : '16px'
          }}>
            Start by adding your first product to the catalog
          </p>
          <Link
            href="/admin/products/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#ffffff',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6'
            }}
          >
            + Add Your First Product
          </Link>
        </div>
      ) : isMobile ? (
        // Mobile: Card View
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '12px'
              }}>
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
                    color: '#71717a',
                    fontSize: '24px'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '4px'
                  }}>{product.name}</div>
                  <div style={{
                    fontSize: '12px',
                    color: '#71717a',
                    marginBottom: '4px'
                  }}>{product.category.name}</div>
                  <div style={{
                    fontSize: '14px',
                    color: '#10b981',
                    fontWeight: 500
                  }}>${Number(product.price).toFixed(2)}</div>
                </div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid #27272a'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '12px',
                  color: '#a1a1aa'
                }}>
                  <span>Stock: {product.stock}</span>
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
                <div style={{ display: 'flex', gap: '8px' }}>
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
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid #27272a'
              }}>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Product</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Category</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Price</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Stock</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Status</th>
                <th style={{
                  padding: '16px',
                  textAlign: 'right',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#71717a',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr
                  key={product.id}
                  style={{
                    borderBottom: '1px solid #27272a',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0a0a0a'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            background: '#27272a'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '48px',
                          height: '48px',
                          background: '#27272a',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#71717a'
                        }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <div style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          marginBottom: '2px'
                        }}>{product.name}</div>
                        {product.sku && (
                          <div style={{
                            fontSize: '12px',
                            color: '#71717a'
                          }}>SKU: {product.sku}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: '#a1a1aa'
                  }}>{product.category.name}</td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#10b981'
                  }}>${Number(product.price).toFixed(2)}</td>
                  <td style={{
                    padding: '16px',
                    fontSize: '14px',
                    color: product.stock > 0 ? '#ffffff' : '#ef4444'
                  }}>{product.stock}</td>
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
                        transition: 'all 0.2s'
                      }}
                    >
                      {product.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td style={{
                    padding: '16px',
                    textAlign: 'right'
                  }}>
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
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#3f3f46'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#27272a'
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
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
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
