'use client'

import Link from 'next/link'
import Image from 'next/image'

interface Brand {
  id: string
  key: string
  name: string
  slug: string
  productCount: number
}

interface Category {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  images: string[]
  category: { name: string }
}

interface ApparelLandingProps {
  brands: Brand[]
  categories: Category[]
  featuredProducts: Product[]
  totalCount: number
}

// Brand colors and descriptions
const BRAND_DETAILS: Record<string, { color: string; gradient: string; tagline: string; description: string }> = {
  'FORTY_SEVEN_INDUSTRIES': {
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    tagline: 'Build Different',
    description: 'The flagship collection. Premium apparel for builders, creators, and innovators.',
  },
  'MOTOREV': {
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    tagline: 'Ride in Style',
    description: 'Official MotoRev merchandise. Rep the ride with premium gear.',
  },
  'BOOKFADE': {
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    tagline: 'Fresh Cuts, Fresh Style',
    description: 'Professional barber apparel. Look sharp, cut sharp.',
  },
}

// Category icons
const CATEGORY_ICONS: Record<string, JSX.Element> = {
  'Hoodies & Sweatshirts': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
  'T-Shirts & Tees': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  'Phone Cases': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  'Accessories': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  'Shorts': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4h16v6l-4 8H8l-4-8V4z" />
    </svg>
  ),
  'Swimwear': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012-2v-1a2 2 0 012-2h1.945M6 20.488V20a2 2 0 012-2h8a2 2 0 012 2v.488" />
    </svg>
  ),
  'Hats & Caps': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  'Bags & Totes': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  'Drinkware': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  'Jackets & Outerwear': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
}

export default function ApparelLanding({
  brands,
  categories,
  featuredProducts,
  totalCount,
}: ApparelLandingProps) {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Shop by Brand</h2>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Premium apparel from our family of brands. Each piece is printed on demand with care.
        </p>
      </div>

      {/* Brand Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => {
          const details = BRAND_DETAILS[brand.key] || BRAND_DETAILS['FORTY_SEVEN_INDUSTRIES']
          return (
            <Link
              key={brand.id}
              href={`/shop?type=apparel&brand=${brand.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface hover:border-amber-500/50 transition-all"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${details.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
              <div className="relative p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{brand.name}</h3>
                    <p className="text-amber-500 text-sm font-medium">{details.tagline}</p>
                  </div>
                  <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                    {brand.productCount} items
                  </span>
                </div>
                <p className="text-text-secondary text-sm mb-6">{details.description}</p>
                <div className="flex items-center text-amber-500 text-sm font-medium group-hover:gap-3 gap-2 transition-all">
                  Shop Collection
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          )
        })}

        {/* Shop All Card */}
        <Link
          href="/shop?type=apparel&view=all"
          className="group relative overflow-hidden rounded-2xl border border-dashed border-border hover:border-amber-500/50 transition-all flex items-center justify-center min-h-[200px]"
        >
          <div className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">View All Products</h3>
            <p className="text-text-secondary text-sm">{totalCount} items across all brands</p>
          </div>
        </Link>
      </div>

      {/* Shop by Category */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.slice(0, 10).map((category) => (
            <Link
              key={category.id}
              href={`/shop?type=apparel&category=${category.slug}`}
              className="group p-6 rounded-xl border border-border bg-surface hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-center"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                {CATEGORY_ICONS[category.name] || (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                )}
              </div>
              <h3 className="font-medium text-sm mb-1">{category.name}</h3>
              <p className="text-text-secondary text-xs">{category._count.products} items</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link
              href="/shop?type=apparel&view=all"
              className="text-amber-500 hover:text-amber-400 text-sm font-medium flex items-center gap-1"
            >
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {featuredProducts.slice(0, 10).map((product) => (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="group border border-border rounded-xl overflow-hidden hover:border-amber-500/50 transition-all bg-surface"
              >
                <div className="aspect-square bg-surface-elevated relative overflow-hidden">
                  {product.images?.[0] ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-secondary">
                      No Image
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-text-secondary mb-1">{product.category.name}</p>
                  <h3 className="text-sm font-medium line-clamp-1 group-hover:text-amber-500 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm font-bold mt-1">${product.price.toFixed(2)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
