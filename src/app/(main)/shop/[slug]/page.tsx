'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useCart } from '@/lib/cart-store'

interface LinkedProduct {
  id: string
  name: string
  slug: string
  price: string
  productType: 'PHYSICAL' | 'DIGITAL'
  images: string[]
}

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
  linkedProduct?: LinkedProduct | null
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)

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

  const handleBuyNow = async () => {
    if (!product) return
    if (product.productType !== 'DIGITAL' && product.stock === 0) return

    setBuyingNow(true)

    // Add to cart first
    addItem({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.images?.[0] || null,
      quantity,
      productType: product.productType,
    })

    // Go straight to checkout
    router.push('/checkout')
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

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Image Gallery */}
          <div className="lg:col-span-2">
            {/* Main Image */}
            <div className="aspect-square bg-surface rounded-2xl overflow-hidden relative mb-4 max-w-md mx-auto lg:mx-0">
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
              <div className="flex gap-2 overflow-x-auto pb-2 max-w-md mx-auto lg:mx-0">
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
          <div className="lg:col-span-3">
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

            {/* Buy Now & Add to Cart */}
            {(product.productType === 'DIGITAL' || product.stock > 0) && (
              <div className="space-y-3 mb-8">
                {/* Quantity selector for physical products */}
                {product.productType !== 'DIGITAL' && (
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary">Qty:</span>
                    <div className="flex items-center border border-border rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2 hover:bg-surface transition-colors"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 min-w-[50px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="px-3 py-2 hover:bg-surface transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Primary: Buy Now button */}
                <button
                  onClick={handleBuyNow}
                  disabled={buyingNow}
                  className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                    buyingNow
                      ? 'bg-accent/70 text-white cursor-wait'
                      : product.productType === 'DIGITAL'
                        ? 'bg-violet-500 text-white hover:bg-violet-600'
                        : 'bg-accent text-white hover:bg-accent/90'
                  }`}
                >
                  {buyingNow
                    ? 'Processing...'
                    : product.productType === 'DIGITAL'
                      ? 'Buy Now - Instant Download'
                      : `Buy Now - $${(Number(product.price) * quantity).toFixed(2)}`}
                </button>

                {/* Secondary: Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={addedToCart}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all border ${
                    addedToCart
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-transparent border-border text-text-primary hover:bg-surface'
                  }`}
                >
                  {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
                </button>
              </div>
            )}

            {/* Linked Product Option */}
            {product.linkedProduct && (
              <div className="mb-8 p-4 bg-surface rounded-xl border border-border">
                <div className="flex items-center gap-4">
                  {product.linkedProduct.images?.[0] && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-elevated">
                      <Image
                        src={product.linkedProduct.images[0]}
                        alt={product.linkedProduct.name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {product.linkedProduct.productType === 'DIGITAL' ? (
                        <svg className="w-4 h-4 text-violet-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                      <span className="text-sm text-text-secondary">
                        {product.linkedProduct.productType === 'DIGITAL'
                          ? 'Also available as digital download'
                          : 'Also available as physical product'}
                      </span>
                    </div>
                    <div className="text-sm font-medium truncate">
                      {product.linkedProduct.name}
                    </div>
                    <div className="text-lg font-bold mt-1">
                      ${Number(product.linkedProduct.price).toFixed(2)}
                    </div>
                  </div>
                  <Link
                    href={`/shop/${product.linkedProduct.slug}`}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex-shrink-0 ${
                      product.linkedProduct.productType === 'DIGITAL'
                        ? 'bg-violet-500 text-white hover:bg-violet-600'
                        : 'bg-accent text-white hover:bg-accent/90'
                    }`}
                  >
                    View
                  </Link>
                </div>
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
