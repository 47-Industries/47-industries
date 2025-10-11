import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const heights = {
    sm: 24,
    md: 32,
    lg: 40,
  }

  // To use your own logo:
  // 1. Add your logo image to /public/logo.png (or logo.svg)
  // 2. Uncomment the Image component below
  // 3. Comment out the text fallback

  return (
    <Link href="/" className={`flex items-center ${className}`}>
      {/* Logo Image - Uncomment and add your logo to /public/logo.png */}
      {/* <Image
        src="/logo.png"
        alt="47 Industries"
        width={heights[size] * 3}
        height={heights[size]}
        className="h-auto"
      /> */}

      {/* Text Fallback */}
      <span className="text-xl font-bold">47 Industries</span>
    </Link>
  )
}
