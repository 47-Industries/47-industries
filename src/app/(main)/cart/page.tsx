'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCart } from '@/lib/cart-store'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faShoppingCart } from '@fortawesome/free-solid-svg-icons'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart, isDigitalOnly, hasPhysicalProducts } = useCart()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-12">Shopping Cart</h1>
          <div className="flex justify-center py-20">
            <div className="animate-pulse text-text-secondary">Loading cart...</div>
          </div>
        </div>
      </div>
    )
  }

  const isEmpty = items.length === 0
  const subtotal = getTotal()

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-5xl md:text-6xl font-bold">Shopping Cart</h1>
          {!isEmpty && (
            <button
              onClick={clearCart}
              className="text-sm text-text-secondary hover:text-red-500 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="text-6xl mb-6 text-zinc-500">
              <FontAwesomeIcon icon={faShoppingCart} />
            </div>
            <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-text-secondary mb-8">
              Start shopping to add items to your cart
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center px-8 py-4 bg-text-primary text-background rounded-lg font-medium hover:bg-text-secondary transition-all"
            >
              Browse Products
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-4 p-4 border border-border rounded-xl"
                  >
                    {/* Product Image */}
                    <div className="w-24 h-24 bg-surface rounded-lg overflow-hidden flex-shrink-0 relative">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-text-secondary text-sm">
                          ${item.price.toFixed(2)} each
                        </p>
                        {item.productType === 'DIGITAL' && (
                          <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-400 rounded-full">
                            Digital
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls - only for physical products */}
                      <div className="flex items-center gap-4 mt-3">
                        {item.productType !== 'DIGITAL' ? (
                          <div className="flex items-center border border-border rounded-lg">
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity - 1)
                              }
                              className="px-3 py-1 hover:bg-surface transition-colors"
                            >
                              -
                            </button>
                            <span className="px-3 py-1 min-w-[40px] text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(item.productId, item.quantity + 1)
                              }
                              className="px-3 py-1 hover:bg-surface transition-colors"
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-text-secondary">Qty: 1</span>
                        )}

                        <button
                          onClick={() => removeItem(item.productId)}
                          className="text-sm text-text-secondary hover:text-red-500 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <span className="font-bold text-lg">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div>
                <div className="border border-border rounded-2xl p-8 sticky top-24">
                  <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">
                        Subtotal ({items.reduce((c, i) => c + i.quantity, 0)} items)
                      </span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Shipping</span>
                      <span className="text-sm text-text-secondary">
                        {isDigitalOnly() ? (
                          <span className="text-violet-400">No shipping needed</span>
                        ) : (
                          'Calculated at checkout'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Tax</span>
                      <span className="text-sm text-text-secondary">
                        Calculated at checkout
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Estimated Total</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <Link
                    href="/checkout"
                    className="block w-full py-4 bg-accent text-white text-center rounded-lg font-semibold hover:bg-accent/90 transition-all mb-4"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    href="/shop"
                    className="block text-center text-sm text-text-secondary hover:text-text-primary"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
