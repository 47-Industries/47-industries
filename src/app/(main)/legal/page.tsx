import Link from 'next/link'

export default function LegalPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Legal</h1>
          <p className="text-xl text-text-secondary mb-12">
            Our policies and legal information
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Link
              href="/legal/terms"
              className="border border-border rounded-2xl p-8 hover:border-text-primary transition-all"
            >
              <h2 className="text-2xl font-bold mb-3">Terms of Service</h2>
              <p className="text-text-secondary">
                Terms for all 47 Industries services, portals, and affiliate programs
              </p>
            </Link>

            <Link
              href="/legal/privacy"
              className="border border-border rounded-2xl p-8 hover:border-text-primary transition-all"
            >
              <h2 className="text-2xl font-bold mb-3">Privacy Policy</h2>
              <p className="text-text-secondary">
                How we collect, use, and protect your data across all platforms
              </p>
            </Link>

            <Link
              href="/legal/motorev-terms"
              className="border border-border rounded-2xl p-8 hover:border-text-primary transition-all group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">MotoRev Terms</h2>
              </div>
              <p className="text-text-secondary">
                App-specific terms for MotoRev users, subscriptions, and safety
              </p>
            </Link>

            <Link
              href="/legal/refund"
              className="border border-border rounded-2xl p-8 hover:border-text-primary transition-all"
            >
              <h2 className="text-2xl font-bold mb-3">Refund Policy</h2>
              <p className="text-text-secondary">
                Our refund and return policy for products and services
              </p>
            </Link>

            <Link
              href="/legal/shipping"
              className="border border-border rounded-2xl p-8 hover:border-text-primary transition-all"
            >
              <h2 className="text-2xl font-bold mb-3">Shipping Policy</h2>
              <p className="text-text-secondary">
                Shipping methods, times, and costs for physical products
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Legal - 47 Industries',
  description: 'Legal policies and terms for 47 Industries and MotoRev',
}
