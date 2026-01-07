import type { Metadata } from "next"
import { Geist, Geist_Mono, Poppins } from "next/font/google"
import { Providers } from "@/lib/providers"
import "./globals.css"

// Environment variables are available at runtime without force-dynamic
// Removed force-dynamic to enable static optimization for root layout

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], // Regular, Medium, SemiBold, Bold
})

export const metadata: Metadata = {
  title: {
    default: "Yi CreativeStudio | AI-Powered Brand Creative Generation",
    template: "%s | Yi CreativeStudio",
  },
  description:
    "Generate stunning, on-brand marketing materials instantly with AI. Built for Young Indians chapters to create professional event posters, social posts, and more.",
  keywords: [
    "AI",
    "creative",
    "design",
    "poster",
    "marketing",
    "Young Indians",
    "Yi",
    "brand",
    "generation",
  ],
  authors: [{ name: "Yi CreativeStudio" }],
  creator: "Yi CreativeStudio",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Yi CreativeStudio",
    title: "Yi CreativeStudio | AI-Powered Brand Creative Generation",
    description:
      "Generate stunning, on-brand marketing materials instantly with AI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Yi CreativeStudio",
    description:
      "Generate stunning, on-brand marketing materials instantly with AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
