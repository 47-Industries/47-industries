import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '47 Industries',
  description: 'Connect your MotoRev account',
  // Prevent indexing of mobile-only pages
  robots: 'noindex, nofollow',
}

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Simple layout without header/footer for mobile WebView experience
  return (
    <main className="min-h-screen bg-black">
      {children}
    </main>
  )
}
