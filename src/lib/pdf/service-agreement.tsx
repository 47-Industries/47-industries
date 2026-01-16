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
  table: {
    marginTop: 10,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #ddd',
    paddingVertical: 5,
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 5,
  },
  tableCellRight: {
    flex: 1,
    paddingHorizontal: 5,
    textAlign: 'right',
  },
})

interface ServiceAgreementProps {
  client: {
    name: string
    email: string
    phone?: string
    address?: string
    clientNumber: string
  }
  contract: {
    contractNumber: string
    title: string
    projectName: string
    scope: string[]
    totalValue: number
    monthlyValue?: number
    paymentTerms: string // e.g., "100% upfront" or "50% upfront, 50% on completion"
    monthlyIncludes?: string[]
    startDate?: string
  }
}

export function ServiceAgreementPDF({ client, contract }: ServiceAgreementProps) {
  const effectiveDate = contract.startDate
    ? new Date(contract.startDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })

  return (
    <Document>
      {/* Page 1 */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>SERVICE AGREEMENT</Text>
          <Text style={styles.subtitle}>Contract Number: {contract.contractNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            This Service Agreement (the "Agreement") is entered into as of{' '}
            <Text style={styles.bold}>{effectiveDate}</Text> (the "Effective Date"), by and between:
          </Text>

          <Text style={styles.indent}>
            <Text style={styles.bold}>47 Industries LLC</Text>, a limited liability company organized under the
            laws of the State of Florida, with its principal place of business at 3725 Coconut Creek Pkwy,
            Coconut Creek, FL 33066 (hereinafter referred to as the "Company" or "Service Provider")
          </Text>

          <Text style={[styles.paragraph, { textAlign: 'center' }]}>and</Text>

          <Text style={styles.indent}>
            <Text style={styles.bold}>{client.name}</Text>
            {client.email ? `, contactable at ${client.email}` : ''}
            {client.phone ? `, ${client.phone}` : ''}
            {client.address ? `, located at ${client.address}` : ''} (hereinafter referred to as the "Client")
          </Text>

          <Text style={styles.paragraph}>
            The Company and Client are hereinafter collectively referred to as the "Parties" and individually
            as a "Party."
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 1: PROJECT OVERVIEW</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.1 Project Name.</Text> {contract.projectName}
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.2 Scope of Work.</Text> The Company agrees to provide the following services:
          </Text>
          {contract.scope.map((item, index) => (
            <Text key={index} style={styles.listItem}>
              - {item}
            </Text>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 2: PAYMENT TERMS</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.1 Project Fee.</Text> The total project development fee is{' '}
            <Text style={styles.bold}>${contract.totalValue.toLocaleString()}</Text>.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.2 Payment Schedule.</Text> {contract.paymentTerms}
          </Text>
          {contract.monthlyValue && contract.monthlyValue > 0 && (
            <>
              <Text style={styles.paragraph}>
                <Text style={styles.bold}>2.3 Monthly Maintenance Fee.</Text> Following project completion, the Client
                agrees to pay a monthly maintenance fee of{' '}
                <Text style={styles.bold}>${contract.monthlyValue.toLocaleString()}/month</Text>.
              </Text>
              {contract.monthlyIncludes && contract.monthlyIncludes.length > 0 && (
                <>
                  <Text style={styles.paragraph}>
                    <Text style={styles.bold}>2.4 Monthly Maintenance Includes:</Text>
                  </Text>
                  {contract.monthlyIncludes.map((item, index) => (
                    <Text key={index} style={styles.listItem}>
                      - {item}
                    </Text>
                  ))}
                </>
              )}
            </>
          )}
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>
              2.{contract.monthlyValue ? '5' : '3'} Payment Method.
            </Text>{' '}
            Payment may be made via credit card, bank transfer, Zelle, or other mutually agreed upon methods.
            Invoices will be sent electronically and are due upon receipt unless otherwise specified.
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
          <Text style={styles.articleTitle}>ARTICLE 3: DELIVERABLES AND TIMELINE</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.1 Deliverables.</Text> The Company shall deliver a fully functional
            platform/service as described in Article 1, including all source code, documentation, and
            deployment to the production environment.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.2 Timeline.</Text> The Company will make reasonable efforts to complete
            the project within the agreed timeline. Delays caused by the Client's failure to provide
            required materials or feedback may extend the delivery date.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.3 Revisions.</Text> The project includes reasonable revisions during
            the development process. Major scope changes or feature additions may require additional fees
            as agreed upon in writing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 4: INTELLECTUAL PROPERTY</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.1 Ownership.</Text> Upon full payment of all fees, the Client shall
            own the custom code, designs, and content created specifically for this project.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.2 Third-Party Components.</Text> The project may incorporate open-source
            libraries and third-party services (such as hosting, payment processing, etc.) which remain
            subject to their respective licenses and terms.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.3 Portfolio Rights.</Text> The Company reserves the right to display
            the project in its portfolio and marketing materials unless otherwise agreed in writing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 5: WARRANTIES AND SUPPORT</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.1 Warranty Period.</Text> The Company warrants that the deliverables
            will function substantially as described for a period of thirty (30) days following delivery.
            During this period, the Company will fix any bugs or defects at no additional cost.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.2 Ongoing Support.</Text> After the warranty period, support and
            maintenance are provided under the terms of the monthly maintenance agreement, if applicable.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>5.3 Limitation of Liability.</Text> The Company's total liability under
            this Agreement shall not exceed the total fees paid by the Client. The Company shall not be
            liable for any indirect, incidental, or consequential damages.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 6: CONFIDENTIALITY</Text>
          <Text style={styles.paragraph}>
            Each Party agrees to maintain in confidence all non-public information received from the other
            Party, including but not limited to business strategies, customer data, and proprietary
            processes. This obligation shall survive termination of this Agreement for a period of two (2)
            years.
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
          <Text style={styles.articleTitle}>ARTICLE 7: TERM AND TERMINATION</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.1 Term.</Text> This Agreement shall commence on the Effective Date
            and continue until all services are completed and fees are paid, unless terminated earlier in
            accordance with this Article.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.2 Termination by Client.</Text> The Client may terminate this
            Agreement at any time by providing written notice. In the event of early termination, the
            Client shall pay for all work completed up to the termination date based on a reasonable
            assessment of work performed.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.3 Termination for Cause.</Text> Either Party may terminate this
            Agreement immediately upon written notice if the other Party materially breaches any provision
            and fails to cure such breach within fifteen (15) days of receiving written notice.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.4 Monthly Service Termination.</Text> Either Party may terminate
            the monthly maintenance service with thirty (30) days' written notice. Upon termination of
            monthly services, the Client will retain ownership of all deliverables but will no longer
            receive ongoing support, hosting management, or updates.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 8: GENERAL PROVISIONS</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.1 Entire Agreement.</Text> This Agreement constitutes the entire
            agreement between the Parties with respect to the subject matter hereof.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.2 Amendment.</Text> This Agreement may not be amended except by a
            written instrument signed by both Parties.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.3 Governing Law.</Text> This Agreement shall be governed by and
            construed in accordance with the laws of the State of Florida.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.4 Independent Contractor.</Text> The Company is an independent
            contractor and nothing in this Agreement creates an employer-employee relationship.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.5 Severability.</Text> If any provision of this Agreement is held
            invalid, the remaining provisions shall continue in full force and effect.
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
              <Text style={styles.signatureLabel}>CLIENT</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{client.name}</Text>
              <Text style={styles.dateLine}>Date: _______________________</Text>
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
