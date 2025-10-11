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
                Read our terms and conditions for using our services
              </p>
            </Link>

            <Link
              href="/legal/privacy"
              className="border border-border rounded-2xl p-8 hover:border-text-primary transition-all"
            >
              <h2 className="text-2xl font-bold mb-3">Privacy Policy</h2>
              <p className="text-text-secondary">
                Learn how we collect, use, and protect your data
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
                Shipping methods, times, and costs
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
  description: 'Legal policies and terms for 47 Industries',
}
