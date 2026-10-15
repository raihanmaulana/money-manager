import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DEMO } from '@/lib/data'
import { supabaseServer } from '@/lib/supabase/server'
import { Mark } from '@/components/Mark'
import { CommandPaletteTrigger } from '@/components/CommandPalette'
import './landing.css'

export const dynamic = 'force-dynamic'

const MODULES = [
  { name: 'Catatan', does: 'Pengeluaran harian dengan filter tanggal, kategori, sumber dana, dan rentang nominal. Pengeluaran berulang seperti uang kos dibuat otomatis tiap bulan.', note: 'Ekspor CSV' },
  { name: 'Tagihan', does: 'Tagihan rutin, cicilan, hutang, dan kartu kredit. Kartu kredit punya batas pembayaran minimum dan bar kemajuan pembayaran.', note: 'Bayar sebagian, riwayat bayar' },
  { name: 'Anggaran', does: 'Pemasukan, potongan, dan kategori per bulan, dibandingkan dengan rasio kebutuhan, gaya hidup, dan tabungan.', note: 'Terpisah tiap bulan' },
  { name: 'Sumber dana', does: 'Saldo bank, e-wallet, dan tunai dihitung dari catatan. Pindah dana dengan biaya admin, serta penyesuaian saat saldo aplikasi berbeda dengan saldo asli.', note: 'Peringatan saldo minus' },
  { name: 'Tabungan', does: 'Target tabungan dan dana darurat dengan rencana setoran per bulan.', note: 'Setor dan tarik' },
  { name: 'Laporan', does: 'Ringkasan bulanan siap cetak atau simpan sebagai PDF, ditambah sinkron satu arah ke Google Sheet untuk audit.', note: 'PDF, CSV, Google Sheet' },
]

const STEPS = [
  { t: 'Susun rencana bulan ini', d: 'Masukkan pemasukan, lalu bagi ke kategori kebutuhan, gaya hidup, tabungan, dan investasi. Bisa disalin dari bulan sebelumnya.' },
  { t: 'Catat setiap pengeluaran', d: 'Pilih kategori dan sumber dana. Sisa jatah dan batas aman per hari langsung dihitung ulang.' },
  { t: 'Bayar tagihan dari sumber dana', d: 'Pembayaran tagihan dan kartu kredit mengurangi saldo sumber dana yang dipilih, sehingga saldo tetap sesuai kenyataan.' },
  { t: 'Tinjau dan ekspor', d: 'Lihat ringkasan, atasi peringatan, lalu unduh CSV atau cetak laporan bulanan.' },
]

const STACK = [
  ['Antarmuka', 'Next.js 15 (App Router), React 19, TypeScript'],
  ['Data', 'PostgreSQL di Supabase dengan row-level security'],
  ['Autentikasi', 'Supabase Auth, email dan kata sandi'],
  ['Hosting', 'Vercel, deploy otomatis dari GitHub'],
  ['Aplikasi', 'PWA: bisa dipasang di layar utama ponsel'],
  ['Kualitas', 'Uji otomatis untuk perhitungan saldo, tagihan, dan sinkron Sheet'],
]

