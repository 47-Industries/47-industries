import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { width: 28, height: 28 },
    md: { width: 36, height: 36 },
    lg: { width: 48, height: 48 },
  }

  const { width, height } = sizes[size]

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.svg"
        alt="47 Industries"
        width={width}
        height={height}
        className="rounded-lg"
        priority
      />
      {showText && (
        <span className="text-xl font-bold">47 Industries</span>
      )}
    </Link>
  )
}
