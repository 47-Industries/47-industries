"use client"

import Link from 'next/link'

export default function CartPage() {
  // TODO: Replace with actual cart state from context/zustand
  const cartItems = []

  const isEmpty = cartItems.length === 0

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-bold mb-12">Shopping Cart</h1>

        {isEmpty ? (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="text-6xl mb-6">🛒</div>
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
              <div className="lg:col-span-2 space-y-6">
                {/* Cart items will be mapped here */}
              </div>

              {/* Order Summary */}
              <div>
                <div className="border border-border rounded-2xl p-8 sticky top-24">
                  <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Subtotal</span>
                      <span className="font-semibold">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Shipping</span>
                      <span className="font-semibold">Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Tax</span>
                      <span className="font-semibold">Calculated at checkout</span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4 mb-6">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span>$0.00</span>
                    </div>
                  </div>
                  <button className="w-full py-4 bg-text-primary text-background rounded-lg font-semibold hover:bg-text-secondary transition-all mb-4">
                    Proceed to Checkout
                  </button>
                  <Link href="/shop" className="block text-center text-sm text-text-secondary hover:text-text-primary">
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

export const metadata = {
  title: 'Shopping Cart - 47 Industries',
  description: 'Review your cart and proceed to checkout.',
}
