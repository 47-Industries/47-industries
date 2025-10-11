import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "47 Industries - 3D Printing, Web & App Development",
  description: "Leading provider of 3D printing services, custom manufacturing, and innovative web and app development solutions. Parent company to MotoRev.",
  keywords: ["3D printing", "custom manufacturing", "web development", "app development", "AI solutions"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
