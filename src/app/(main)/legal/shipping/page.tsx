import Link from 'next/link'

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/legal"
            className="inline-flex items-center text-text-secondary hover:text-white mb-8 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Legal
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping Policy</h1>
          <p className="text-text-secondary mb-12">Last updated: November 2024</p>

          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Shipping Locations</h2>
              <p className="mb-4">
                We currently ship to the following locations:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>United States:</strong> All 50 states and territories</li>
                <li><strong>Canada:</strong> All provinces and territories</li>
                <li><strong>International:</strong> Select countries (contact us for availability)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Shipping Options & Times</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse mb-6">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 pr-4 text-white font-semibold">Method</th>
                      <th className="text-left py-3 pr-4 text-white font-semibold">Delivery Time</th>
                      <th className="text-left py-3 text-white font-semibold">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="py-3 pr-4">Standard Shipping</td>
                      <td className="py-3 pr-4">5-7 business days</td>
                      <td className="py-3">$5.99 (Free over $50)</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 pr-4">Express Shipping</td>
                      <td className="py-3 pr-4">2-3 business days</td>
                      <td className="py-3">$14.99</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 pr-4">Overnight</td>
                      <td className="py-3 pr-4">1 business day</td>
                      <td className="py-3">$29.99</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="py-3 pr-4">Canada Standard</td>
                      <td className="py-3 pr-4">7-14 business days</td>
                      <td className="py-3">$15.99</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4">International</td>
                      <td className="py-3 pr-4">14-21 business days</td>
                      <td className="py-3">Calculated at checkout</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-sm italic">
                Delivery times are estimates and may vary based on carrier delays, customs processing, or weather conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Free Shipping</h2>
              <p>
                Enjoy free standard shipping on orders over $50 within the continental United States. This applies to standard shipping only; express and overnight options are available at additional cost.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Custom 3D Printed Orders</h2>
              <p className="mb-4">
                Custom 3D printed products have additional processing times:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Production Time:</strong> 3-10 business days depending on complexity</li>
                <li><strong>Shipping:</strong> Ships after production is complete</li>
                <li><strong>Rush Production:</strong> Available for an additional fee (contact us)</li>
              </ul>
              <p className="mt-4">
                You will receive an email notification when your custom order ships.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Order Processing</h2>
              <p className="mb-4">
                Orders are processed within 1-2 business days after payment confirmation.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Orders placed before 2 PM EST typically ship the same day</li>
                <li>Orders placed on weekends or holidays ship the next business day</li>
                <li>You will receive a shipping confirmation email with tracking information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Order Tracking</h2>
              <p className="mb-4">
                Once your order ships, you will receive an email with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tracking number</li>
                <li>Carrier information</li>
                <li>Link to track your package</li>
              </ul>
              <p className="mt-4">
                You can also view order status and tracking information in your <Link href="/account" className="text-blue-500 hover:underline">account dashboard</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Shipping Carriers</h2>
              <p className="mb-4">
                We work with trusted carriers including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>USPS (United States Postal Service)</li>
                <li>UPS</li>
                <li>FedEx</li>
                <li>DHL (International)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">International Shipping</h2>
              <p className="mb-4">
                For international orders, please note:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Customs & Duties:</strong> You are responsible for any customs fees, import duties, or taxes imposed by your country</li>
                <li><strong>Delivery Times:</strong> May be longer due to customs processing</li>
                <li><strong>Tracking:</strong> May be limited once the package leaves the US</li>
                <li><strong>Restrictions:</strong> Some items may not be available for international shipping</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Shipping Address</h2>
              <p className="mb-4">
                Please ensure your shipping address is correct before placing your order:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>We are not responsible for packages delivered to incorrect addresses</li>
                <li>Address changes after order placement may not be possible</li>
                <li>Returned packages due to incorrect addresses may incur additional shipping fees</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Lost or Damaged Packages</h2>
              <p className="mb-4">
                If your package is lost or arrives damaged:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Contact us within 48 hours of the expected delivery date</li>
                <li>For damaged packages, take photos before opening fully</li>
                <li>We will work with the carrier to resolve the issue</li>
                <li>Replacements or refunds will be issued as appropriate</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">P.O. Boxes</h2>
              <p>
                We can ship to P.O. Boxes via USPS. Express and overnight delivery options may not be available for P.O. Box addresses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
              <p className="mb-4">
                For questions about shipping, please contact us:
              </p>
              <ul className="space-y-2">
                <li>Email: shipping@47industries.com</li>
                <li>Website: <Link href="/contact" className="text-blue-500 hover:underline">Contact Form</Link></li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Shipping Policy - 47 Industries',
  description: 'Shipping options, delivery times, and policies for 47 Industries',
}
