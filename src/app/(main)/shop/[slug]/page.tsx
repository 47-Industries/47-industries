'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, notFound } from 'next/navigation'
import { useCart } from '@/lib/cart-store'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDesc: string | null
  price: string
  comparePrice: string | null
  images: string[]
  stock: number
  sku: string | null
  material: string | null
  featured: boolean
  productType: 'PHYSICAL' | 'DIGITAL'
  requiresShipping: boolean
  digitalFileUrl: string | null
  digitalFileName: string | null
  category: {
    id: string
    name: string
    slug: string
  }
}

export default function ProductDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const { addItem } = useCart()

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${slug}`)
        if (!res.ok) {
          setProduct(null)
          return
        }
        const data = await res.json()
        setProduct(data.product)
      } catch (error) {
        console.error('Error fetching product:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [slug])

  const handleAddToCart = () => {
    if (!product) return
    // Digital products don't require stock (unlimited downloads)
    if (product.productType !== 'DIGITAL' && product.stock === 0) return

    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.images?.[0] || null,
      quantity,
      productType: product.productType,
    })

    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center">
        <div className="animate-pulse text-text-secondary">Loading...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-text-secondary mb-8">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  const images = product.images || []
  const price = Number(product.price)
  const comparePrice = product.comparePrice ? Number(product.comparePrice) : null
  const discount = comparePrice && comparePrice > price
    ? Math.round((1 - price / comparePrice) * 100)
    : null

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-text-secondary">
          <Link href="/shop" className="hover:text-text-primary transition-colors">
            Shop
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/shop?category=${product.category.slug}`}
            className="hover:text-text-primary transition-colors"
          >
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-text-primary">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div>
            {/* Main Image */}
            <div className="aspect-square bg-surface rounded-2xl overflow-hidden relative mb-4">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-secondary">
                  No Image
                </div>
              )}
              {product.featured && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-accent text-white text-xs font-medium rounded-full">
                  Featured
                </div>
              )}
              {discount && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  {discount}% OFF
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === idx
                        ? 'border-accent'
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      width={80}
                      height={80}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <div className="mb-6">
              <div className="text-sm text-text-secondary mb-2">
                {product.category.name}
              </div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              {product.shortDesc && (
                <p className="text-xl text-text-secondary">
                  {product.shortDesc}
                </p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold">${price.toFixed(2)}</span>
              {comparePrice && comparePrice > price && (
                <span className="text-2xl text-text-secondary line-through">
                  ${comparePrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status / Digital Badge */}
            <div className="mb-6">
              {product.productType === 'DIGITAL' ? (
                <span className="inline-flex items-center gap-2 text-violet-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Digital Download - Instant Delivery
                </span>
              ) : product.stock > 0 ? (
                <span className="inline-flex items-center gap-2 text-green-500">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-red-500">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Out of Stock
                </span>
              )}
            </div>

            {/* Product Details */}
            {(product.sku || product.material) && (
              <div className="border-t border-b border-border py-4 mb-6 space-y-2">
                {product.sku && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">SKU</span>
                    <span>{product.sku}</span>
                  </div>
                )}
                {product.material && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Material</span>
                    <span>{product.material}</span>
                  </div>
                )}
              </div>
            )}

            {/* Quantity & Add to Cart */}
            {(product.productType === 'DIGITAL' || product.stock > 0) && (
              <div className="flex gap-4 mb-8">
                {/* Hide quantity selector for digital products - always 1 */}
                {product.productType !== 'DIGITAL' && (
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-3 hover:bg-surface transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 py-3 min-w-[60px] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-4 py-3 hover:bg-surface transition-colors"
                    >
                      +
                    </button>
                  </div>
                )}

                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all ${
                    addedToCart
                      ? 'bg-green-500 text-white'
                      : product.productType === 'DIGITAL'
                        ? 'bg-violet-500 text-white hover:bg-violet-600'
                        : 'bg-accent text-white hover:bg-accent/90'
                  }`}
                >
                  {addedToCart
                    ? 'Added to Cart!'
                    : product.productType === 'DIGITAL'
                      ? 'Add to Cart - Instant Download'
                      : 'Add to Cart'}
                </button>
              </div>
            )}

            {/* Description */}
            <div className="prose prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-4">Description</h3>
              <div className="text-text-secondary whitespace-pre-line">
                {product.description}
              </div>
            </div>
          </div>
        </div>

        {/* Back to Shop */}
        <div className="mt-12 pt-12 border-t border-border">
          <Link
            href="/shop"
            className="inline-flex items-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  )
}
