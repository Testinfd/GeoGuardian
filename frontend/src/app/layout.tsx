/**
 * Root Layout Component
 * Main layout wrapper for the entire application
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ClientLayout } from '@/components/layout/ClientLayout'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GeoGuardian - Environmental Monitoring Platform',
  description: 'Real-time satellite imagery analysis for environmental change detection',
  keywords: 'satellite imagery, environmental monitoring, change detection, GIS, remote sensing',
  authors: [{ name: 'GeoGuardian Team' }],
  openGraph: {
    title: 'GeoGuardian - Environmental Monitoring Platform',
    description: 'Real-time satellite imagery analysis for environmental change detection',
    url: 'https://geoguardian.vercel.app',
    siteName: 'GeoGuardian',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GeoGuardian - Environmental Monitoring Platform',
    description: 'Real-time satellite imagery analysis for environmental change detection',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
