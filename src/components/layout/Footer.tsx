import Link from 'next/link'
import Logo from './Logo'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-surface border-t border-border">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Logo and tagline centered */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Logo />
            </div>
            <p className="text-text-secondary text-sm">
              Innovation in 3D printing, custom manufacturing, and digital solutions.
            </p>
          </div>

          {/* Links in 2-column grid, centered */}
          <div className="flex justify-center gap-12 mb-6">
            {/* Services */}
            <div className="text-center">
              <h4 className="font-semibold mb-3 text-sm">Services</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/shop" className="text-text-secondary hover:text-text-primary transition-colors">
                    3D Products
                  </Link>
                </li>
                <li>
                  <Link href="/custom-3d-printing" className="text-text-secondary hover:text-text-primary transition-colors">
                    Custom Printing
                  </Link>
                </li>
                <li>
                  <Link href="/services?category=web" className="text-text-secondary hover:text-text-primary transition-colors">
                    Web Dev
                  </Link>
                </li>
                <li>
                  <Link href="/services?category=app" className="text-text-secondary hover:text-text-primary transition-colors">
                    App Dev
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="text-center">
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-text-secondary hover:text-text-primary transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/projects/motorev" className="text-text-secondary hover:text-text-primary transition-colors">
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
          </div>

          {/* Legal links as horizontal wrap */}
          <div className="border-t border-border pt-4 mb-4">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-text-secondary">
              <Link href="/legal/terms" className="hover:text-text-primary transition-colors">
                Terms
              </Link>
              <Link href="/legal/privacy" className="hover:text-text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/legal/refund" className="hover:text-text-primary transition-colors">
                Refunds
              </Link>
              <Link href="/legal/shipping" className="hover:text-text-primary transition-colors">
                Shipping
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center text-xs text-text-secondary">
            <p>&copy; {currentYear} 47 Industries. All rights reserved.</p>
            <p className="mt-1 text-text-muted">In loving memory of Bryce Raiford</p>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="grid grid-cols-4 gap-8">
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
                  <Link href="/services?category=web" className="text-text-secondary hover:text-text-primary transition-colors">
                    Web Development
                  </Link>
                </li>
                <li>
                  <Link href="/services?category=app" className="text-text-secondary hover:text-text-primary transition-colors">
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
                  <Link href="/projects/motorev" className="text-text-secondary hover:text-text-primary transition-colors">
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
            <p className="mt-2 text-text-muted text-xs">In loving memory of Bryce Raiford</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
