import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'

interface SearchParams {
  category?: string
  search?: string
  page?: string
  type?: 'physical' | 'digital'
}

async function getProducts(searchParams: SearchParams) {
  const page = parseInt(searchParams.page || '1')
  const limit = 12
  const skip = (page - 1) * limit
  const productType = searchParams.type === 'digital' ? 'DIGITAL' : 'PHYSICAL'

  const where: any = {
    active: true,
    productType,
  }

  if (searchParams.category) {
    where.category = { slug: searchParams.category }
  }

  if (searchParams.search) {
    where.OR = [
      { name: { contains: searchParams.search } },
      { description: { contains: searchParams.search } },
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            productType: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ])

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

async function getCategories(productType: 'PHYSICAL' | 'DIGITAL') {
  return prisma.category.findMany({
    where: {
      active: true,
      productType,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      productType: true,
      _count: {
        select: {
          products: { where: { active: true } },
        },
      },
    },
    orderBy: { name: 'asc' },
  })
}

async function getProductCounts() {
  const [physical, digital] = await Promise.all([
    prisma.product.count({ where: { active: true, productType: 'PHYSICAL' } }),
    prisma.product.count({ where: { active: true, productType: 'DIGITAL' } }),
  ])
  return { physical, digital }
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const productType = params.type === 'digital' ? 'DIGITAL' : 'PHYSICAL'
  const isDigital = productType === 'DIGITAL'

  const [{ products, pagination }, categories, counts] = await Promise.all([
    getProducts(params),
    getCategories(productType),
    getProductCounts(),
  ])

  const activeCategory = params.category || null

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Shop</h1>
          <p className="text-xl text-text-secondary max-w-2xl">
            {isDigital
              ? 'Digital files ready for instant download'
              : 'High-quality 3D printed products, ready to ship'
            }
          </p>
        </div>

        {/* Product Type Toggle */}
        <div className="mb-8">
          <div className="inline-flex rounded-xl bg-surface border border-border p-1">
            <Link
              href="/shop?type=physical"
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                !isDigital
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Physical Products
                <span className={`px-2 py-0.5 rounded-full text-xs ${!isDigital ? 'bg-white/20' : 'bg-border'}`}>
                  {counts.physical}
                </span>
              </span>
            </Link>
            <Link
              href="/shop?type=digital"
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                isDigital
                  ? 'bg-violet-500 text-white shadow-lg'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Digital Downloads
                <span className={`px-2 py-0.5 rounded-full text-xs ${isDigital ? 'bg-white/20' : 'bg-border'}`}>
                  {counts.digital}
                </span>
              </span>
            </Link>
          </div>
        </div>

        {/* Search Bar */}
        <form className="mb-8">
          <input type="hidden" name="type" value={isDigital ? 'digital' : 'physical'} />
          <div className="relative max-w-md">
            <input
              type="text"
              name="search"
              defaultValue={params.search || ''}
              placeholder={`Search ${isDigital ? 'digital' : 'physical'} products...`}
              className="w-full px-4 py-3 pl-12 bg-surface border border-border rounded-lg focus:outline-none focus:border-accent"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-12">
            <Link
              href={`/shop?type=${isDigital ? 'digital' : 'physical'}`}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                !activeCategory
                  ? isDigital
                    ? 'bg-violet-500 text-white'
                    : 'bg-emerald-500 text-white'
                  : 'border border-border hover:bg-surface'
              }`}
            >
              All {isDigital ? 'Digital' : 'Physical'}
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop?type=${isDigital ? 'digital' : 'physical'}&category=${category.slug}`}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === category.slug
                    ? isDigital
                      ? 'bg-violet-500 text-white'
                      : 'bg-emerald-500 text-white'
                    : 'border border-border hover:bg-surface'
                }`}
              >
                {category.name} ({category._count.products})
              </Link>
            ))}
          </div>
        )}

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 text-zinc-500">
              {isDigital ? (
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              ) : (
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              )}
            </div>
            <h3 className="text-2xl font-bold mb-2">No {isDigital ? 'digital' : 'physical'} products found</h3>
            <p className="text-text-secondary mb-8">
              {params.search
                ? `No products match "${params.search}"`
                : activeCategory
                ? 'No products in this category yet'
                : `Check back soon for new ${isDigital ? 'digital downloads' : 'products'}!`}
            </p>
            {(params.search || activeCategory) && (
              <Link
                href={`/shop?type=${isDigital ? 'digital' : 'physical'}`}
                className={`inline-flex items-center px-6 py-3 text-white rounded-lg transition-colors ${
                  isDigital ? 'bg-violet-500 hover:bg-violet-600' : 'bg-emerald-500 hover:bg-emerald-600'
                }`}
              >
                View all {isDigital ? 'digital' : 'physical'} products
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const images = product.images as string[]
                const primaryImage = images?.[0] || null

                return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.slug}`}
                    className="group border border-border rounded-2xl overflow-hidden hover:border-text-primary transition-all"
                  >
                    <div className="aspect-square bg-surface relative flex items-center justify-center overflow-hidden">
                      {primaryImage ? (
                        <Image
                          src={primaryImage}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-text-secondary text-sm">No Image</div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {product.featured && (
                          <div className="px-3 py-1 bg-accent text-white text-xs font-medium rounded-full">
                            Featured
                          </div>
                        )}
                        {isDigital && (
                          <div className="px-3 py-1 bg-violet-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Digital
                          </div>
                        )}
                      </div>

                      {/* Out of stock - only for physical products */}
                      {!isDigital && product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-text-secondary">
                          {product.category.name}
                        </span>
                        {isDigital && (product as any).digitalFileName && (
                          <span className="text-xs text-violet-400">
                            {getFileExtension((product as any).digitalFileName)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-accent transition-colors">
                        {product.name}
                      </h3>
                      {product.shortDesc && (
                        <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                          {product.shortDesc}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">
                            ${Number(product.price).toFixed(2)}
                          </span>
                          {product.comparePrice && Number(product.comparePrice) > Number(product.price) && (
                            <span className="text-lg text-text-secondary line-through">
                              ${Number(product.comparePrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                          {isDigital ? 'Download →' : 'View details →'}
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {pagination.page > 1 && (
                  <Link
                    href={`/shop?${new URLSearchParams({
                      type: isDigital ? 'digital' : 'physical',
                      ...(activeCategory ? { category: activeCategory } : {}),
                      ...(params.search ? { search: params.search } : {}),
                      page: String(pagination.page - 1),
                    }).toString()}`}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="px-4 py-2 text-text-secondary">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                {pagination.page < pagination.totalPages && (
                  <Link
                    href={`/shop?${new URLSearchParams({
                      type: isDigital ? 'digital' : 'physical',
                      ...(activeCategory ? { category: activeCategory } : {}),
                      ...(params.search ? { search: params.search } : {}),
                      page: String(pagination.page + 1),
                    }).toString()}`}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center py-12 border-t border-border">
          {isDigital ? (
            <>
              <h3 className="text-2xl font-bold mb-4">Looking for Physical Products?</h3>
              <p className="text-text-secondary mb-8">
                Check out our 3D printed products ready to ship
              </p>
              <Link
                href="/shop?type=physical"
                className="inline-flex items-center px-8 py-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"
              >
                Browse Physical Products
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold mb-4">Need Something Custom?</h3>
              <p className="text-text-secondary mb-8">
                We offer custom 3D printing services for unique projects
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/custom-3d-printing"
                  className="inline-flex items-center px-8 py-4 bg-text-primary text-background rounded-lg hover:bg-text-secondary transition-all"
                >
                  Request a custom quote
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                {counts.digital > 0 && (
                  <Link
                    href="/shop?type=digital"
                    className="inline-flex items-center px-8 py-4 border border-violet-500 text-violet-400 rounded-lg hover:bg-violet-500/10 transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Browse Digital Downloads
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext ? `.${ext}` : ''
}

export const metadata = {
  title: 'Shop - 47 Industries',
  description: 'Browse our catalog of 3D printed products and digital downloads.',
}
