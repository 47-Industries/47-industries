import Link from 'next/link'

export default function PrivacyPolicyPage() {
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

          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-text-secondary mb-12">Last updated: November 2024</p>

          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="mb-4">
                47 Industries (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website or use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-white mb-3">Personal Information</h3>
              <p className="mb-4">When you interact with our services, we may collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>Name and contact information (email, phone, address)</li>
                <li>Account credentials (email and password)</li>
                <li>Payment information (processed securely via Stripe)</li>
                <li>Order history and preferences</li>
                <li>Communication history with our support team</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">Automatically Collected Information</h3>
              <p className="mb-4">We automatically collect certain information when you visit our website:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>IP address and location data</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Process and fulfill your orders</li>
                <li>Provide customer support</li>
                <li>Send order confirmations and shipping updates</li>
                <li>Improve our products and services</li>
                <li>Personalize your experience</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Information Sharing</h2>
              <p className="mb-4">We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>Service Providers:</strong> Companies that help us operate our business (payment processors, shipping carriers, email services)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
              <p>
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal data, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SSL/TLS encryption for data in transit</li>
                <li>Secure data storage with access controls</li>
                <li>Regular security assessments</li>
                <li>PCI-compliant payment processing through Stripe</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar technologies to enhance your experience. These include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p>
                You can control cookies through your browser settings. Disabling certain cookies may affect website functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your data (subject to legal requirements)</li>
                <li>Object to processing of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent for marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
              <p>
                We retain your personal data for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Order and transaction data is typically retained for 7 years for tax and legal purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children&apos;s Privacy</h2>
              <p>
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Third-Party Services</h2>
              <p className="mb-4">We use the following third-party services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Stripe:</strong> Payment processing</li>
                <li><strong>Cloudflare:</strong> Content delivery and security</li>
                <li><strong>Resend:</strong> Email communications</li>
              </ul>
              <p className="mt-4">
                Each service has its own privacy policy governing the use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. California Privacy Rights</h2>
              <p>
                California residents have additional rights under the CCPA, including the right to know what personal information is collected, request deletion, and opt out of the sale of personal information. As stated above, we do not sell personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact Us</h2>
              <p className="mb-4">
                If you have questions about this privacy policy or our data practices, please contact us:
              </p>
              <ul className="space-y-2">
                <li>Email: privacy@47industries.com</li>
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
  title: 'Privacy Policy - 47 Industries',
  description: 'Privacy Policy for 47 Industries - how we collect, use, and protect your data',
}
