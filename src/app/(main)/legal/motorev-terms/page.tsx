import Link from 'next/link'

export default function MotoRevTermsPage() {
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

          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">MotoRev Terms of Service</h1>
          </div>
          <p className="text-text-secondary mb-12">Last updated: January 2026</p>

          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="mb-4">
                MotoRev is a motorcycle companion app developed and operated by 47 Industries. By downloading, installing, or using the MotoRev app, you agree to these MotoRev-specific Terms of Service, as well as the general <Link href="/legal/terms" className="text-blue-500 hover:underline">47 Industries Terms of Service</Link> and <Link href="/legal/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>.
              </p>
              <p>
                These terms apply to users of the MotoRev iOS application and any related services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. App Description</h2>
              <p className="mb-4">MotoRev is a motorcycle tracking and social app that provides:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>GPS ride tracking and route recording</li>
                <li>Social features to connect with other riders</li>
                <li>Garage management for your motorcycles</li>
                <li>Safety features including emergency contacts and crash detection</li>
                <li>Ride statistics and achievements</li>
                <li>MotoRev Pro subscription for premium features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Account Requirements</h2>
              <p className="mb-4">To use MotoRev, you must:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Be at least 18 years old or have parental consent</li>
                <li>Create an account with accurate information</li>
                <li>Maintain the confidentiality of your login credentials</li>
                <li>Accept responsibility for all activity under your account</li>
              </ul>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited activities.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. MotoRev Pro Subscription</h2>

              <h3 className="text-xl font-semibold text-white mb-3">4.1 Subscription Features</h3>
              <p className="mb-4">MotoRev Pro includes premium features such as:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Advanced ride analytics and statistics</li>
                <li>Unlimited ride history storage</li>
                <li>Priority support</li>
                <li>Ad-free experience</li>
                <li>Exclusive Pro features as released</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">4.2 Pricing and Billing</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Monthly subscription: $4.99/month</li>
                <li>Annual subscription: $49.99/year</li>
                <li>All subscriptions are billed through the Apple App Store</li>
                <li>Prices are subject to change with notice</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">4.3 Subscription Management</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>Cancel anytime through your Apple ID settings</li>
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>No refunds for partial subscription periods</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">4.4 Pro Time Credits</h3>
              <p>
                Pro subscription time may be earned through the affiliate program. Earned credits are applied automatically and extend your subscription period. Credits expire 12 months after being earned if not applied.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Location Services</h2>
              <p className="mb-4">
                MotoRev requires access to your device&apos;s location services to provide core functionality. By using the app, you consent to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Collection of GPS data during rides</li>
                <li>Background location tracking when ride tracking is active</li>
                <li>Storage and display of your ride routes</li>
                <li>Sharing location with emergency contacts (if enabled)</li>
              </ul>
              <p>
                You can disable location services at any time through your device settings, but this will limit app functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Safety Disclaimer</h2>
              <p className="mb-4 font-semibold text-white">
                IMPORTANT: MotoRev is not a substitute for safe riding practices.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Never use the app while operating a motorcycle</li>
                <li>Always wear appropriate safety gear</li>
                <li>Follow all traffic laws and regulations</li>
                <li>The crash detection feature is not guaranteed and should not be relied upon as your only safety measure</li>
                <li>Emergency features require cellular connectivity and may not work in all areas</li>
              </ul>
              <p>
                47 Industries is not liable for any accidents, injuries, or damages that occur while riding or using the app.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. User Content</h2>

              <h3 className="text-xl font-semibold text-white mb-3">7.1 Your Content</h3>
              <p className="mb-4">
                You retain ownership of content you create in MotoRev, including ride data, photos, and profile information. By using MotoRev, you grant us a license to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Store and display your content within the app</li>
                <li>Use aggregated, anonymized ride data to improve our services</li>
                <li>Share content you choose to make public with other users</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">7.2 Prohibited Content</h3>
              <p className="mb-4">You may not post content that:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Is illegal, harmful, threatening, or harassing</li>
                <li>Infringes on intellectual property rights</li>
                <li>Contains malware or malicious code</li>
                <li>Promotes dangerous or illegal riding behavior</li>
                <li>Violates the privacy of others</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Social Features</h2>
              <p className="mb-4">MotoRev includes social features that allow you to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Connect with other riders</li>
                <li>Share rides and routes</li>
                <li>Join groups and communities</li>
                <li>Participate in challenges and leaderboards</li>
              </ul>
              <p className="mb-4">
                When using social features, you agree to treat other users with respect and follow community guidelines. We reserve the right to remove content and suspend accounts that violate these standards.
              </p>
              <p>
                You can control your privacy settings to limit what information is shared with other users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Affiliate Program Integration</h2>
              <p className="mb-4">
                MotoRev users may participate in the 47 Industries affiliate program by linking their accounts. See the <Link href="/legal/terms#user-affiliate-program-terms" className="text-blue-500 hover:underline">User Affiliate Program Terms</Link> in the main Terms of Service for full details.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3">9.1 Account Linking</h3>
              <p className="mb-4">By connecting your 47 Industries account:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>You receive a unique referral code (MR-XXXXXX format)</li>
                <li>Your profile information is shared between platforms</li>
                <li>You can view affiliate statistics in the MotoRev app</li>
                <li>You can earn and apply Pro time credits</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">9.2 Referral Code Usage</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>New users can enter referral codes during signup</li>
                <li>Codes may also be detected via clipboard (with your permission)</li>
                <li>Referral codes are valid for new users within 7 days of account creation</li>
                <li>Self-referrals are not permitted</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Data and Privacy</h2>
              <p className="mb-4">
                Your use of MotoRev is subject to our <Link href="/legal/privacy" className="text-blue-500 hover:underline">Privacy Policy</Link>. Key points specific to MotoRev:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Ride data is stored securely and associated with your account</li>
                <li>Location data is used only for app functionality and is not sold</li>
                <li>You can delete your data at any time through account settings</li>
                <li>Aggregated, anonymized data may be used to improve services</li>
              </ul>
              <p>
                When accounts are linked, data is shared between MotoRev and 47 Industries as described in the Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Third-Party Services</h2>
              <p className="mb-4">MotoRev integrates with third-party services including:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Apple Maps for mapping and navigation</li>
                <li>Apple HealthKit (with permission) for fitness data</li>
                <li>Apple App Store for subscription management</li>
                <li>47 Industries API for affiliate features</li>
              </ul>
              <p>
                Your use of these integrations is subject to the respective third-party terms and privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Updates and Changes</h2>
              <p className="mb-4">
                We regularly update MotoRev to add features, fix bugs, and improve performance. By using the app:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You agree to receive automatic updates when available</li>
                <li>Some features may be added, modified, or removed</li>
                <li>We will notify you of material changes to these terms</li>
                <li>Continued use after changes constitutes acceptance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Termination</h2>
              <p className="mb-4">
                You may stop using MotoRev at any time by deleting the app. To fully delete your account and data:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Use the &quot;Delete Account&quot; option in app settings</li>
                <li>Or contact support@motorevapp.com</li>
              </ul>
              <p>
                We may terminate or suspend your account for violation of these terms. Upon termination, your access to Pro features ends immediately and no refunds are provided.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Limitation of Liability</h2>
              <p className="mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>MotoRev is provided &quot;as is&quot; without warranties</li>
                <li>We are not liable for any accidents or injuries while riding</li>
                <li>We are not responsible for data loss or service interruptions</li>
                <li>Our total liability is limited to amounts paid for Pro subscriptions</li>
                <li>We are not liable for actions of other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">15. Contact and Support</h2>
              <p className="mb-4">For questions about MotoRev or these terms:</p>
              <ul className="space-y-2">
                <li>Email: support@motorevapp.com</li>
                <li>Website: <a href="https://motorevapp.com" className="text-blue-500 hover:underline">motorevapp.com</a></li>
                <li>In-app: Settings &gt; Help & Support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">16. Additional Terms</h2>
              <p className="mb-4">
                These MotoRev-specific terms supplement and are incorporated into the general <Link href="/legal/terms" className="text-blue-500 hover:underline">47 Industries Terms of Service</Link>. In case of conflict between these terms and the general terms, these MotoRev-specific terms shall prevail for matters relating to the MotoRev app.
              </p>
              <p>
                Use of MotoRev is also subject to the Apple App Store Terms of Service and Apple Media Services Terms and Conditions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'MotoRev Terms of Service - 47 Industries',
  description: 'Terms of Service for the MotoRev motorcycle companion app by 47 Industries',
}
