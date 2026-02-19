import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Yure Flix - Filmes e Series',
  description: 'Assista filmes e series online gratuitamente. Descubra os melhores titulos do momento.',
}

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
}

import { AuthProvider } from '@/components/auth-provider';
import { PresenceTracker } from '@/components/presence-tracker';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <PresenceTracker />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
