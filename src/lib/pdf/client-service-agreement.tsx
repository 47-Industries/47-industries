import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    paddingBottom: 80,
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
  scopeItem: {
    marginLeft: 30,
    marginBottom: 4,
    fontSize: 10,
  },
})

interface ClientServiceAgreementProps {
  client: {
    name: string
    email: string
    phone?: string | null
    address?: string | null
    clientNumber: string
  }
  project: {
    name: string
    description?: string | null
    contractValue: number
    monthlyRecurring?: number | null
    type: string
  }
  contract: {
    contractNumber: string
    title: string
  }
  effectiveDate: string
}

export function ClientServiceAgreementPDF({ client, project, contract, effectiveDate }: ClientServiceAgreementProps) {
  const formattedDate = new Date(effectiveDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  }

  const serviceTypeLabel = {
    WEB_DEVELOPMENT: 'Web Development',
    APP_DEVELOPMENT: 'Application Development',
    AI_SOLUTIONS: 'AI Solutions',
    THREE_D_PRINTING: '3D Printing',
    CONSULTING: 'Technology Consulting',
    MAINTENANCE: 'Maintenance & Support',
    OTHER: 'Technology Services',
  }[project.type] || 'Technology Services'

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        {/* Fixed footer on every page */}
        <View style={styles.footer} fixed>
          <Text>47 Industries LLC | 11275 52nd Ave N, St. Petersburg, FL 33708</Text>
          <Text>www.47industries.com | info@47industries.com</Text>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>SERVICE AGREEMENT</Text>
          <Text style={styles.subtitle}>Agreement Number: {contract.contractNumber}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.paragraph}>
            This Service Agreement (the "Agreement") is entered into as of{' '}
            <Text style={styles.bold}>{formattedDate}</Text> (the "Effective Date"), by and between:
          </Text>

          <Text style={styles.indent}>
            <Text style={styles.bold}>47 Industries LLC</Text>, a limited liability company organized under the
            laws of the State of Florida, with its principal place of business at 11275 52nd Ave N,
            St. Petersburg, FL 33708 (hereinafter referred to as the "Company")
          </Text>

          <Text style={[styles.paragraph, { textAlign: 'center' }]}>and</Text>

          <Text style={styles.indent}>
            <Text style={styles.bold}>{client.name}</Text>
            {client.address ? `, located at ${client.address}` : ''}
            {client.email ? `, contactable at ${client.email}` : ''}
            {client.phone ? `, ${client.phone}` : ''} (hereinafter referred to as the "Client")
          </Text>

          <Text style={styles.paragraph}>
            The Company and Client are hereinafter collectively referred to as the "Parties" and individually
            as a "Party."
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 1: SCOPE OF SERVICES</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.1 Project Overview.</Text> The Company agrees to provide{' '}
            <Text style={styles.bold}>{serviceTypeLabel}</Text> services to the Client for the project titled{' '}
            <Text style={styles.bold}>"{project.name}"</Text> as described herein.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>1.2 Deliverables.</Text> The Company shall deliver the completed project
            in accordance with the specifications agreed upon by both Parties. The detailed scope of work,
            deliverables, and milestones will be documented separately and provided to the Client.
            Any changes to the scope of work must be agreed upon in writing by both Parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 2: COMPENSATION</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.1 Project Fee.</Text> The Client agrees to pay the Company a total
            project fee of <Text style={styles.bold}>{formatCurrency(project.contractValue)}</Text> for the
            services described in Article 1.
          </Text>
          {project.monthlyRecurring && project.monthlyRecurring > 0 && (
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>2.2 Monthly Service Fee.</Text> Following project completion, the Client
              agrees to pay a monthly service fee of{' '}
              <Text style={styles.bold}>{formatCurrency(project.monthlyRecurring)}</Text> for ongoing maintenance,
              hosting, support, and updates as agreed upon by both Parties.
            </Text>
          )}
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.3 Payment Terms.</Text> Payment shall be made according to the following
            schedule unless otherwise agreed in writing: 50% due upon signing of this Agreement, with the
            remaining 50% due upon project completion.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>2.4 Late Payments.</Text> Payments not received within fifteen (15) days
            of the due date shall incur a late fee of 1.5% per month on the outstanding balance.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 3: TIMELINE</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.1 Project Timeline.</Text> The Company shall use reasonable efforts to
            complete the project within the timeframe discussed with the Client. Specific milestones and deadlines
            will be communicated during the project.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.2 Client Responsibilities.</Text> The Client acknowledges that timely
            completion depends on the Client providing necessary materials, feedback, and approvals in a timely
            manner. Delays caused by the Client may result in adjusted timelines.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>3.3 Force Majeure.</Text> Neither Party shall be liable for delays or
            failures in performance resulting from circumstances beyond its reasonable control.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 4: INTELLECTUAL PROPERTY</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.1 Ownership.</Text> Upon full payment of all fees, the Client shall own
            all custom work product created specifically for the Client under this Agreement, excluding any
            pre-existing materials or third-party components.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.2 License to Pre-existing Materials.</Text> The Company grants the Client
            a non-exclusive, perpetual license to use any pre-existing materials incorporated into the
            deliverables solely in connection with the Client's use of the deliverables.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>4.3 Portfolio Rights.</Text> The Company reserves the right to display
            the completed work in its portfolio and marketing materials, unless the Client requests otherwise
            in writing.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 5: CONFIDENTIALITY</Text>
          <Text style={styles.paragraph}>
            Each Party agrees to maintain in confidence all non-public information received from the other Party,
            including but not limited to business strategies, customer data, and proprietary processes. This
            obligation shall survive the termination of this Agreement for a period of two (2) years.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 6: WARRANTIES AND LIMITATIONS</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.1 Warranty.</Text> The Company warrants that all services will be
            performed in a professional and workmanlike manner consistent with industry standards.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>6.2 Limitation of Liability.</Text> In no event shall the Company's total
            liability exceed the total fees paid by the Client under this Agreement. The Company shall not be
            liable for any indirect, incidental, special, or consequential damages.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.articleTitle}>ARTICLE 7: TERM AND TERMINATION</Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.1 Term.</Text> This Agreement shall commence on the Effective Date and
            continue until all services are completed and fees are paid, unless terminated earlier in accordance
            with this Article.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.2 Termination by Client.</Text> The Client may terminate this Agreement
            at any time by providing written notice. Upon termination, the Client shall pay for all work
            completed up to the termination date.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>7.3 Termination for Cause.</Text> Either Party may terminate this Agreement
            immediately upon written notice if the other Party materially breaches any provision and fails to
            cure such breach within fifteen (15) days of receiving written notice.
          </Text>
          {project.monthlyRecurring && project.monthlyRecurring > 0 && (
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>7.4 Monthly Service Termination.</Text> Either Party may terminate the
              monthly maintenance service with thirty (30) days' written notice. Upon termination of monthly
              services, the Client will retain ownership of all deliverables but will no longer receive ongoing
              support, hosting management, or updates.
            </Text>
          )}
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
            <Text style={styles.bold}>8.3 Governing Law.</Text> This Agreement shall be governed by and construed
            in accordance with the laws of the State of Florida.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.4 Independent Contractor.</Text> The Company is an independent contractor
            and nothing in this Agreement creates an employer-employee relationship.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>8.5 Severability.</Text> If any provision of this Agreement is held invalid,
            the remaining provisions shall continue in full force and effect.
          </Text>
        </View>

        <View style={styles.signatureSection} wrap={false}>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>IN WITNESS WHEREOF</Text>, the Parties have executed this Agreement as of
            the date first written above.
          </Text>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <Text style={styles.signatureLabel}>47 INDUSTRIES LLC</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>Kyle Rivers, President</Text>
              <Text style={styles.dateLine}>Date: _______________________</Text>

              <View style={[styles.signatureLine, { marginTop: 30 }]} />
              <Text style={styles.signatureName}>Dean Sabr, Chief Executive Officer</Text>
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
      </Page>
    </Document>
  )
}
