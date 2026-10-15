import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Arus — Money Manager',
    short_name: 'Arus',
    description: 'Catat pengeluaran, atur anggaran, tagihan, dan tabungan per bulan.',
    lang: 'id',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f8fb',
    theme_color: '#f7f8fb',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
