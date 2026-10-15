import Link from 'next/link'
import { AuthForm } from '@/components/AuthForm'
import { Mark } from '@/components/Mark'

export const metadata = { title: 'Masuk' }

export default async function Masuk({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams
  return (
    <div className="auth">
      <section className="auth-art" aria-label="Tentang Arus">
        <Link href="/" className="brand" aria-label="Arus, ke halaman utama"><Mark /><span><b>Arus</b><small>money manager</small></span></Link>
        <div className="stack" style={{ gap: 'var(--space-5)' }}>
          <h1>Keuangan bulanan, tercatat rapi.</h1>
          <p>Catat pengeluaran, pantau tagihan dan kartu kredit, dan lihat sisa jatah setiap hari dalam satu tempat.</p>
        </div>
        <ul className="auth-points">
          <li><b>01</b><span>Data per akun, dilindungi row-level security</span></li>
          <li><b>02</b><span>Ekspor CSV dan laporan siap cetak</span></li>
          <li><b>03</b><span>Bisa dipasang sebagai aplikasi di ponsel</span></li>
        </ul>
      </section>
      <section className="auth-form"><AuthForm initial={mode === 'daftar' ? 'daftar' : 'masuk'} /></section>
    </div>
  )
}
