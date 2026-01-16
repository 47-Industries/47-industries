'use client'

import { useEffect, useState, use } from 'react'
import { useSearchParams } from 'next/navigation'

interface Partner {
  id: string
  partnerNumber: string
  name: string
  email: string
  phone?: string
  company?: string
  firstSaleRate: number
  recurringRate: number
  createdAt: string
  contract?: {
    signedAt?: string
  }
}

export default function PartnerAgreementPage({ params }: { params: Promise<{ partnerId: string }> }) {
  const { partnerId } = use(params)
  const searchParams = useSearchParams()
  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)

  // Get signature date from URL or use current date
  const signatureDate = searchParams.get('date') || new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  useEffect(() => {
    fetchPartner()
  }, [partnerId])

  async function fetchPartner() {
    try {
      const res = await fetch(`/api/contracts/partner-agreement/${partnerId}`)
      if (res.ok) {
        const data = await res.json()
        setPartner(data.partner)
      }
    } catch (error) {
      console.error('Error fetching partner:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading agreement...</p>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Agreement not found</p>
      </div>
    )
  }

  const effectiveDate = new Date(partner.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Print Button */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print Agreement
        </button>
      </div>

      <div className="min-h-screen bg-white py-12 px-8 print-page" style={{ maxWidth: '850px', margin: '0 auto' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">PARTNER REFERRAL AGREEMENT</h1>
          <p className="text-gray-600">Agreement Number: {partner.partnerNumber}</p>
        </div>

        {/* Parties */}
        <div className="mb-8 text-gray-800 leading-relaxed">
          <p className="mb-4">
            This Partner Referral Agreement (the "Agreement") is entered into as of <strong>{effectiveDate}</strong> (the "Effective Date"), by and between:
          </p>

          <div className="ml-8 mb-4">
            <p className="mb-2">
              <strong>47 Industries LLC</strong>, a limited liability company organized under the laws of the State of Florida,
              with its principal place of business at 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066
              (hereinafter referred to as the "Company")
            </p>
          </div>

          <p className="mb-4 text-center">and</p>

          <div className="ml-8 mb-4">
            <p>
              <strong>{partner.name}</strong>
              {partner.company && ` (${partner.company})`}
              {partner.email && `, contactable at ${partner.email}`}
              {partner.phone && `, ${partner.phone}`}
              {' '}(hereinafter referred to as the "Partner")
            </p>
          </div>

          <p>
            The Company and Partner are hereinafter collectively referred to as the "Parties" and individually as a "Party."
          </p>
        </div>

        {/* Recitals */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">RECITALS</h2>
          <div className="text-gray-800 leading-relaxed ml-4">
            <p className="mb-3">
              <strong>WHEREAS</strong>, the Company is engaged in the business of providing web development,
              application development, 3D printing services, and related technology solutions; and
            </p>
            <p className="mb-3">
              <strong>WHEREAS</strong>, the Partner desires to refer potential clients and business opportunities
              to the Company in exchange for commission payments as set forth herein; and
            </p>
            <p className="mb-3">
              <strong>WHEREAS</strong>, the Company desires to engage the Partner to identify and refer
              potential clients on the terms and conditions set forth in this Agreement.
            </p>
            <p>
              <strong>NOW, THEREFORE</strong>, in consideration of the mutual covenants and agreements herein
              contained and for other good and valuable consideration, the receipt and sufficiency of which are
              hereby acknowledged, the Parties agree as follows:
            </p>
          </div>
        </div>

        {/* Article 1: Definitions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ARTICLE 1: DEFINITIONS</h2>
          <div className="text-gray-800 leading-relaxed ml-4">
            <p className="mb-3">
              <strong>1.1 "Referral"</strong> means any prospective client or business opportunity that is:
              (a) introduced to the Company by the Partner; (b) not previously known to the Company or in active
              discussions with the Company; and (c) results in a signed contract or engagement with the Company.
            </p>
            <p className="mb-3">
              <strong>1.2 "Initial Contract Value"</strong> means the total upfront payment or first invoice amount
              paid by a Referred Client for services rendered by the Company, excluding any recurring fees.
            </p>
            <p className="mb-3">
              <strong>1.3 "Recurring Revenue"</strong> means any ongoing, periodic payments made by a Referred Client
              for continued services, maintenance, hosting, support, or subscription-based offerings.
            </p>
            <p>
              <strong>1.4 "Referred Client"</strong> means any client that becomes a paying customer of the Company
              as a direct result of a Referral made by the Partner.
            </p>
          </div>
        </div>

        {/* Article 2: Commission Structure */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ARTICLE 2: COMMISSION STRUCTURE</h2>
          <div className="text-gray-800 leading-relaxed ml-4">
            <p className="mb-3">
              <strong>2.1 Initial Sale Commission.</strong> The Partner shall receive a commission equal to
              <strong> {partner.firstSaleRate}% ({partner.firstSaleRate} percent)</strong> of the Initial Contract Value
              for each Referred Client. This commission shall be calculated on the gross amount invoiced to the
              Referred Client for the initial project or engagement.
            </p>
            <p className="mb-3">
              <strong>2.2 Recurring Revenue Commission.</strong> The Partner shall receive a commission equal to
              <strong> {partner.recurringRate}% ({partner.recurringRate} percent)</strong> of all Recurring Revenue
              generated from each Referred Client. This commission shall continue for as long as the Referred Client
              maintains an active service relationship with the Company.
            </p>
            <p className="mb-3">
              <strong>2.3 Commission Calculation Example.</strong> For illustrative purposes: If a Referred Client
              signs a contract with an Initial Contract Value of $10,000 and subsequently pays $500 per month in
              Recurring Revenue, the Partner would receive:
            </p>
            <ul className="list-disc ml-8 mb-3">
              <li>Initial Commission: ${(10000 * partner.firstSaleRate / 100).toLocaleString()} ({partner.firstSaleRate}% of $10,000)</li>
              <li>Monthly Recurring Commission: ${(500 * partner.recurringRate / 100).toLocaleString()} per month ({partner.recurringRate}% of $500)</li>
            </ul>
            <p>
              <strong>2.4 No Double Compensation.</strong> The Partner shall not be entitled to commission on any
              portion of a contract that constitutes a refund, chargeback, disputed amount, or is otherwise not
              collected by the Company.
            </p>
          </div>
        </div>

        {/* Article 3: Payment Terms */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ARTICLE 3: PAYMENT TERMS</h2>
          <div className="text-gray-800 leading-relaxed ml-4">
            <p className="mb-3">
              <strong>3.1 Payment Timing.</strong> Commissions shall be calculated and paid within thirty (30) days
              following the Company's receipt of payment from the Referred Client. No commission shall be due or
              payable until the Company has received actual payment from the Referred Client.
            </p>
            <p className="mb-3">
              <strong>3.2 Payment Method.</strong> All commission payments shall be made via the Partner's preferred
              payment method as registered with the Company, which may include direct bank transfer, Zelle, Venmo,
              check, or other mutually agreed upon methods.
            </p>
            <p className="mb-3">
              <strong>3.3 Commission Statements.</strong> The Company shall provide the Partner with access to a
              partner portal where commission statements, payment history, and referral status can be viewed.
            </p>
            <p>
              <strong>3.4 Taxes.</strong> The Partner is solely responsible for all taxes, including but not limited
              to income taxes and self-employment taxes, arising from commission payments received under this Agreement.
              The Company may require the Partner to provide a completed W-9 form or equivalent tax documentation.
            </p>
          </div>
        </div>

        {/* Article 4: Partner Obligations */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ARTICLE 4: PARTNER OBLIGATIONS</h2>
          <div className="text-gray-800 leading-relaxed ml-4">
            <p className="mb-3">
              <strong>4.1 Referral Submission.</strong> The Partner shall submit all Referrals through the Company's
              designated partner portal or by direct communication with Company representatives. Each Referral must
              include the prospective client's name, contact information, and nature of the business opportunity.
            </p>
            <p className="mb-3">
              <strong>4.2 Good Faith Efforts.</strong> The Partner shall use good faith efforts to accurately represent
              the Company's services and capabilities to prospective clients.
            </p>
            <p className="mb-3">
              <strong>4.3 No Authority to Bind.</strong> The Partner has no authority to bind the Company to any
              contract, agreement, or obligation. All pricing, terms, and conditions shall be determined solely by
              the Company.
            </p>
            <p>
              <strong>4.4 Compliance.</strong> The Partner shall conduct all activities under this Agreement in
              compliance with all applicable laws and regulations.
            </p>
          </div>
        </div>

        {/* Article 5: Company Obligations */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ARTICLE 5: COMPANY OBLIGATIONS</h2>
          <div className="text-gray-800 leading-relaxed ml-4">
            <p className="mb-3">
              <strong>5.1 Referral Tracking.</strong> The Company shall maintain accurate records of all Referrals
              submitted by the Partner and shall provide the Partner with reasonable access to information regarding
              the status of such Referrals.
            </p>
            <p className="mb-3">
              <strong>5.2 Good Faith Engagement.</strong> The Company shall make good faith efforts to engage with
              and evaluate all qualified Referrals submitted by the Partner.
            </p>
            <p>
              <strong>5.3 Timely Payment.</strong> The Company shall process and pay all earned commissions in
              accordance with the payment terms set forth in Article 3.
            </p>
          </div>
        </div>

        {/* Article 6: Confidentiality */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ARTICLE 6: CONFIDENTIALITY</h2>
          <div className="text-gray-800 leading-relaxed ml-4">
            <p className="mb-3">
              <strong>6.1 Confidential Information.</strong> Each Party agrees to maintain in confidence all
              non-public information received from the other Party, including but not limited to client information,
              pricing structures, business strategies, and proprietary processes.
            </p>
            <p>
              <strong>6.2 Survival.</strong> The confidentiality obligations set forth in this Article 6 shall
              survive the termination or expiration of this Agreement for a period of two (2) years.
            </p>
          </div>
        </div>

        {/* Article 7: Term and Termination */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ARTICLE 7: TERM AND TERMINATION</h2>
          <div className="text-gray-800 leading-relaxed ml-4">
            <p className="mb-3">
              <strong>7.1 Term.</strong> This Agreement shall commence on the Effective Date and shall continue
              for an initial term of one (1) year. Thereafter, this Agreement shall automatically renew for
              successive one (1) year periods unless terminated in accordance with this Article 7.
            </p>
            <p className="mb-3">
              <strong>7.2 Termination for Convenience.</strong> Either Party may terminate this Agreement at any
              time by providing thirty (30) days' written notice to the other Party.
            </p>
            <p className="mb-3">
              <strong>7.3 Termination for Cause.</strong> Either Party may terminate this Agreement immediately
              upon written notice if the other Party materially breaches any provision of this Agreement and fails
              to cure such breach within fifteen (15) days of receiving written notice thereof.
            </p>
            <p>
              <strong>7.4 Effect of Termination.</strong> Upon termination of this Agreement, the Partner shall
              remain entitled to receive commissions for all Referred Clients that were introduced prior to the
              termination date, including Recurring Revenue commissions, for as long as such clients maintain an
              active relationship with the Company.
            </p>
          </div>
        </div>

        {/* Article 8: Independent Contractor */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ARTICLE 8: INDEPENDENT CONTRACTOR</h2>
          <div className="text-gray-800 leading-relaxed ml-4">
            <p>
              The Partner is an independent contractor and nothing in this Agreement shall be construed to create
              an employer-employee relationship, partnership, joint venture, or agency relationship between the
              Parties. The Partner shall not be entitled to any employee benefits from the Company.
            </p>
          </div>
        </div>

        {/* Article 9: Miscellaneous */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ARTICLE 9: MISCELLANEOUS</h2>
          <div className="text-gray-800 leading-relaxed ml-4">
            <p className="mb-3">
              <strong>9.1 Entire Agreement.</strong> This Agreement constitutes the entire agreement between the
              Parties with respect to the subject matter hereof and supersedes all prior negotiations, representations,
              and agreements.
            </p>
            <p className="mb-3">
              <strong>9.2 Amendment.</strong> This Agreement may not be amended or modified except by a written
              instrument signed by both Parties.
            </p>
            <p className="mb-3">
              <strong>9.3 Governing Law.</strong> This Agreement shall be governed by and construed in accordance
              with the laws of the State of Florida, without regard to its conflicts of law principles.
            </p>
            <p className="mb-3">
              <strong>9.4 Notices.</strong> All notices under this Agreement shall be in writing and shall be
              deemed given when delivered personally, sent by email with confirmation of receipt, or sent by
              certified mail, return receipt requested.
            </p>
            <p>
              <strong>9.5 Severability.</strong> If any provision of this Agreement is held to be invalid or
              unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </div>
        </div>

        {/* Signature Block */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <p className="text-gray-800 mb-8">
            <strong>IN WITNESS WHEREOF</strong>, the Parties have executed this Agreement as of the date first written above.
          </p>

          <div className="grid grid-cols-2 gap-12">
            {/* Company Signatures */}
            <div>
              <p className="font-bold text-gray-900 mb-6">47 INDUSTRIES LLC</p>

              <div className="mb-8">
                <div className="border-b border-gray-400 mb-2 h-12"></div>
                <p className="text-sm text-gray-600">Kyle Rivers, Managing Member</p>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Date: _______________________</p>
                </div>
              </div>

              <div>
                <div className="border-b border-gray-400 mb-2 h-12"></div>
                <p className="text-sm text-gray-600">Dean Saber, Managing Member</p>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Date: _______________________</p>
                </div>
              </div>
            </div>

            {/* Partner Signature */}
            <div>
              <p className="font-bold text-gray-900 mb-6">PARTNER</p>

              <div className="mb-8">
                <div className="border-b border-gray-400 mb-2 h-12"></div>
                <p className="text-sm text-gray-600">{partner.name}</p>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Date: _______________________</p>
                </div>
              </div>

              {partner.company && (
                <div>
                  <p className="text-sm text-gray-600 mt-4">Company (if applicable): {partner.company}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>47 Industries LLC | 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066</p>
          <p>www.47industries.com | info@47industries.com</p>
        </div>
      </div>
    </>
  )
}
