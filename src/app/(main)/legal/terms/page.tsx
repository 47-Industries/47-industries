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
          <p className="text-text-secondary mb-12">Last updated: January 2026</p>

          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Agreement to Terms</h2>
              <p className="mb-4">
                By accessing or using the 47 Industries website, services, portals, or any affiliated platforms, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
              <p className="mb-4">
                These terms apply to all visitors, users, customers, clients, partners, and affiliates of 47 Industries and its subsidiaries, including MotoRev.
              </p>
              <p>
                If you are using our services on behalf of a business or organization, you represent that you have the authority to bind that entity to these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Definitions</h2>
              <p className="mb-4">For the purposes of these Terms:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>&quot;47 Industries&quot;</strong> refers to 47 Industries and all its subsidiaries, including MotoRev</li>
                <li><strong>&quot;Customer&quot;</strong> refers to individuals who purchase products from our shop</li>
                <li><strong>&quot;Client&quot;</strong> refers to businesses or individuals who engage us for development services and have access to the Client Portal</li>
                <li><strong>&quot;Partner&quot;</strong> refers to contractors, affiliates, or business partners with access to the Partner Portal</li>
                <li><strong>&quot;User Affiliate&quot;</strong> refers to MotoRev users who participate in our referral program through account linking</li>
                <li><strong>&quot;Services&quot;</strong> refers to all products, services, platforms, and portals offered by 47 Industries</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Services Overview</h2>
              <p className="mb-4">47 Industries provides the following services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>3D printed products and custom 3D printing services</li>
                <li>Web development services</li>
                <li>App development services</li>
                <li>AI and automation solutions</li>
                <li>E-commerce platform for purchasing goods</li>
                <li>MotoRev motorcycle companion app</li>
              </ul>
              <p>
                Additionally, we provide specialized portals for different user types, including the Client Portal, Partner Portal, and integrated affiliate dashboards within the MotoRev app.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Account Registration</h2>
              <p className="mb-4">
                When you create an account with us, you must provide accurate, complete, and current information. You are responsible for maintaining the security of your account and password.
              </p>
              <p className="mb-4">
                You agree to notify us immediately of any unauthorized access to your account. We are not liable for any loss or damage arising from your failure to protect your account credentials.
              </p>
              <p>
                Different account types provide access to different features and portals. Your account type and permissions are determined by your relationship with 47 Industries and any applicable agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Client Portal Terms</h2>
              <p className="mb-4">
                The Client Portal is available to businesses and individuals who have engaged 47 Industries for development services. Access to the Client Portal is governed by the following terms:
              </p>

              <h3 className="text-xl font-semibold text-white mb-3">5.1 Access and Authorization</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Client Portal access is granted upon execution of a service agreement or project contract</li>
                <li>Clients may add authorized contacts to their account with appropriate permissions</li>
                <li>Access may be suspended or terminated for non-payment or breach of contract</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">5.2 Portal Features</h3>
              <p className="mb-4">The Client Portal provides access to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Project tracking and status updates</li>
                <li>Invoice management and payment processing</li>
                <li>Document storage and contract signing</li>
                <li>Direct communication with the 47 Industries team</li>
                <li>Deliverable downloads and documentation</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">5.3 Client Responsibilities</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintain accurate account information</li>
                <li>Respond to communications in a timely manner</li>
                <li>Review and sign contracts and change orders promptly</li>
                <li>Make payments according to agreed terms</li>
                <li>Protect login credentials and authorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Partner Portal Terms</h2>
              <p className="mb-4">
                The Partner Portal is available to contractors, affiliates, and business partners who have been approved by 47 Industries. Partnership is subject to the following terms:
              </p>

              <h3 className="text-xl font-semibold text-white mb-3">6.1 Partner Eligibility</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Partner status requires application and approval by 47 Industries</li>
                <li>Partners must execute a Partner Agreement outlining commission rates and terms</li>
                <li>Partner status may be revoked for violation of these terms or the Partner Agreement</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">6.2 Partner Benefits</h3>
              <p className="mb-4">Partners receive:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Unique affiliate codes for referral tracking</li>
                <li>Commission on referred business (rates specified in Partner Agreement)</li>
                <li>Access to partner dashboard and analytics</li>
                <li>Priority support and communication</li>
                <li>Contract management and digital signing</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">6.3 Commission Structure</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Commission rates are specified in individual Partner Agreements</li>
                <li>Shop referral commissions are calculated as a percentage of order total</li>
                <li>MotoRev Pro conversion bonuses are flat-rate commissions</li>
                <li>Commissions must be approved before payout</li>
                <li>Minimum payout thresholds may apply</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">6.4 Partner Obligations</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Represent 47 Industries and MotoRev accurately and professionally</li>
                <li>Not engage in spam, misleading advertising, or unethical marketing practices</li>
                <li>Disclose affiliate relationships when required by law</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Maintain confidentiality of proprietary information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. User Affiliate Program Terms</h2>
              <p className="mb-4">
                The User Affiliate Program allows MotoRev users to earn rewards by referring new users. This program is separate from the Partner program and has different terms:
              </p>

              <h3 className="text-xl font-semibold text-white mb-3">7.1 Eligibility and Enrollment</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Must have an active MotoRev account</li>
                <li>Must create or link a 47 Industries account</li>
                <li>Enrollment is automatic upon account linking</li>
                <li>Must be 18 years or older</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">7.2 How It Works</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Upon linking accounts, you receive a unique referral code (MR-XXXXXX format)</li>
                <li>Share your code with friends who want to try MotoRev</li>
                <li>Earn rewards when referred users sign up and upgrade to Pro</li>
                <li>Track your referrals and earnings in the MotoRev app</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">7.3 Rewards</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>Pro Conversion Bonus:</strong> Earn when a referred user upgrades to MotoRev Pro within 30 days of signup</li>
                <li><strong>Retention Bonus:</strong> Earn monthly bonuses when referred users remain Pro subscribers (up to 12 months)</li>
                <li><strong>Shop Referrals:</strong> Earn a percentage of orders placed using your code on the 47 Industries shop</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">7.4 Reward Types</h3>
              <p className="mb-4">You may choose to receive rewards as:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li><strong>Cash Payout:</strong> Receive earnings via bank transfer (minimum threshold applies)</li>
                <li><strong>Pro Subscription Time:</strong> Convert earnings to MotoRev Pro subscription credits</li>
              </ul>
              <p>
                You can change your reward preference at any time through the MotoRev app. Changes apply to future commissions only.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3">7.5 Prohibited Activities</h3>
              <p className="mb-4">The following activities are prohibited and may result in termination:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Self-referrals or creating fake accounts</li>
                <li>Spam, unsolicited messages, or deceptive marketing</li>
                <li>Purchasing ads with 47 Industries or MotoRev trademarks without permission</li>
                <li>Misrepresenting the app, its features, or the referral program</li>
                <li>Any activity that violates applicable laws</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">7.6 Program Changes</h3>
              <p>
                47 Industries reserves the right to modify commission rates, reward structures, or program terms at any time. Changes will be communicated through the app and will not affect earned but unpaid commissions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. MotoRev Account Linking</h2>
              <p className="mb-4">
                47 Industries accounts and MotoRev accounts may be linked to enable cross-platform features and the affiliate program. By linking accounts:
              </p>

              <h3 className="text-xl font-semibold text-white mb-3">8.1 Data Sharing</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Basic profile information (name, email) is shared between platforms</li>
                <li>Referral and commission data is synchronized</li>
                <li>Account status and preferences are shared for seamless experience</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">8.2 Authentication</h3>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Account linking uses secure JWT-based authentication</li>
                <li>Connection tokens expire after 10 minutes for security</li>
                <li>You can unlink accounts at any time through settings</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">8.3 Benefits of Linking</h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Participate in the User Affiliate Program</li>
                <li>View affiliate dashboard in the MotoRev app</li>
                <li>Apply earnings as MotoRev Pro subscription credits</li>
                <li>Single sign-on experience across platforms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Orders and Payment</h2>
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
              <h2 className="text-2xl font-bold text-white mb-4">10. Intellectual Property</h2>
              <p className="mb-4">
                All content on this website and our platforms, including text, graphics, logos, images, and software, is the property of 47 Industries and is protected by intellectual property laws.
              </p>
              <p className="mb-4">
                &quot;47 Industries,&quot; &quot;MotoRev,&quot; and associated logos are trademarks of 47 Industries. Partners and affiliates may use these marks only as expressly permitted in their agreements.
              </p>
              <p>
                For custom 3D printing orders, you retain ownership of your designs. However, you grant us a license to use your designs solely for the purpose of fulfilling your order.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Custom 3D Printing Services</h2>
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
              <h2 className="text-2xl font-bold text-white mb-4">12. Web and App Development Services</h2>
              <p className="mb-4">
                Development services are provided under separate agreements. Quotes are valid for 30 days unless otherwise specified. Payment terms, deliverables, and timelines will be outlined in individual project agreements.
              </p>
              <p>
                Clients receiving development services will have access to the Client Portal for project management, communication, and invoicing.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. MotoRev App Terms</h2>
              <p className="mb-4">
                Use of the MotoRev app is subject to these Terms as well as the <Link href="/legal/motorev-terms" className="text-blue-500 hover:underline">MotoRev-specific Terms of Service</Link> and the Apple App Store Terms of Service.
              </p>
              <p className="mb-4">
                MotoRev Pro subscriptions are billed through the Apple App Store. Subscription management and cancellation must be done through your Apple ID settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Limitation of Liability</h2>
              <p className="mb-4">
                47 Industries shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services, including but not limited to lost profits, lost revenue, or lost referral commissions.
              </p>
              <p>
                Our total liability for any claim arising from these terms or our services shall not exceed the greater of (a) the amount paid by you for the specific product or service giving rise to the claim, or (b) the total commissions earned by you in the 12 months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">15. Disclaimer of Warranties</h2>
              <p className="mb-4">
                Our services are provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind, either express or implied.
              </p>
              <p>
                We do not warrant that our services will be uninterrupted, error-free, or completely secure. We do not guarantee any specific results from the affiliate program.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">16. Termination</h2>
              <p className="mb-4">
                We may terminate or suspend your access to our services immediately, without prior notice, for any reason, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                <li>Breach of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Non-payment of invoices</li>
                <li>Violation of Partner or Affiliate program terms</li>
              </ul>
              <p>
                Upon termination, any pending commissions that have been approved will be paid according to normal procedures. Pending commissions not yet approved may be forfeited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">17. Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the State of Florida, United States, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">18. Dispute Resolution</h2>
              <p className="mb-4">
                Any dispute arising from these terms or your use of our services shall first be attempted to be resolved through good faith negotiation. If negotiation fails, disputes shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
              <p>
                You agree to waive any right to participate in class action lawsuits against 47 Industries.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">19. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Material changes will be communicated via email to registered users. Your continued use of our services after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">20. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">21. Contact Us</h2>
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
  description: 'Terms of Service for 47 Industries products, services, portals, and affiliate programs',
}
