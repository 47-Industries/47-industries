import React from 'react'
import { renderToFile } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 45,
    paddingBottom: 55,
    fontSize: 9,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 8,
    color: '#666',
  },
  section: {
    marginBottom: 6,
  },
  articleTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 8,
  },
  paragraph: {
    marginBottom: 4,
    textAlign: 'justify',
  },
  indent: {
    marginLeft: 15,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
  },
  signatureSection: {
    marginTop: 20,
    paddingTop: 15,
    borderTop: '1px solid #ccc',
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  signatureBlock: {
    width: '45%',
  },
  signatureLabel: {
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 9,
  },
  signatureLine: {
    borderBottom: '1px solid #333',
    height: 20,
    marginBottom: 3,
  },
  signatureName: {
    fontSize: 7,
    color: '#666',
  },
  dateLine: {
    marginTop: 4,
    fontSize: 7,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 45,
    right: 45,
    textAlign: 'center',
    fontSize: 7,
    color: '#666',
    borderTop: '1px solid #eee',
    paddingTop: 6,
  },
})

// Jesse Dawson's partner data from database
const partner = {
  name: 'Jesse Dawson',
  email: 'Jessedawsonye@gmail.com',
  phone: null,
  company: null,
  partnerNumber: 'PTR-20260116-0001',
  firstSaleRate: 50,
  recurringRate: 30,
  createdAt: '2026-01-16T01:03:20.959Z',
}

// Company info
const company = {
  name: '47 Industries LLC',
  address: '11275 52nd Ave N, St. Petersburg, FL 33708',
  website: 'www.47industries.com',
  email: 'info@47industries.com',
  signers: [
    { name: 'Kyle Rivers', title: 'President' },
    { name: 'Dean Sabr', title: 'Chief Executive Officer' },
  ],
}

