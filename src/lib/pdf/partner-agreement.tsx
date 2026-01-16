import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.5,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginBottom: 16,
  },
  articleTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 8,
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  indent: {
    marginLeft: 20,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: '1px solid #ccc',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLabel: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  signatureLine: {
    borderBottom: '1px solid #333',
    height: 30,
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9,
    color: '#666',
  },
  dateLine: {
    marginTop: 8,
    fontSize: 9,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
    borderTop: '1px solid #eee',
    paddingTop: 10,
  },
  listItem: {
    marginLeft: 20,
    marginBottom: 4,
  },
})

interface PartnerAgreementProps {
  partner: {
    name: string
    email: string
    phone?: string
    company?: string
    partnerNumber: string
    firstSaleRate: number
    recurringRate: number
    createdAt: string
  }
}

export function PartnerAgreementPDF({ partner }: PartnerAgreementProps) {
  const effectiveDate = new Date(partner.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const commissionExample = {
    contractValue: 10000,
    monthlyRecurring: 500,
    firstCommission: (10000 * partner.firstSaleRate) / 100,
    monthlyCommission: (500 * partner.recurringRate) / 100,
  }

  return (
    <Document>
      {/* Page 1 */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>PARTNER REFERRAL AGREEMENT</Text>
          <Text style={styles.subtitle}>Agreement Number: {partner.partnerNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            This Partner Referral Agreement (the "Agreement") is entered into as of{' '}
            <Text style={styles.bold}>{effectiveDate}</Text> (the "Effective Date"), by and between:
          </Text>

          <Text style={styles.indent}>
            <Text style={styles.bold}>47 Industries LLC</Text>, a limited liability company organized under the
            laws of the State of Florida, with its principal place of business at 3725 Coconut Creek Pkwy,
            Coconut Creek, FL 33066 (hereinafter referred to as the "Company")
          </Text>

          <Text style={[styles.paragraph, { textAlign: 'center' }]}>and</Text>

          <Text style={styles.indent}>
            <Text style={styles.bold}>{partner.name}</Text>
            {partner.company ? ` (${partner.company})` : ''}
            {partner.email ? `, contactable at ${partner.email}` : ''}
            {partner.phone ? `, ${partner.phone}` : ''} (hereinafter referred to as the "Partner")
          </Text>

          <Text style={styles.paragraph}>
            The Company and Partner are hereinafter collectively referred to as the "Parties" and individually
            as a "Party."
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>RECITALS</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>WHEREAS</Text>, the Company is engaged in the business of providing web
            development, application development, 3D printing services, and related technology solutions; and
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>WHEREAS</Text>, the Partner desires to refer potential clients and business
            opportunities to the Company in exchange for commission payments as set forth herein; and
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>WHEREAS</Text>, the Company desires to engage the Partner to identify and
            refer potential clients on the terms and conditions set forth in this Agreement.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>NOW, THEREFORE</Text>, in consideration of the mutual covenants and
            agreements herein contained and for other good and valuable consideration, the receipt and
            sufficiency of which are hereby acknowledged, the Parties agree as follows:
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 1: DEFINITIONS</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.1 "Referral"</Text> means any prospective client or business opportunity
            that is: (a) introduced to the Company by the Partner; (b) not previously known to the Company or in
            active discussions with the Company; and (c) results in a signed contract or engagement with the
            Company.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.2 "Initial Contract Value"</Text> means the total upfront payment or
            first invoice amount paid by a Referred Client for services rendered by the Company, excluding any
            recurring fees.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.3 "Recurring Revenue"</Text> means any ongoing, periodic payments made by
            a Referred Client for continued services, maintenance, hosting, support, or subscription-based
            offerings.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.4 "Referred Client"</Text> means any client that becomes a paying
            customer of the Company as a direct result of a Referral made by the Partner.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>47 Industries LLC | 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066</Text>
          <Text>www.47industries.com | info@47industries.com</Text>
        </View>
      </Page>

      {/* Page 2 */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 2: COMMISSION STRUCTURE</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.1 Initial Sale Commission.</Text> The Partner shall receive a commission
            equal to <Text style={styles.bold}>{partner.firstSaleRate}% ({partner.firstSaleRate} percent)</Text>{' '}
            of the Initial Contract Value for each Referred Client. This commission shall be calculated on the
            gross amount invoiced to the Referred Client for the initial project or engagement.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.2 Recurring Revenue Commission.</Text> The Partner shall receive a
            commission equal to{' '}
            <Text style={styles.bold}>{partner.recurringRate}% ({partner.recurringRate} percent)</Text> of all
            Recurring Revenue generated from each Referred Client. This commission shall continue for as long as
            the Referred Client maintains an active service relationship with the Company.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.3 Commission Calculation Example.</Text> For illustrative purposes: If a
            Referred Client signs a contract with an Initial Contract Value of $10,000 and subsequently pays
            $500 per month in Recurring Revenue, the Partner would receive:
          </Text>
          <Text style={styles.listItem}>
            - Initial Commission: ${commissionExample.firstCommission.toLocaleString()} ({partner.firstSaleRate}%
            of $10,000)
          </Text>
          <Text style={styles.listItem}>
            - Monthly Recurring Commission: ${commissionExample.monthlyCommission.toLocaleString()} per month (
            {partner.recurringRate}% of $500)
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.4 No Double Compensation.</Text> The Partner shall not be entitled to
            commission on any portion of a contract that constitutes a refund, chargeback, disputed amount, or is
            otherwise not collected by the Company.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 3: PAYMENT TERMS</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.1 Payment Timing.</Text> Commissions shall be calculated and paid within
            thirty (30) days following the Company's receipt of payment from the Referred Client. No commission
            shall be due or payable until the Company has received actual payment from the Referred Client.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.2 Payment Method.</Text> All commission payments shall be made via the
            Partner's preferred payment method as registered with the Company, which may include direct bank
            transfer, Zelle, Venmo, check, or other mutually agreed upon methods.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.3 Commission Statements.</Text> The Company shall provide the Partner
            with access to a partner portal where commission statements, payment history, and referral status can
            be viewed.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.4 Taxes.</Text> The Partner is solely responsible for all taxes,
            including but not limited to income taxes and self-employment taxes, arising from commission payments
            received under this Agreement. The Company may require the Partner to provide a completed W-9 form or
            equivalent tax documentation.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 4: PARTNER OBLIGATIONS</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.1 Referral Submission.</Text> The Partner shall submit all Referrals
            through the Company's designated partner portal or by direct communication with Company
            representatives. Each Referral must include the prospective client's name, contact information, and
            nature of the business opportunity.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.2 Good Faith Efforts.</Text> The Partner shall use good faith efforts to
            accurately represent the Company's services and capabilities to prospective clients.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.3 No Authority to Bind.</Text> The Partner has no authority to bind the
            Company to any contract, agreement, or obligation. All pricing, terms, and conditions shall be
            determined solely by the Company.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.4 Compliance.</Text> The Partner shall conduct all activities under this
            Agreement in compliance with all applicable laws and regulations.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>47 Industries LLC | 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066</Text>
          <Text>www.47industries.com | info@47industries.com</Text>
        </View>
      </Page>

      {/* Page 3 */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 5: COMPANY OBLIGATIONS</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.1 Referral Tracking.</Text> The Company shall maintain accurate records
            of all Referrals submitted by the Partner and shall provide the Partner with reasonable access to
            information regarding the status of such Referrals.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.2 Good Faith Engagement.</Text> The Company shall make good faith efforts
            to engage with and evaluate all qualified Referrals submitted by the Partner.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.3 Timely Payment.</Text> The Company shall process and pay all earned
            commissions in accordance with the payment terms set forth in Article 3.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 6: CONFIDENTIALITY</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.1 Confidential Information.</Text> Each Party agrees to maintain in
            confidence all non-public information received from the other Party, including but not limited to
            client information, pricing structures, business strategies, and proprietary processes.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.2 Survival.</Text> The confidentiality obligations set forth in this
            Article 6 shall survive the termination or expiration of this Agreement for a period of two (2)
            years.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 7: TERM AND TERMINATION</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.1 Term.</Text> This Agreement shall commence on the Effective Date and
            shall continue for an initial term of one (1) year. Thereafter, this Agreement shall automatically
            renew for successive one (1) year periods unless terminated in accordance with this Article 7.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.2 Termination for Convenience.</Text> Either Party may terminate this
            Agreement at any time by providing thirty (30) days' written notice to the other Party.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.3 Termination for Cause.</Text> Either Party may terminate this Agreement
            immediately upon written notice if the other Party materially breaches any provision of this
            Agreement and fails to cure such breach within fifteen (15) days of receiving written notice thereof.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.4 Effect of Termination.</Text> Upon termination of this Agreement, the
            Partner shall remain entitled to receive commissions for all Referred Clients that were introduced
            prior to the termination date, including Recurring Revenue commissions, for as long as such clients
            maintain an active relationship with the Company.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 8: INDEPENDENT CONTRACTOR</Text>
          <Text style={styles.paragraph}>
            The Partner is an independent contractor and nothing in this Agreement shall be construed to create
            an employer-employee relationship, partnership, joint venture, or agency relationship between the
            Parties. The Partner shall not be entitled to any employee benefits from the Company.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>47 Industries LLC | 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066</Text>
          <Text>www.47industries.com | info@47industries.com</Text>
        </View>
      </Page>

      {/* Page 4 - Final page with signatures */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 9: MISCELLANEOUS</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>9.1 Entire Agreement.</Text> This Agreement constitutes the entire
            agreement between the Parties with respect to the subject matter hereof and supersedes all prior
            negotiations, representations, and agreements.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>9.2 Amendment.</Text> This Agreement may not be amended or modified except
            by a written instrument signed by both Parties.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>9.3 Governing Law.</Text> This Agreement shall be governed by and construed
            in accordance with the laws of the State of Florida, without regard to its conflicts of law
            principles.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>9.4 Notices.</Text> All notices under this Agreement shall be in writing
            and shall be deemed given when delivered personally, sent by email with confirmation of receipt, or
            sent by certified mail, return receipt requested.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>9.5 Severability.</Text> If any provision of this Agreement is held to be
            invalid or unenforceable, the remaining provisions shall continue in full force and effect.
          </Text>
        </View>

        <View style={styles.signatureSection}>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>IN WITNESS WHEREOF</Text>, the Parties have executed this Agreement as of
            the date first written above.
          </Text>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>47 INDUSTRIES LLC</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>Kyle Rivers, Managing Member</Text>
              <Text style={styles.dateLine}>Date: _______________________</Text>

              <View style={[styles.signatureLine, { marginTop: 30 }]} />
              <Text style={styles.signatureName}>Dean Saber, Managing Member</Text>
              <Text style={styles.dateLine}>Date: _______________________</Text>
            </View>

            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>PARTNER</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{partner.name}</Text>
              <Text style={styles.dateLine}>Date: _______________________</Text>
              {partner.company && (
                <Text style={[styles.signatureName, { marginTop: 10 }]}>
                  Company: {partner.company}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>47 Industries LLC | 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066</Text>
          <Text>www.47industries.com | info@47industries.com</Text>
        </View>
      </Page>
    </Document>
  )
}
