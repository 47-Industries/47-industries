import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-surface border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <Logo className="mb-4" />
            <p className="text-text-secondary text-sm">
              Innovation in 3D printing, custom manufacturing, and digital solutions.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="text-text-secondary hover:text-text-primary transition-colors">
                  3D Printed Products
                </Link>
              </li>
              <li>
                <Link href="/custom-3d-printing" className="text-text-secondary hover:text-text-primary transition-colors">
                  Custom 3D Printing
                </Link>
              </li>
              <li>
                <Link href="/web-development" className="text-text-secondary hover:text-text-primary transition-colors">
                  Web Development
                </Link>
              </li>
              <li>
                <Link href="/app-development" className="text-text-secondary hover:text-text-primary transition-colors">
                  App Development
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-text-secondary hover:text-text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/motorev" className="text-text-secondary hover:text-text-primary transition-colors">
                  MotoRev
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-secondary hover:text-text-primary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/terms" className="text-text-secondary hover:text-text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-text-secondary hover:text-text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/refund" className="text-text-secondary hover:text-text-primary transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/shipping" className="text-text-secondary hover:text-text-primary transition-colors">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-text-secondary">
          <p>&copy; {currentYear} 47 Industries. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
