'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AffiliateTracker from '@/components/affiliate/AffiliateTracker'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  comparePrice: number | null
  images: string[]
  stock: number
  featured: boolean
  shortDesc: string | null
  digitalFileName?: string | null
  category: {
    id: string
    name: string
    slug: string
    productType: string
  }
}

interface ShopClientProps {
  initialProducts: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  isDigital: boolean
  isApparel?: boolean
  activeCategory: string | null
  searchQuery: string | null
}

export default function ShopClient({
  initialProducts,
  pagination,
  isDigital,
  isApparel = false,
  activeCategory,
  searchQuery,
}: ShopClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [currentPage, setCurrentPage] = useState(pagination.page)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(pagination.page < pagination.totalPages)
  const [totalProducts, setTotalProducts] = useState(pagination.total)

  // Reset state when filters change (initialProducts changes)
  useEffect(() => {
    setProducts(initialProducts)
    setCurrentPage(pagination.page)
    setHasMore(pagination.page < pagination.totalPages)
    setTotalProducts(pagination.total)
  }, [initialProducts, pagination.page, pagination.totalPages, pagination.total])

  const loadMore = async () => {
    setLoading(true)
    try {
      const nextPage = currentPage + 1
      const type = isDigital ? 'digital' : isApparel ? 'apparel' : 'physical'
      const params = new URLSearchParams({
        type,
        page: String(nextPage),
      })
      if (activeCategory) params.set('category', activeCategory)
      if (searchQuery) params.set('search', searchQuery)

      const res = await fetch(`/api/shop/products?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(prev => [...prev, ...data.products])
        setCurrentPage(nextPage)
        setHasMore(nextPage < data.pagination.totalPages)
        setTotalProducts(data.pagination.total)
      }
    } catch (error) {
      console.error('Failed to load more products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Affiliate Tracking */}
      <Suspense fallback={null}>
        <AffiliateTracker />
      </Suspense>

      {/* Product Grid - 4 columns on lg, 5 columns on xl */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product) => {
          const primaryImage = product.images?.[0] || null

          return (
            <Link
              key={product.id}
              href={`/shop/${product.slug}`}
              className="group border border-border rounded-xl overflow-hidden hover:border-accent/50 transition-all bg-surface"
            >
              <div className="aspect-square bg-surface-elevated relative flex items-center justify-center overflow-hidden">
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-text-secondary text-xs">No Image</div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.featured && (
                    <div className="px-2 py-0.5 bg-accent text-white text-[10px] font-medium rounded-full">
                      Featured
                    </div>
                  )}
                  {isDigital && (
                    <div className="px-2 py-0.5 bg-violet-500 text-white text-[10px] font-medium rounded-full flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Digital
                    </div>
                  )}
                  {isApparel && (
                    <div className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-medium rounded-full flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Apparel
                    </div>
                  )}
                </div>

                {/* Out of stock - only for physical products */}
                {!isDigital && product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] text-text-secondary truncate">
                    {product.category.name}
                  </span>
                  {isDigital && product.digitalFileName && (
                    <span className="text-[10px] text-violet-400">
                      {getFileExtension(product.digitalFileName)}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold group-hover:text-accent transition-colors line-clamp-1">
                  {product.name}
                </h3>
                {product.shortDesc && (
                  <p className="text-[11px] text-text-secondary line-clamp-2 mb-1">
                    {product.shortDesc}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-auto">
                  <span className="text-base font-bold">
                    ${product.price.toFixed(2)}
                  </span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span className="text-xs text-text-secondary line-through">
                      ${product.comparePrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className={`inline-flex items-center px-8 py-3 border border-border rounded-lg font-medium transition-all ${
              loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-surface hover:border-accent/50'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </>
            ) : (
              <>
                Load More
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
          <p className="mt-2 text-sm text-text-secondary">
            Showing {products.length} of {totalProducts} products
          </p>
        </div>
      )}

      {/* Show count when all loaded */}
      {!hasMore && products.length > 0 && (
        <p className="mt-10 text-center text-sm text-text-secondary">
          Showing all {products.length} products
        </p>
      )}
    </>
  )
}

function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext ? `.${ext}` : ''
}
