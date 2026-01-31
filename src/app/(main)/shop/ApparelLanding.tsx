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

// Brand colors, descriptions, and images
const BRAND_DETAILS: Record<string, { color: string; gradient: string; tagline: string; description: string; bgImage?: string }> = {
  'FORTY_SEVEN_INDUSTRIES': {
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    tagline: 'Build Different',
    description: 'The flagship collection. Premium apparel for builders, creators, and innovators.',
    bgImage: 'https://files.47industries.com/brand-images/1769871675611-iey2jl7708r-47-industries-brand-photo.png',
  },
  'MOTOREV': {
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    tagline: 'Ride in Style',
    description: 'Official MotoRev merchandise. Rep the ride with premium gear.',
    bgImage: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80',
  },
  'BOOKFADE': {
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    tagline: 'Fresh Cuts, Fresh Style',
    description: 'Professional barber apparel. Look sharp, cut sharp.',
    bgImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80',
  },
}

// Category icons - proper SVG icons matching each category
const CATEGORY_ICONS: Record<string, JSX.Element> = {
  'Hoodies & Sweatshirts': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Hoodie icon */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2L8 6v2a4 4 0 008 0V6l-4-4zM8 6H4l2 16h12l2-16h-4M12 2v4M9 11c0 1.5 1.5 3 3 3s3-1.5 3-3" />
    </svg>
  ),
  'T-Shirts & Tees': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* T-shirt icon */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 2l-4 4 3 2v14h14V8l3-2-4-4H6zM6 2c0 2 2 4 6 4s6-2 6-4" />
    </svg>
  ),
  'Phone Cases': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Phone icon */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  'Accessories': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Sparkle/star icon for accessories */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  'Shorts': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Shorts icon */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h16v3l-3 9h-4l-1-6-1 6H7L4 8V5z" />
    </svg>
  ),
  'Swimwear': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Wave/water icon for swimwear */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0M3 19c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0M3 11c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0" />
    </svg>
  ),
  'Hats & Caps': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Hat/cap icon */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5zM4 10v2c0 2 3.5 4 8 4s8-2 8-4v-2M2 14h20" />
    </svg>
  ),
  'Bags & Totes': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Shopping bag icon */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  'Drinkware': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Mug/cup icon */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2M4 8h14v10a2 2 0 01-2 2H6a2 2 0 01-2-2V8zM8 4h8v4H8V4z" />
    </svg>
  ),
  'Jackets & Outerwear': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {/* Jacket icon */}
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 2l-4 6v14h8v-8h4v8h8V8l-4-6M6 2c0 2 2 4 6 4s6-2 6-4M12 6v4M8 22v-6M16 22v-6" />
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
          const accentColor = brand.key === 'MOTOREV' ? 'blue' : brand.key === 'BOOKFADE' ? 'purple' : 'amber'
          return (
            <Link
              key={brand.id}
              href={`/shop?type=apparel&brand=${brand.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface hover:border-amber-500/50 transition-all min-h-[280px]"
            >
              {/* Background Image */}
              {details.bgImage && (
                <div className="absolute inset-0">
                  <Image
                    src={details.bgImage}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-500"
                  />
                </div>
              )}
              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent`} />
              <div className={`absolute inset-0 bg-gradient-to-br ${details.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />

              <div className="relative p-8 h-full flex flex-col justify-end">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-1 drop-shadow-lg">{brand.name}</h3>
                    <p className={`text-${accentColor}-500 text-sm font-medium`}>{details.tagline}</p>
                  </div>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm">
                    {brand.productCount} items
                  </span>
                </div>
                <p className="text-white/80 text-sm mb-6">{details.description}</p>
                <div className={`flex items-center text-${accentColor}-500 text-sm font-medium group-hover:gap-3 gap-2 transition-all`}>
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
