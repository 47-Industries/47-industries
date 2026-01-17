import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://47industries.com'),
  title: {
    default: "47 Industries - 3D Printing, Web & App Development",
    template: "%s | 47 Industries",
  },
  description: "Leading provider of 3D printing services, custom manufacturing, and innovative web and app development solutions. Parent company to MotoRev.",
  keywords: ["3D printing", "custom manufacturing", "web development", "app development", "AI solutions", "47 Industries", "MotoRev"],
  authors: [{ name: "47 Industries" }],
  creator: "47 Industries",
  publisher: "47 Industries",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "47 Industries",
    title: "47 Industries - 3D Printing, Web & App Development",
    description: "Leading provider of 3D printing services, custom manufacturing, and innovative web and app development solutions.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "47 Industries",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "47 Industries - 3D Printing, Web & App Development",
    description: "Leading provider of 3D printing services, custom manufacturing, and innovative web and app development solutions.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification if available
    // google: "your-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
