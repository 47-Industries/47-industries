import Link from 'next/link'

export default function TermsOfServicePage() {
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

          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-text-secondary mb-12">Last updated: November 2024</p>

          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p className="mb-4">
                By accessing or using the 47 Industries website and services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
              <p>
                These terms apply to all visitors, users, and customers of 47 Industries and its subsidiaries, including MotoRev.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Services</h2>
              <p className="mb-4">47 Industries provides the following services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>3D printed products and custom 3D printing services</li>
                <li>Web development services</li>
                <li>App development services</li>
                <li>E-commerce platform for purchasing goods</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration</h2>
              <p className="mb-4">
                When you create an account with us, you must provide accurate, complete, and current information. You are responsible for maintaining the security of your account and password.
              </p>
              <p>
                You agree to notify us immediately of any unauthorized access to your account. We are not liable for any loss or damage arising from your failure to protect your account credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Orders and Payment</h2>
              <p className="mb-4">
                All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including pricing errors or stock availability.
              </p>
              <p className="mb-4">
                Prices are listed in USD and are subject to change without notice. Payment is processed securely through Stripe. By placing an order, you authorize us to charge your payment method for the total amount.
              </p>
              <p>
                For custom 3D printing services, a quote will be provided before work begins. Once accepted, the quote becomes binding.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Intellectual Property</h2>
              <p className="mb-4">
                All content on this website, including text, graphics, logos, images, and software, is the property of 47 Industries and is protected by intellectual property laws.
              </p>
              <p>
                For custom 3D printing orders, you retain ownership of your designs. However, you grant us a license to use your designs solely for the purpose of fulfilling your order.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Custom 3D Printing Services</h2>
              <p className="mb-4">
                By submitting a design for custom 3D printing, you represent that:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>You own or have the rights to use the design</li>
                <li>The design does not infringe on any intellectual property rights</li>
                <li>The design is not for any illegal or harmful purpose</li>
              </ul>
              <p>
                We reserve the right to refuse any order that we believe violates these terms or any applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Web and App Development Services</h2>
              <p className="mb-4">
                Development services are provided under separate agreements. Quotes are valid for 30 days unless otherwise specified. Payment terms, deliverables, and timelines will be outlined in individual project agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Limitation of Liability</h2>
              <p className="mb-4">
                47 Industries shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.
              </p>
              <p>
                Our total liability for any claim arising from these terms or our services shall not exceed the amount paid by you for the specific product or service giving rise to the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Disclaimer of Warranties</h2>
              <p className="mb-4">
                Our services are provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, either express or implied.
              </p>
              <p>
                We do not warrant that our services will be uninterrupted, error-free, or completely secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of our services after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="space-y-2">
                <li>Email: legal@47industries.com</li>
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
  title: 'Terms of Service - 47 Industries',
  description: 'Terms of Service for 47 Industries products and services',
}
