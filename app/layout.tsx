/**
 * Root Layout - Amaralina FC
 * Version: 30.0 - PWA Support + Mobile Optimized
 */
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { DataProvider } from '@/contexts/data-context'
import { VersionChecker } from '@/components/version-checker'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

// Nao pre-renderizar estaticamente - o app usa autenticacao Supabase no cliente
export const dynamic = 'force-dynamic'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#C5A059',
}

export const metadata: Metadata = {
  title: 'Amaralina FC - Sistema de Estatísticas',
  description: 'Dashboard de estatísticas de futebol do Amaralina FC',
  generator: 'v0.app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Amaralina FC',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon.png', sizes: '152x152', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased overscroll-none`}>
        <AuthProvider>
          <DataProvider>
            {children}
            <VersionChecker />
          </DataProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}