'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  sku: string | null
  price: number
  stock: number
  images: string[]
  variants: ProductVariant[]
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

export default function ProductVariantsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [optionTypes, setOptionTypes] = useState<OptionType[]>([])
  const [loading, setLoading] = useState(true)
  const [showOptionModal, setShowOptionModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchOptionTypes()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/admin/products/variants')
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOptionTypes = async () => {
    try {
      const response = await fetch('/api/admin/products/option-types')
      if (response.ok) {
        const data = await response.json()
        setOptionTypes(data.optionTypes)
      }
    } catch (error) {
      console.error('Error fetching option types:', error)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0 }}>Product Variants</h1>
          <p style={{ color: '#71717a', marginTop: '8px' }}>Manage product options and variants</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowOptionModal(true)}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              background: '#27272a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            Manage Option Types
          </button>
          <Link
            href="/admin/products"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              background: 'transparent',
              color: '#a1a1aa',
              border: '1px solid #3f3f46',
              borderRadius: '12px',
              textDecoration: 'none',
            }}
          >
            Back to Products
          </Link>
        </div>
      </div>

      {/* Option Types Overview */}
      <div style={{
        background: '#18181b',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #27272a',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Option Types</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {optionTypes.length === 0 ? (
            <p style={{ color: '#71717a' }}>No option types defined yet. Create option types like Size, Color, Material to add variants to products.</p>
          ) : (
            optionTypes.map(option => (
              <div key={option.id} style={{
                background: '#27272a',
                padding: '12px 16px',
                borderRadius: '10px'
              }}>
                <div style={{ fontWeight: 600, marginBottom: '6px' }}>{option.name}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {option.values.map((value, i) => (
                    <span key={i} style={{
                      fontSize: '12px',
                      background: '#3f3f46',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      color: '#a1a1aa'
                    }}>
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 16px',
            fontSize: '14px',
            background: '#18181b',
            border: '1px solid #3f3f46',
            borderRadius: '10px',
            color: '#ffffff',
            outline: 'none'
          }}
        />
      </div>

      {/* Products with Variants */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#71717a' }}>
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{
          background: '#18181b',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px solid #27272a'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
          <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>No products found</div>
          <div style={{ color: '#71717a' }}>Add products first to create variants</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredProducts.map(product => (
            <ProductVariantCard
              key={product.id}
              product={product}
              optionTypes={optionTypes}
              onVariantsUpdated={fetchProducts}
            />
          ))}
        </div>
      )}

      {/* Option Types Modal */}
      {showOptionModal && (
        <OptionTypesModal
          optionTypes={optionTypes}
          onClose={() => setShowOptionModal(false)}
          onSaved={() => {
            fetchOptionTypes()
            setShowOptionModal(false)
          }}
        />
      )}
    </div>
  )
}

function ProductVariantCard({
  product,
  optionTypes,
  onVariantsUpdated
}: {
  product: Product
  optionTypes: OptionType[]
  onVariantsUpdated: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showAddVariant, setShowAddVariant] = useState(false)

  return (
    <div style={{
      background: '#18181b',
      borderRadius: '16px',
      border: '1px solid #27272a',
      overflow: 'hidden'
    }}>
      {/* Product Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          cursor: 'pointer'
        }}
      >
        {product.images[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              objectFit: 'cover'
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{product.name}</div>
          <div style={{ fontSize: '13px', color: '#71717a' }}>
            SKU: {product.sku || 'N/A'} • Base Price: ${Number(product.price).toFixed(2)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '13px',
            color: '#71717a',
            background: '#27272a',
            padding: '6px 12px',
            borderRadius: '6px'
          }}>
            {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
          </span>
          <span style={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            color: '#71717a'
          }}>
            ▼
          </span>
        </div>
      </div>

      {/* Expanded Variants */}
      {expanded && (
        <div style={{ borderTop: '1px solid #27272a' }}>
          {product.variants.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center' }}>
              <div style={{ color: '#71717a', marginBottom: '16px' }}>
                No variants yet. Add options like Size or Color to create variants.
              </div>
              <button
                onClick={() => setShowAddVariant(true)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                }}
              >
                Add Variant
              </button>
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #27272a' }}>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>Variant</th>
                    <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>SKU</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>Price</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>Stock</th>
                    <th style={{ padding: '12px 24px', textAlign: 'center', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>Active</th>
                    <th style={{ padding: '12px 24px', textAlign: 'right', fontSize: '12px', color: '#71717a', fontWeight: 500 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant, index) => (
                    <tr key={variant.id} style={{ borderBottom: index < product.variants.length - 1 ? '1px solid #27272a' : 'none' }}>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontWeight: 500 }}>{variant.name}</div>
                        <div style={{ fontSize: '12px', color: '#71717a' }}>
                          {Object.entries(variant.options).map(([key, value]) => `${key}: ${value}`).join(' / ')}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: '#a1a1aa' }}>{variant.sku || '-'}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>${Number(variant.price).toFixed(2)}</td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <span style={{
                          color: variant.stock <= 0 ? '#ef4444' : variant.stock <= 5 ? '#f59e0b' : '#10b981'
                        }}>
                          {variant.stock}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                        <span style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: variant.isActive ? '#10b981' : '#71717a',
                          display: 'inline-block'
                        }} />
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            background: '#27272a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginRight: '8px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '6px',
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
              <div style={{ padding: '16px 24px', borderTop: '1px solid #27272a' }}>
                <button
                  onClick={() => setShowAddVariant(true)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: '#27272a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                  }}
                >
                  + Add Variant
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Variant Modal */}
      {showAddVariant && (
        <AddVariantModal
          product={product}
          optionTypes={optionTypes}
          onClose={() => setShowAddVariant(false)}
          onSaved={() => {
            onVariantsUpdated()
            setShowAddVariant(false)
          }}
        />
      )}
    </div>
  )
}

function OptionTypesModal({
  optionTypes,
  onClose,
  onSaved
}: {
  optionTypes: OptionType[]
  onClose: () => void
  onSaved: () => void
}) {
  const [types, setTypes] = useState(optionTypes)
  const [newType, setNewType] = useState({ name: '', values: '' })
  const [saving, setSaving] = useState(false)

  const addOptionType = async () => {
    if (!newType.name || !newType.values) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/products/option-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newType.name,
          values: newType.values.split(',').map(v => v.trim()).filter(v => v)
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTypes([...types, data])
        setNewType({ name: '', values: '' })
      }
    } catch (error) {
      console.error('Error adding option type:', error)
    } finally {
      setSaving(false)
    }
  }

  const deleteOptionType = async (id: string) => {
    if (!confirm('Delete this option type?')) return

    try {
      await fetch(`/api/admin/products/option-types/${id}`, {
        method: 'DELETE',
      })
      setTypes(types.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting option type:', error)
    }
  }

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
          <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>Manage Option Types</h2>
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
            ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Add New Option Type */}
          <div style={{
            background: '#27272a',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <div style={{ fontWeight: 500, marginBottom: '12px' }}>Add New Option Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Option Name (e.g., Size, Color)"
                value={newType.name}
                onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
              <input
                type="text"
                placeholder="Values (comma separated: S, M, L, XL)"
                value={newType.values}
                onChange={(e) => setNewType({ ...newType, values: e.target.value })}
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  background: '#18181b',
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
              <button
                onClick={addOptionType}
                disabled={saving || !newType.name || !newType.values}
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving || !newType.name || !newType.values ? 0.5 : 1
                }}
              >
                {saving ? 'Adding...' : 'Add Option Type'}
              </button>
            </div>
          </div>

          {/* Existing Option Types */}
          <div style={{ fontWeight: 500, marginBottom: '12px' }}>Existing Option Types</div>
          {types.length === 0 ? (
            <p style={{ color: '#71717a', textAlign: 'center', padding: '20px' }}>
              No option types yet. Add one above.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {types.map(type => (
                <div key={type.id} style={{
                  background: '#27272a',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>{type.name}</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {type.values.map((value, i) => (
                        <span key={i} style={{
                          fontSize: '12px',
                          background: '#3f3f46',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          color: '#a1a1aa'
                        }}>
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteOptionType(type.id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #27272a',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onSaved}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
            }}
          >
            Done
          </button>
        </div>
      </div>
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

  // Generate variant name from options
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
            ✕
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {optionTypes.length === 0 ? (
            <p style={{ color: '#f59e0b', textAlign: 'center', padding: '20px' }}>
              Please create option types first (e.g., Size, Color) before adding variants.
            </p>
          ) : (
            <>
              {/* Variant Preview */}
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

              {/* Option Selectors */}
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

              {/* SKU */}
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

              {/* Price and Stock */}
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
