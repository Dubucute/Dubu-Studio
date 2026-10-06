import type { Metadata, Viewport } from 'next'
import { Nunito, Quicksand } from 'next/font/google'
import BoothApp from '@/components/BoothApp'
import './globals.css'

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Peachy Studio — cute photo strips in your browser',
  description:
    'Snap, style and download a photo strip. Everything happens in your browser: no sign-up, no uploads, no watermark.',
  applicationName: 'Peachy Studio',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets the sticky action bar hug the home indicator on phones.
  viewportFit: 'cover',
  themeColor: '#fff6fa',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${quicksand.variable} ${nunito.variable}`}>
      <body className="font-body text-ink antialiased">{children}</body>
    </html>
  )
}