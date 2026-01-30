import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled } from '@/lib/features'
import { getBrandBySlug, getAllBrandSlugs, BRAND_SLUG_MAP, isValidBrandSlug } from '@/config/brands'
import BrandHero from '@/components/shop/BrandHero'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ brand: string }>
}

export async function generateMetadata({ params }: Props) {
  const { brand: brandSlug } = await params
  const brand = getBrandBySlug(brandSlug)

  if (!brand) {
    return { title: 'Brand Not Found - 47 Industries' }
  }

  return {
    title: `${brand.name} Shop - 47 Industries`,
    description: brand.description,
  }
}

export default async function BrandShopPage({ params }: Props) {
  const { brand: brandSlug } = await params

  // Check if shop is enabled
  const shopEnabled = await isFeatureEnabled('shopEnabled')
  if (!shopEnabled) {
    notFound()
  }

  // Validate brand
  if (!isValidBrandSlug(brandSlug)) {
    notFound()
  }

  const brand = getBrandBySlug(brandSlug)
  if (!brand) {
    notFound()
  }

  // Map slug to Prisma enum value
  const brandKey = BRAND_SLUG_MAP[brandSlug.toLowerCase()]

  // Fetch products for this brand
  const products = await prisma.product.findMany({
    where: {
      brand: brandKey as any,
      active: true,
      productType: 'PHYSICAL',
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          image: true,
        },
        orderBy: { sortOrder: 'asc' },
        take: 1,
      },
    },
    orderBy: [
      { featured: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-text-secondary">
            <Link href="/shop" className="hover:text-text-primary transition-colors">
              Shop
            </Link>
            <span>/</span>
            <span className="text-text-primary">{brand.name}</span>
          </nav>
        </div>

        {/* Brand Hero */}
        <BrandHero brand={brand} productCount={products.length} />

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 text-zinc-500">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-2">No products yet</h3>
            <p className="text-text-secondary mb-8">
              {brand.name} apparel is coming soon!
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 rounded-lg transition-colors"
              style={{ backgroundColor: brand.accentColor, color: 'white' }}
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const images = product.images as string[]
              const price = Number(product.price)
              const comparePrice = product.comparePrice ? Number(product.comparePrice) : null
              const hasDiscount = comparePrice && comparePrice > price

              return (
                <Link
                  key={product.id}
                  href={`/shop/${product.slug}`}
                  className="group"
                >
                  <div className="bg-surface border border-border rounded-xl overflow-hidden transition-all hover:border-border/80 hover:shadow-lg">
                    {/* Product Image */}
                    <div className="aspect-square relative bg-surface-elevated overflow-hidden">
                      {images?.[0] ? (
                        <Image
                          src={images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-text-secondary">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.featured && (
                          <span
                            className="px-2 py-1 text-xs font-medium rounded text-white"
                            style={{ backgroundColor: brand.accentColor }}
                          >
                            Featured
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
                            Sale
                          </span>
                        )}
                      </div>

                      {/* Printful Badge */}
                      {product.fulfillmentType === 'PRINTFUL' && (
                        <div className="absolute bottom-3 right-3">
                          <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded">
                            Print on Demand
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-medium text-text-primary mb-1 line-clamp-2 group-hover:text-text-primary/80 transition-colors">
                        {product.name}
                      </h3>

                      {product.category && (
                        <p className="text-xs text-text-secondary mb-2">
                          {product.category.name}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <span
                          className="text-lg font-bold"
                          style={{ color: brand.accentColor }}
                        >
                          ${price.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm text-text-secondary line-through">
                            ${comparePrice?.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Variants indicator */}
                      {product.variants.length > 0 && (
                        <p className="text-xs text-text-secondary mt-2">
                          Multiple options available
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* Back to Shop */}
        <div className="mt-16 text-center pt-8 border-t border-border">
          <Link
            href="/shop"
            className="inline-flex items-center px-6 py-3 border border-border rounded-lg hover:bg-surface transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Shop
          </Link>
        </div>
      </div>
    </div>
  )
}
