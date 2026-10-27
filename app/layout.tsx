import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/geist'
import '@fontsource-variable/jetbrains-mono'
import './globals.css'
import { BusyProvider } from '@/components/Busy'
import { ToastProvider } from '@/components/Toast'
import { PwaRegister } from '@/components/PwaRegister'

export const metadata: Metadata = {
  title: { default: 'Arus — Money Manager', template: '%s · Arus' },
  description: 'Aplikasi web untuk mencatat pengeluaran, mengatur anggaran, tagihan, kartu kredit, dan tabungan per bulan.',
  appleWebApp: { capable: true, title: 'Arus', statusBarStyle: 'default' },
  icons: { apple: '/apple-touch-icon.png' },
}
export const viewport: Viewport = { themeColor: '#f7f8fb', width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body><BusyProvider><ToastProvider>{children}</ToastProvider><PwaRegister /></BusyProvider></body>
    </html>
  )
}
