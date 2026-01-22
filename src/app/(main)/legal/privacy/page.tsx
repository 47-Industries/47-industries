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
          <p className="text-text-secondary mb-12">Last updated: January 2026</p>

          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="mb-4">
                47 Industries (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website, use our services, or interact with our platforms including MotoRev.
              </p>
              <p>
                This policy applies to all 47 Industries services, the MotoRev app, and any data shared between connected accounts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-semibold text-white mb-3">2.1 Personal Information</h3>
              <p className="mb-4">When you interact with our services, we may collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>Name and contact information (email, phone, address)</li>
                <li>Account credentials (email and password)</li>
                <li>Payment information (processed securely via Stripe or Apple)</li>
                <li>Order history and preferences</li>
                <li>Communication history with our support team</li>
                <li>Business information (for clients and partners)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">2.2 Automatically Collected Information</h3>
              <p className="mb-4">We automatically collect certain information when you visit our website or use our apps:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>IP address and location data</li>
                <li>Browser type and version</li>
                <li>Device information and identifiers</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referring website</li>
                <li>App usage patterns and feature interactions</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">2.3 MotoRev-Specific Data</h3>
              <p className="mb-4">When using the MotoRev app, we collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>GPS location and ride tracking data</li>
                <li>Motorcycle and garage information</li>
                <li>Ride statistics and achievements</li>
                <li>Social connections and shared content</li>
                <li>Emergency contact information (if provided)</li>
                <li>Device motion data for crash detection (if enabled)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">2.4 Affiliate and Referral Data</h3>
              <p className="mb-4">For affiliate and referral programs, we collect:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Referral codes and tracking information</li>
                <li>Commission and payout data</li>
                <li>Referred user information (email, signup date)</li>
                <li>Conversion and retention metrics</li>
                <li>Reward preferences (cash vs. Pro time)</li>
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
                <li>Track and attribute referrals for affiliate programs</li>
                <li>Calculate and process affiliate commissions</li>
                <li>Provide ride tracking and safety features in MotoRev</li>
                <li>Enable social features and connections between users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Cross-Platform Data Sharing</h2>
              <p className="mb-4">
                When you link your 47 Industries and MotoRev accounts, data is shared between platforms to enable integrated features:
              </p>

              <h3 className="text-xl font-semibold text-white mb-3">4.1 Data Shared When Linking</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Account identifiers and email address</li>
                <li>Name and profile information</li>
                <li>Affiliate code and referral data</li>
                <li>Commission balances and reward preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">4.2 Data Synced Ongoing</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Referral activity and conversions</li>
                <li>Commission accruals and payouts</li>
                <li>Pro subscription status (for Pro time credits)</li>
                <li>Account status changes</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">4.3 Unlinking Accounts</h3>
              <p>
                You can unlink your accounts at any time. When unlinked, cross-platform data syncing stops, but historical affiliate data is retained for commission tracking and compliance purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Information Sharing with Third Parties</h2>
              <p className="mb-4">We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>Service Providers:</strong> Companies that help us operate our business (payment processors, shipping carriers, email services, cloud hosting)</li>
                <li><strong>Apple:</strong> For App Store subscriptions and in-app purchases</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
              <p className="mb-4">
                <strong>We do not sell your personal information to third parties.</strong>
              </p>
              <p>
                Affiliates and partners may see limited information about users they refer (email address, conversion status) solely for commission tracking purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Data Security</h2>
              <p className="mb-4">
                We implement appropriate technical and organizational measures to protect your personal data, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>SSL/TLS encryption for data in transit</li>
                <li>Encrypted storage for sensitive data at rest</li>
                <li>Secure authentication using JWT tokens</li>
                <li>Regular security assessments and penetration testing</li>
                <li>PCI-compliant payment processing through Stripe and Apple</li>
                <li>Access controls and audit logging</li>
                <li>Secure API communication between platforms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking</h2>
              <p className="mb-4">
                We use cookies and similar technologies to enhance your experience. These include:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                <li><strong>Affiliate Tracking Cookies:</strong> Track referrals for commission attribution (30-day duration)</li>
              </ul>
              <p>
                You can control cookies through your browser settings. Disabling certain cookies may affect website functionality and affiliate tracking.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. MotoRev Location Data</h2>
              <p className="mb-4">
                MotoRev collects location data to provide ride tracking features. This data is:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Collected only when you actively record a ride or enable tracking</li>
                <li>Stored securely and associated with your account</li>
                <li>Not shared with third parties except as needed for emergency features</li>
                <li>Deletable through the app&apos;s data management settings</li>
              </ul>
              <p>
                You can disable location access through your device settings, though this will limit app functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your data (subject to legal requirements)</li>
                <li>Object to processing of your data</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent for marketing communications</li>
                <li>Unlink connected accounts</li>
                <li>Opt out of affiliate tracking</li>
              </ul>
              <p>
                To exercise these rights, contact us at privacy@47industries.com or use the account settings in our platforms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Data Retention</h2>
              <p className="mb-4">We retain your personal data according to these guidelines:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Account Data:</strong> As long as your account is active, plus 30 days after deletion</li>
                <li><strong>Order and Transaction Data:</strong> 7 years for tax and legal purposes</li>
                <li><strong>Affiliate and Commission Data:</strong> 7 years for compliance and tax purposes</li>
                <li><strong>Ride Data (MotoRev):</strong> Until you delete it or close your account</li>
                <li><strong>Communication Logs:</strong> 3 years</li>
                <li><strong>Analytics Data:</strong> 26 months (anonymized after this period)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Children&apos;s Privacy</h2>
              <p>
                Our services are not intended for children under 13 years of age (or 16 in the EU). We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately at privacy@47industries.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Third-Party Services</h2>
              <p className="mb-4">We use the following third-party services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Stripe:</strong> Payment processing</li>
                <li><strong>Apple:</strong> App Store, subscriptions, and Apple Maps</li>
                <li><strong>Cloudflare:</strong> Content delivery and security (including R2 storage)</li>
                <li><strong>Resend:</strong> Email communications</li>
                <li><strong>Railway:</strong> Infrastructure hosting</li>
              </ul>
              <p className="mt-4">
                Each service has its own privacy policy governing the use of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. International Data Transfers</h2>
              <p>
                Your data may be processed in countries other than your country of residence, including the United States. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. California Privacy Rights (CCPA)</h2>
              <p className="mb-4">
                California residents have additional rights under the CCPA:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Right to know what personal information is collected</li>
                <li>Right to request deletion of personal information</li>
                <li>Right to opt out of the sale of personal information (we do not sell personal information)</li>
                <li>Right to non-discrimination for exercising privacy rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">15. European Privacy Rights (GDPR)</h2>
              <p className="mb-4">
                For users in the European Economic Area (EEA), we process data under the following legal bases:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Contract:</strong> Processing necessary to fulfill our services</li>
                <li><strong>Consent:</strong> For marketing communications and optional features</li>
                <li><strong>Legitimate Interest:</strong> For fraud prevention and security</li>
                <li><strong>Legal Obligation:</strong> For tax and compliance requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">16. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. Changes will be posted on this page with an updated revision date. Material changes will be communicated via email to registered users. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">17. Contact Us</h2>
              <p className="mb-4">
                If you have questions about this privacy policy or our data practices, please contact us:
              </p>
              <ul className="space-y-2">
                <li>Email: privacy@47industries.com</li>
                <li>Website: <Link href="/contact" className="text-blue-500 hover:underline">Contact Form</Link></li>
              </ul>
              <p className="mt-4">
                For MotoRev-specific inquiries: support@motorevapp.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Privacy Policy - 47 Industries',
  description: 'Privacy Policy for 47 Industries and MotoRev - how we collect, use, and protect your data',
}