export default async function Landing() {
  let signedIn = false
  if (!DEMO) {
    const sb = await supabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    signedIn = !!user
  }
  const cta = signedIn ? { href: '/dashboard', label: 'Buka dashboard' } : { href: '/masuk?mode=daftar', label: 'Buat akun' }

  return (
    <>
      <a className="lp-skip" href="#isi">Lewati ke konten</a>
      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <Link href="/" className="brand" aria-label="Arus, halaman utama"><Mark /><span><b>Arus</b></span></Link>
          <CommandPaletteTrigger mode="site" className="lp-pill" />
          <nav className="lp-nav-r" aria-label="Utama">
            <a className="lp-link" href="#fitur">Fitur</a>
            <a className="lp-link" href="#teknologi">Teknologi</a>
            <Link className="btn small" href={signedIn ? '/dashboard' : '/masuk'}>{signedIn ? 'Dashboard' : 'Masuk'}</Link>
          </nav>
        </div>
      </header>

      <main id="isi">
        <section className="lp-hero">
          <div className="lp-wrap lp-hero-grid">
            <div className="lp-hero-copy">
              <h1 className="lp-rise" style={{ ['--i' as string]: 0 }}>Catat, anggarkan, dan bayar tagihan dari satu tempat.</h1>
              <p className="lp-lead lp-rise" style={{ ['--i' as string]: 1 }}>Arus adalah aplikasi web pengelola keuangan pribadi. Pengeluaran harian, tagihan dan kartu kredit, saldo tiap bank dan e-wallet, serta target tabungan dihitung per bulan dan selalu sinkron.</p>
              <div className="lp-cta lp-rise" style={{ ['--i' as string]: 2 }}>
                <Link className="btn" href={cta.href}>{cta.label} <ArrowRight aria-hidden /></Link>
                <a className="lp-textlink" href="#fitur">Lihat fitur</a>
              </div>
              <p className="lp-fact mono lp-rise" style={{ ['--i' as string]: 3 }}>Gratis dipakai · Data per akun · Bisa dipasang di ponsel</p>
            </div>
            <figure className="lp-shot lp-rise" style={{ ['--i' as string]: 2 }}>
              <img src="/screens/ringkasan.webp" width={1920} height={1200} alt="Halaman Ringkasan Arus: sisa jatah bulan ini, peringatan tagihan, dan formulir catat pengeluaran" fetchPriority="high" />
              <figcaption>Halaman Ringkasan, dengan data contoh.</figcaption>
            </figure>
          </div>
        </section>

        <section className="lp-sec" id="fitur" aria-labelledby="h-fitur">
          <div className="lp-wrap">
            <h2 id="h-fitur" className="lp-h2">Enam modul untuk satu siklus bulanan.</h2>
            <table className="lp-spec">
              <caption className="sr">Modul Arus dan fungsinya</caption>
              <thead><tr><th scope="col">Modul</th><th scope="col">Fungsi</th><th scope="col">Keluaran</th></tr></thead>
              <tbody>
                {MODULES.map((m) => (
                  <tr key={m.name}><th scope="row">{m.name}</th><td>{m.does}</td><td className="lp-note">{m.note}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="lp-sec lp-tight" aria-label="Cuplikan tampilan">
          <div className="lp-wrap lp-rows">
            <div className="lp-row">
              <figure className="lp-shot"><img src="/screens/tagihan.webp" width={1920} height={1200} alt="Halaman Tagihan: daftar tagihan dengan status lunas dan telat serta tombol bayar" loading="lazy" /></figure>
              <div className="lp-row-copy">
                <h3>Tagihan tidak terlewat.</h3>
                <p>Setiap tagihan menampilkan tanggal jatuh tempo, status, dan sisa yang harus dibayar. Yang telat ditandai, dan muncul sebagai peringatan di Ringkasan.</p>
                <ul className="lp-points">
                  <li>Kartu kredit dengan pembayaran minimum dan progres</li>
                  <li>Pembayaran dicatat dari sumber dana yang dipilih</li>
                </ul>
              </div>
            </div>
            <div className="lp-row rev">
              <figure className="lp-shot"><img src="/screens/catatan.webp" width={1920} height={1200} alt="Halaman Catatan: pengeluaran dikelompokkan per hari dengan tombol filter" loading="lazy" /></figure>
              <div className="lp-row-copy">
                <h3>Catatan yang mudah dicari.</h3>
                <p>Pengeluaran dikelompokkan per hari dengan total harian. Filter dibuka dalam satu dialog dan bisa digabung: tanggal, kategori, sumber dana, dan rentang nominal.</p>
                <ul className="lp-points">
                  <li>Pengeluaran berulang dibuat otomatis</li>
                  <li>Ekspor CSV dan laporan siap cetak</li>
                </ul>
              </div>
            </div>
            <div className="lp-row">
              <figure className="lp-shot"><img src="/screens/sumber-dana.webp" width={1920} height={1200} alt="Halaman Sumber dana: saldo bank dan e-wallet beserta riwayat pindah dana" loading="lazy" /></figure>
              <div className="lp-row-copy">
                <h3>Saldo sesuai kenyataan.</h3>
                <p>Saldo setiap bank dan e-wallet dihitung dari catatan. Jika angka di aplikasi bank berbeda, ketik saldo aslinya dan selisihnya dicatat sebagai penyesuaian.</p>
                <ul className="lp-points">
                  <li>Pindah dana lengkap dengan biaya admin</li>
                  <li>Peringatan saat saldo minus</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-sec" id="cara-kerja" aria-labelledby="h-cara">
          <div className="lp-wrap">
            <h2 id="h-cara" className="lp-h2">Alurnya sama setiap bulan.</h2>
            <ol className="lp-steps">
              {STEPS.map((s, i) => (
                <li key={s.t}><span className="lp-stage mono" aria-hidden>{i + 1}.0</span><h3>{s.t}</h3><p>{s.d}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-dark" id="teknologi" aria-labelledby="h-tek">
          <div className="lp-wrap lp-dark-grid">
            <div className="lp-dark-copy">
              <h2 id="h-tek" className="lp-h2">Dibangun dengan praktik produk sungguhan.</h2>
              <p>Setiap baris data terikat ke akun pemiliknya dan dibatasi oleh row-level security di database, bukan hanya di antarmuka. Pengguna lain tidak dapat membaca atau mengubah catatan Anda.</p>
              <p>Perhitungan saldo dan tagihan dipisahkan dari tampilan dan diuji otomatis.</p>
            </div>
            <dl className="lp-stack">
              {STACK.map(([k, v]) => (
                <div key={k}><dt className="mono">{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </div>
        </section>

        <section className="lp-sec lp-close" aria-labelledby="h-mulai">
          <div className="lp-wrap lp-close-in">
            <h2 id="h-mulai" className="lp-h2">Mulai dengan satu bulan.</h2>
            <div className="lp-cta">
              <Link className="btn" href={cta.href}>{cta.label} <ArrowRight aria-hidden /></Link>
              {signedIn ? null : <Link className="btn ghost" href="/masuk">Masuk</Link>}
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-wrap">
          <p className="mono">Arus — Money Manager. Dirancang dan dikembangkan oleh Raihan Maulana. Dibangun dengan Next.js, Supabase, dan Vercel; huruf Space Grotesk, Geist, dan JetBrains Mono. Data contoh pada tangkapan layar bersifat fiktif. 2026.</p>
        </div>
      </footer>
    </>
  )
}
