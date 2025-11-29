import Link from 'next/link'

export default function RefundPolicyPage() {
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

          <h1 className="text-4xl md:text-5xl font-bold mb-4">Refund Policy</h1>
          <p className="text-text-secondary mb-12">Last updated: November 2024</p>

          <div className="space-y-8 text-text-secondary">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
              <p>
                At 47 Industries, we want you to be completely satisfied with your purchase. This policy outlines our refund and return procedures for products and services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Standard Products</h2>

              <h3 className="text-xl font-semibold text-white mb-3">Return Window</h3>
              <p className="mb-4">
                You have 30 days from the date of delivery to return most products for a full refund.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3">Return Conditions</h3>
              <p className="mb-4">To be eligible for a return, items must be:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mb-6">
                <li>In original, unused condition</li>
                <li>In original packaging (if applicable)</li>
                <li>Accompanied by proof of purchase</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mb-3">How to Initiate a Return</h3>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Contact us at returns@47industries.com with your order number</li>
                <li>Receive a Return Merchandise Authorization (RMA) number</li>
                <li>Ship the item back with the RMA number clearly marked</li>
                <li>Receive your refund within 5-10 business days of receipt</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Custom 3D Printed Products</h2>
              <p className="mb-4">
                Due to the custom nature of 3D printed products, our refund policy differs:
              </p>

              <div className="bg-surface border border-border rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-white mb-3">Before Production</h3>
                <p>
                  Full refund available if you cancel before production begins. Once production starts, the order cannot be cancelled.
                </p>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6 mb-6">
                <h3 className="text-xl font-semibold text-white mb-3">After Delivery</h3>
                <p className="mb-4">Refunds or replacements are available only if:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The item is defective or damaged during shipping</li>
                  <li>The item does not match the approved design specifications</li>
                  <li>Material or finish differs from what was ordered</li>
                </ul>
              </div>

              <p className="text-sm italic">
                Note: Slight variations in 3D printed products are normal due to the manufacturing process and are not considered defects.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Digital Products & Services</h2>

              <h3 className="text-xl font-semibold text-white mb-3">Web & App Development</h3>
              <p className="mb-4">
                Development services are non-refundable once work has begun. Refund terms for specific projects are outlined in individual project agreements. Deposits are typically non-refundable.
              </p>

              <h3 className="text-xl font-semibold text-white mb-3">Digital Files</h3>
              <p>
                Due to the nature of digital products, sales of digital files (such as 3D models or designs) are final and non-refundable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Damaged or Defective Items</h2>
              <p className="mb-4">
                If you receive a damaged or defective item:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Contact us within 48 hours of delivery</li>
                <li>Provide photos of the damage or defect</li>
                <li>We will ship a replacement at no additional cost or issue a full refund</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Wrong Item Received</h2>
              <p>
                If you receive the wrong item, contact us immediately. We will arrange for the correct item to be shipped and provide a prepaid return label for the incorrect item.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Return Shipping</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Defective/Wrong Items:</strong> We cover return shipping costs</li>
                <li><strong>Change of Mind:</strong> Customer is responsible for return shipping</li>
                <li><strong>Original Shipping Costs:</strong> Non-refundable unless item was defective or wrong</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Refund Processing</h2>
              <p className="mb-4">
                Once we receive your return:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Inspection takes 1-2 business days</li>
                <li>Approved refunds are processed within 3-5 business days</li>
                <li>Refunds are issued to the original payment method</li>
                <li>Bank processing may take an additional 5-10 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Non-Refundable Items</h2>
              <p className="mb-4">The following items cannot be returned or refunded:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Custom orders (unless defective)</li>
                <li>Items marked as final sale</li>
                <li>Digital products and services</li>
                <li>Items damaged by customer misuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Exchanges</h2>
              <p>
                We do not offer direct exchanges. To exchange an item, please return the original item for a refund and place a new order.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
              <p className="mb-4">
                For questions about returns or refunds, please contact us:
              </p>
              <ul className="space-y-2">
                <li>Email: returns@47industries.com</li>
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
  title: 'Refund Policy - 47 Industries',
  description: 'Refund and return policy for 47 Industries products and services',
}
