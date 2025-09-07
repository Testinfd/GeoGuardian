import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GeoGuardian - Environmental Monitoring',
  description: 'Plug-and-play environmental monitoring with satellite data',
  keywords: 'environmental monitoring, satellite imagery, Sentinel-2, pollution detection, conservation',
  authors: [{ name: 'GeoGuardian Team' }],
  openGraph: {
    title: 'GeoGuardian - Environmental Monitoring',
    description: 'Monitor environmental changes anywhere on Earth using satellite imagery and AI.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}