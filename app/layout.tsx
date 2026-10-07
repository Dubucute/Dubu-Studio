import type { Metadata, Viewport } from 'next'
import { Nunito, Quicksand } from 'next/font/google'
import BoothApp from '@/components/BoothApp'
import { THEME_SCRIPT } from '@/state/theme'
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
  title: 'Dubu Studio — cute photo strips in your browser',
  description:
    'Snap, style and download a photo strip. Everything happens in your browser: no sign-up, no uploads, no watermark.',
  applicationName: 'Dubu Studio',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Lets the sticky action bar hug the home indicator on phones.
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fff6fa' },
    { media: '(prefers-color-scheme: dark)', color: '#23132f' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme script adds `dark` to <html> before hydration — the class is owned by
    // the browser again, so React must not complain about the expected mismatch.
    <html lang="en" className={`${quicksand.variable} ${nunito.variable}`} suppressHydrationWarning>
      <body className="font-body text-ink antialiased">
        {/* Applies the stored (or system) theme before first paint — see state/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {children}
      </body>
    </html>
  )
}