function PartnerAgreementPDF({ partner, company }) {
  const effectiveDate = new Date(partner.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const commissionExample = {
    firstCommission: (10000 * partner.firstSaleRate) / 100,
    monthlyCommission: (500 * partner.recurringRate) / 100,
  }

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'LETTER', style: styles.page, wrap: true },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'PARTNER REFERRAL AGREEMENT'),
        React.createElement(Text, { style: styles.subtitle }, `Agreement Number: ${partner.partnerNumber}`)
      ),

      // Parties
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.paragraph },
          'This Partner Referral Agreement (the "Agreement") is entered into as of ',
          React.createElement(Text, { style: styles.bold }, effectiveDate),
          ' (the "Effective Date"), by and between:'
        ),
        React.createElement(Text, { style: styles.indent },
          React.createElement(Text, { style: styles.bold }, company.name),
          `, a limited liability company organized under the laws of the State of Florida, with its principal place of business at ${company.address} (hereinafter referred to as the "Company")`
        ),
        React.createElement(Text, { style: [styles.paragraph, { textAlign: 'center' }] }, 'and'),
        React.createElement(Text, { style: styles.indent },
          React.createElement(Text, { style: styles.bold }, partner.name),
          partner.company ? ` (${partner.company})` : '',
          `, contactable at ${partner.email}`,
          partner.phone ? `, ${partner.phone}` : '',
          ' (hereinafter referred to as the "Partner")'
        ),
        React.createElement(Text, { style: styles.paragraph },
          'The Company and Partner are hereinafter collectively referred to as the "Parties" and individually as a "Party."'
        )
      ),

      // Recitals
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'RECITALS'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, 'WHEREAS'),
          ', the Company is engaged in the business of providing web development, application development, 3D printing services, and related technology solutions; and'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, 'WHEREAS'),
          ', the Partner desires to refer potential clients and business opportunities to the Company in exchange for commission payments as set forth herein; and'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, 'WHEREAS'),
          ', the Company desires to engage the Partner to identify and refer potential clients on the terms and conditions set forth in this Agreement.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, 'NOW, THEREFORE'),
          ', in consideration of the mutual covenants and agreements herein contained and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:'
        )
      ),

      // Article 1
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 1: DEFINITIONS'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '1.1 "Referral"'),
          ' means any prospective client or business opportunity that is: (a) introduced to the Company by the Partner; (b) not previously known to the Company or in active discussions with the Company; and (c) results in a signed contract or engagement with the Company.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '1.2 "Initial Contract Value"'),
          ' means the total upfront payment or first invoice amount paid by a Referred Client for services rendered by the Company, excluding any recurring fees.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '1.3 "Recurring Revenue"'),
          ' means any ongoing, periodic payments made by a Referred Client for continued services, maintenance, hosting, support, or subscription-based offerings.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '1.4 "Referred Client"'),
          ' means any client that becomes a paying customer of the Company as a direct result of a Referral made by the Partner.'
        )
      ),

      // Article 2
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 2: COMMISSION STRUCTURE'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '2.1 Initial Sale Commission.'),
          ' The Partner shall receive a commission equal to ',
          React.createElement(Text, { style: styles.bold }, `${partner.firstSaleRate}% (${partner.firstSaleRate} percent)`),
          ' of the Initial Contract Value for each Referred Client. This commission shall be calculated on the gross amount invoiced to the Referred Client for the initial project or engagement.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '2.2 Recurring Revenue Commission.'),
          ' The Partner shall receive a commission equal to ',
          React.createElement(Text, { style: styles.bold }, `${partner.recurringRate}% (${partner.recurringRate} percent)`),
          ' of all Recurring Revenue generated from each Referred Client. This commission shall continue for as long as the Referred Client maintains an active service relationship with the Company.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '2.3 Commission Calculation Example.'),
          ` For illustrative purposes: If a Referred Client signs a contract with an Initial Contract Value of $10,000 and subsequently pays $500 per month in Recurring Revenue, the Partner would receive an Initial Commission of $${commissionExample.firstCommission.toLocaleString()} (${partner.firstSaleRate}% of $10,000) and a Monthly Recurring Commission of $${commissionExample.monthlyCommission.toLocaleString()} per month (${partner.recurringRate}% of $500).`
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '2.4 No Double Compensation.'),
          ' The Partner shall not be entitled to commission on any portion of a contract that constitutes a refund, chargeback, disputed amount, or is otherwise not collected by the Company.'
        )
      ),

      // Article 3
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 3: PAYMENT TERMS'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '3.1 Payment Timing.'),
          ' Commissions shall be calculated and paid within thirty (30) days following the Company\'s receipt of payment from the Referred Client. No commission shall be due or payable until the Company has received actual payment from the Referred Client.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '3.2 Payment Method.'),
          ' All commission payments shall be made via the Partner\'s preferred payment method as registered with the Company, which may include direct bank transfer, Zelle, Venmo, check, or other mutually agreed upon methods.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '3.3 Commission Statements.'),
          ' The Company shall provide the Partner with access to a partner portal where commission statements, payment history, and referral status can be viewed.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '3.4 Taxes.'),
          ' The Partner is solely responsible for all taxes, including but not limited to income taxes and self-employment taxes, arising from commission payments received under this Agreement. The Company may require the Partner to provide a completed W-9 form or equivalent tax documentation.'
        )
      ),

      // Article 4
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 4: PARTNER OBLIGATIONS'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '4.1 Referral Submission.'),
          ' The Partner shall submit all Referrals through the Company\'s designated partner portal or by direct communication with Company representatives. Each Referral must include the prospective client\'s name, contact information, and nature of the business opportunity.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '4.2 Good Faith Efforts.'),
          ' The Partner shall use good faith efforts to accurately represent the Company\'s services and capabilities to prospective clients.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '4.3 No Authority to Bind.'),
          ' The Partner has no authority to bind the Company to any contract, agreement, or obligation. All pricing, terms, and conditions shall be determined solely by the Company.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '4.4 Compliance.'),
          ' The Partner shall conduct all activities under this Agreement in compliance with all applicable laws and regulations.'
        )
      ),

      // Article 5
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 5: COMPANY OBLIGATIONS'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '5.1 Referral Tracking.'),
          ' The Company shall maintain accurate records of all Referrals submitted by the Partner and shall provide the Partner with reasonable access to information regarding the status of such Referrals.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '5.2 Good Faith Engagement.'),
          ' The Company shall make good faith efforts to engage with and evaluate all qualified Referrals submitted by the Partner.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '5.3 Timely Payment.'),
          ' The Company shall process and pay all earned commissions in accordance with the payment terms set forth in Article 3.'
        )
      ),

      // Article 6
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 6: CONFIDENTIALITY'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '6.1 Confidential Information.'),
          ' Each Party agrees to maintain in confidence all non-public information received from the other Party, including but not limited to client information, pricing structures, business strategies, and proprietary processes.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '6.2 Survival.'),
          ' The confidentiality obligations set forth in this Article 6 shall survive the termination or expiration of this Agreement for a period of two (2) years.'
        )
      ),

      // Article 7
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 7: TERM AND TERMINATION'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '7.1 Term.'),
          ' This Agreement shall commence on the Effective Date and shall continue for an initial term of one (1) year. Thereafter, this Agreement shall automatically renew for successive one (1) year periods unless terminated in accordance with this Article 7.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '7.2 Termination for Convenience.'),
          ' Either Party may terminate this Agreement at any time by providing thirty (30) days\' written notice to the other Party.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '7.3 Termination for Cause.'),
          ' Either Party may terminate this Agreement immediately upon written notice if the other Party materially breaches any provision of this Agreement and fails to cure such breach within fifteen (15) days of receiving written notice thereof.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '7.4 Effect of Termination.'),
          ' Upon termination of this Agreement, the Partner shall remain entitled to receive commissions for all Referred Clients that were introduced prior to the termination date, including Recurring Revenue commissions, for as long as such clients maintain an active relationship with the Company.'
        )
      ),

      // Article 8
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 8: INDEPENDENT CONTRACTOR'),
        React.createElement(Text, { style: styles.paragraph },
          'The Partner is an independent contractor and nothing in this Agreement shall be construed to create an employer-employee relationship, partnership, joint venture, or agency relationship between the Parties. The Partner shall not be entitled to any employee benefits from the Company.'
        )
      ),

      // Article 9
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 9: MISCELLANEOUS'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '9.1 Entire Agreement.'),
          ' This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, and agreements.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '9.2 Amendment.'),
          ' This Agreement may not be amended or modified except by a written instrument signed by both Parties.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '9.3 Governing Law.'),
          ' This Agreement shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflicts of law principles.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '9.4 Notices.'),
          ' All notices under this Agreement shall be in writing and shall be deemed given when delivered personally, sent by email with confirmation of receipt, or sent by certified mail, return receipt requested.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '9.5 Severability.'),
          ' If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.'
        )
      ),

      // Signatures
      React.createElement(View, { style: styles.signatureSection },
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, 'IN WITNESS WHEREOF'),
          ', the Parties have executed this Agreement as of the date first written above.'
        ),
        React.createElement(View, { style: styles.signatureRow },
          React.createElement(View, { style: styles.signatureBlock },
            React.createElement(Text, { style: styles.signatureLabel }, company.name.toUpperCase()),
            React.createElement(View, { style: styles.signatureLine }),
            React.createElement(Text, { style: styles.signatureName }, `${company.signers[0].name}, ${company.signers[0].title}`),
            React.createElement(Text, { style: styles.dateLine }, 'Date: _______________________'),
            React.createElement(View, { style: [styles.signatureLine, { marginTop: 25 }] }),
            React.createElement(Text, { style: styles.signatureName }, `${company.signers[1].name}, ${company.signers[1].title}`),
            React.createElement(Text, { style: styles.dateLine }, 'Date: _______________________')
          ),
          React.createElement(View, { style: styles.signatureBlock },
            React.createElement(Text, { style: styles.signatureLabel }, 'PARTNER'),
            React.createElement(View, { style: styles.signatureLine }),
            React.createElement(Text, { style: styles.signatureName }, partner.name),
            React.createElement(Text, { style: styles.dateLine }, 'Date: _______________________')
          )
        )
      ),

      // Footer on every page
      React.createElement(View, { style: styles.footer, fixed: true },
        React.createElement(Text, {}, `${company.name} | ${company.address}`),
        React.createElement(Text, {}, `${company.website} | ${company.email}`)
      )
    )
  )
}

// Generate the PDF
const outputPath = './Partner-Agreement-Jesse-Dawson.pdf'
console.log('Generating PDF for Jesse Dawson...')
console.log(`  Partner: ${partner.name} (${partner.email})`)
console.log(`  Commission: ${partner.firstSaleRate}% first sale, ${partner.recurringRate}% recurring`)
console.log(`  Company: ${company.name}`)
console.log(`  Address: ${company.address}`)
console.log(`  Signers: ${company.signers.map(s => `${s.name} (${s.title})`).join(', ')}`)

await renderToFile(
  React.createElement(PartnerAgreementPDF, { partner, company }),
  outputPath
)

console.log(`\nPDF generated: ${outputPath}`)
