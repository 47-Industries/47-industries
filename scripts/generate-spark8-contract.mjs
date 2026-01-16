import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

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

function Spark8ServiceAgreement() {
  return React.createElement(Document, null,
    // Page 1
    React.createElement(Page, { size: 'LETTER', style: styles.page },
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'SERVICE AGREEMENT'),
        React.createElement(Text, { style: styles.subtitle }, 'Contract Number: CON-20260115-0001')
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.paragraph },
          'This Service Agreement (the "Agreement") is entered into as of ',
          React.createElement(Text, { style: styles.bold }, 'January 15, 2026'),
          ' (the "Effective Date"), by and between:'
        ),

        React.createElement(Text, { style: styles.indent },
          React.createElement(Text, { style: styles.bold }, '47 Industries LLC'),
          ', a limited liability company organized under the laws of the State of Florida, with its principal place of business at 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066 (hereinafter referred to as the "Company" or "Service Provider")'
        ),

        React.createElement(Text, { style: [styles.paragraph, { textAlign: 'center' }] }, 'and'),

        React.createElement(Text, { style: styles.indent },
          React.createElement(Text, { style: styles.bold }, 'Spark8 Smoke Shop & Hookah Lounge'),
          ', contactable at spark8smokeshop@gmail.com (hereinafter referred to as the "Client")'
        ),

        React.createElement(Text, { style: styles.paragraph },
          'The Company and Client are hereinafter collectively referred to as the "Parties" and individually as a "Party."'
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 1: PROJECT OVERVIEW'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '1.1 Project Name. '),
          'Spark8 E-Commerce Platform Development'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '1.2 Scope of Work. '),
          'The Company agrees to provide the following services:'
        ),
        React.createElement(Text, { style: styles.listItem }, '- Customer-facing e-commerce website with product catalog'),
        React.createElement(Text, { style: styles.listItem }, '- Age verification system (21+)'),
        React.createElement(Text, { style: styles.listItem }, '- Multi-location support (Clearwater & St. Petersburg)'),
        React.createElement(Text, { style: styles.listItem }, '- Administrative dashboard with inventory management'),
        React.createElement(Text, { style: styles.listItem }, '- Point of Sale (POS) system with Clover integration'),
        React.createElement(Text, { style: styles.listItem }, '- Real-time inventory synchronization across locations'),
        React.createElement(Text, { style: styles.listItem }, '- Customer rewards/loyalty program'),
        React.createElement(Text, { style: styles.listItem }, '- Delivery operations management and GoPuff integration')
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 2: PAYMENT TERMS'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '2.1 Project Fee. '),
          'The total project development fee is ',
          React.createElement(Text, { style: styles.bold }, '$5,000.00'),
          '.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '2.2 Payment Schedule. '),
          '100% of the project fee ($5,000.00) is due upfront before work begins.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '2.3 Monthly Maintenance Fee. '),
          'Following project completion, the Client agrees to pay a monthly maintenance fee of ',
          React.createElement(Text, { style: styles.bold }, '$150.00/month'),
          ', beginning February 1, 2026.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '2.4 Monthly Maintenance Includes:')
        ),
        React.createElement(Text, { style: styles.listItem }, '- Hosting and server management (Railway)'),
        React.createElement(Text, { style: styles.listItem }, '- Database hosting and management'),
        React.createElement(Text, { style: styles.listItem }, '- Security updates and monitoring'),
        React.createElement(Text, { style: styles.listItem }, '- Minor bug fixes and minor adjustments'),
        React.createElement(Text, { style: styles.listItem }, '- Technical support'),
        React.createElement(Text, { style: styles.listItem }, '- Third-party integration fees (GoPuff, Clover, etc.)'),

        React.createElement(Text, { style: [styles.paragraph, { marginTop: 12 }] },
          React.createElement(Text, { style: styles.bold }, '2.5 Additional Work. '),
          'Major updates, significant new features, substantial layout changes, or new integrations are not included in the monthly maintenance fee. Such work will require a separate agreement and additional fees to be negotiated between the Parties.'
        )
      ),

      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, '47 Industries LLC | 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066'),
        React.createElement(Text, null, 'www.47industries.com | info@47industries.com')
      )
    ),

    // Page 2
    React.createElement(Page, { size: 'LETTER', style: styles.page },
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '2.6 Payment Method. '),
          'Payment may be made via credit card, bank transfer, Zelle, or other mutually agreed upon methods. Invoices will be sent electronically and are due upon receipt unless otherwise specified.'
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 3: DELIVERABLES AND TIMELINE'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '3.1 Deliverables. '),
          'The Company shall deliver a fully functional e-commerce platform as described in Article 1, including all source code, documentation, and deployment to the production environment.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '3.2 Timeline. '),
          'The Company will make reasonable efforts to complete the project within the agreed timeline. Delays caused by the Client\'s failure to provide required materials or feedback may extend the delivery date.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '3.3 Revisions. '),
          'The project includes reasonable revisions during the development process. Major scope changes or feature additions may require additional fees as agreed upon in writing.'
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 4: INTELLECTUAL PROPERTY'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '4.1 Ownership. '),
          'Upon full payment of all fees, the Client shall own the custom code, designs, and content created specifically for this project.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '4.2 Third-Party Components. '),
          'The project may incorporate open-source libraries and third-party services (such as hosting, payment processing, etc.) which remain subject to their respective licenses and terms.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '4.3 Portfolio Rights. '),
          'The Company reserves the right to display the project in its portfolio and marketing materials unless otherwise agreed in writing.'
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 5: WARRANTIES AND SUPPORT'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '5.1 Warranty Period. '),
          'The Company warrants that the deliverables will function substantially as described for a period of thirty (30) days following delivery. During this period, the Company will fix any bugs or defects at no additional cost.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '5.2 Ongoing Support. '),
          'After the warranty period, support and maintenance are provided under the terms of the monthly maintenance agreement.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '5.3 Limitation of Liability. '),
          'The Company\'s total liability under this Agreement shall not exceed the total fees paid by the Client. The Company shall not be liable for any indirect, incidental, or consequential damages.'
        )
      ),

      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, '47 Industries LLC | 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066'),
        React.createElement(Text, null, 'www.47industries.com | info@47industries.com')
      )
    ),

    // Page 3
    React.createElement(Page, { size: 'LETTER', style: styles.page },
      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 6: CONFIDENTIALITY'),
        React.createElement(Text, { style: styles.paragraph },
          'Each Party agrees to maintain in confidence all non-public information received from the other Party, including but not limited to business strategies, customer data, and proprietary processes. This obligation shall survive termination of this Agreement for a period of two (2) years.'
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 7: TERM AND TERMINATION'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '7.1 Term. '),
          'This Agreement shall commence on the Effective Date and continue until all services are completed and fees are paid, unless terminated earlier in accordance with this Article.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '7.2 Termination by Client. '),
          'The Client may terminate this Agreement at any time by providing written notice. In the event of early termination, the Client shall pay for all work completed up to the termination date based on a reasonable assessment of work performed.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '7.3 Termination for Cause. '),
          'Either Party may terminate this Agreement immediately upon written notice if the other Party materially breaches any provision and fails to cure such breach within fifteen (15) days of receiving written notice.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '7.4 Monthly Service Termination. '),
          'Either Party may terminate the monthly maintenance service with thirty (30) days\' written notice. Upon termination of monthly services, the Client will retain ownership of all deliverables but will no longer receive ongoing support, hosting management, or updates.'
        )
      ),

      React.createElement(View, { style: styles.section },
        React.createElement(Text, { style: styles.articleTitle }, 'ARTICLE 8: GENERAL PROVISIONS'),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '8.1 Entire Agreement. '),
          'This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '8.2 Amendment. '),
          'This Agreement may not be amended except by a written instrument signed by both Parties.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '8.3 Governing Law. '),
          'This Agreement shall be governed by and construed in accordance with the laws of the State of Florida.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '8.4 Independent Contractor. '),
          'The Company is an independent contractor and nothing in this Agreement creates an employer-employee relationship.'
        ),
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, '8.5 Severability. '),
          'If any provision of this Agreement is held invalid, the remaining provisions shall continue in full force and effect.'
        )
      ),

      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, '47 Industries LLC | 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066'),
        React.createElement(Text, null, 'www.47industries.com | info@47industries.com')
      )
    ),

    // Page 4 - Signatures
    React.createElement(Page, { size: 'LETTER', style: styles.page },
      React.createElement(View, { style: styles.signatureSection },
        React.createElement(Text, { style: styles.paragraph },
          React.createElement(Text, { style: styles.bold }, 'IN WITNESS WHEREOF'),
          ', the Parties have executed this Agreement as of the date first written above.'
        ),

        React.createElement(View, { style: styles.signatureRow },
          React.createElement(View, { style: styles.signatureBlock },
            React.createElement(Text, { style: styles.signatureLabel }, '47 INDUSTRIES LLC'),
            React.createElement(View, { style: styles.signatureLine }),
            React.createElement(Text, { style: styles.signatureName }, 'Kyle Rivers, Managing Member'),
            React.createElement(Text, { style: styles.dateLine }, 'Date: _______________________'),

            React.createElement(View, { style: [styles.signatureLine, { marginTop: 30 }] }),
            React.createElement(Text, { style: styles.signatureName }, 'Dean Saber, Managing Member'),
            React.createElement(Text, { style: styles.dateLine }, 'Date: _______________________')
          ),

          React.createElement(View, { style: styles.signatureBlock },
            React.createElement(Text, { style: styles.signatureLabel }, 'CLIENT'),
            React.createElement(View, { style: styles.signatureLine }),
            React.createElement(Text, { style: styles.signatureName }, 'Spark8 Smoke Shop & Hookah Lounge'),
            React.createElement(Text, { style: styles.dateLine }, 'Date: _______________________')
          )
        )
      ),

      React.createElement(View, { style: styles.footer },
        React.createElement(Text, null, '47 Industries LLC | 3725 Coconut Creek Pkwy, Coconut Creek, FL 33066'),
        React.createElement(Text, null, 'www.47industries.com | info@47industries.com')
      )
    )
  )
}

async function main() {
  console.log('Generating Spark8 Service Agreement PDF...')

  // Generate PDF
  const pdfBuffer = await renderToBuffer(React.createElement(Spark8ServiceAgreement))
  console.log('PDF generated, size:', pdfBuffer.length, 'bytes')

  // Upload to R2
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
    }
  })

  const key = 'contracts/clients/CLI-20260114-0001/Spark8-Service-Agreement.pdf'

  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: Buffer.from(pdfBuffer),
    ContentType: 'application/pdf'
  }))

  const url = `${process.env.R2_PUBLIC_URL}/${key}`
  console.log('Uploaded to R2:', url)

  // Update database
  const updated = await prisma.contract.update({
    where: { contractNumber: 'CON-20260115-0001' },
    data: { fileUrl: url }
  })
  console.log('Database updated, contract:', updated.contractNumber)

  await prisma.$disconnect()
  console.log('Done!')
}

main().catch(console.error)
