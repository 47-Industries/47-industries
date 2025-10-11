import ContactForm from '@/components/ContactForm'

export default function ContactPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="max-w-4xl mx-auto mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl text-text-secondary">
            Have a question or ready to start your project? We'd love to hear from you.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <ContactForm />
            </div>

            {/* Contact Info */}
            <div>
              <div className="border border-border rounded-2xl p-8 mb-8">
                <h3 className="text-2xl font-bold mb-6">Get in Touch</h3>
                <div className="space-y-6">
                  <div>
                    <div className="font-semibold mb-2">Email</div>
                    <a href="mailto:contact@47industries.com" className="text-accent hover:underline">
                      contact@47industries.com
                    </a>
                  </div>
                  <div>
                    <div className="font-semibold mb-2">Business Hours</div>
                    <p className="text-text-secondary">
                      Monday - Friday: 9:00 AM - 6:00 PM EST<br />
                      Weekend: By appointment
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-border rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <a href="/custom-3d-printing" className="block text-text-secondary hover:text-text-primary transition-colors">
                    → Request 3D Printing Quote
                  </a>
                  <a href="/web-development" className="block text-text-secondary hover:text-text-primary transition-colors">
                    → View Web Development Packages
                  </a>
                  <a href="/app-development" className="block text-text-secondary hover:text-text-primary transition-colors">
                    → Explore App Development
                  </a>
                  <a href="/shop" className="block text-text-secondary hover:text-text-primary transition-colors">
                    → Browse Products
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'Contact Us - 47 Industries',
  description: 'Get in touch with 47 Industries for your manufacturing and development needs.',
}
