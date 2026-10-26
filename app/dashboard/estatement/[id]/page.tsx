import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getCtx, loadPocketsAt, loadStatements } from '@/lib/data'
import { rp, ymLabel } from '@/lib/calc'
import { isCreditKind } from '@/lib/types'
import { PageHead } from '@/components/PageHead'
import { PrintButton } from '@/components/PrintButton'
import { StatementFileButton } from '@/components/StatementFileButton'
import { LinkBusy } from '@/components/LinkBusy'

export const metadata = { title: 'Laporan e-statement' }
const tgl = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const sgn = (n: number) => (n < 0 ? '− ' : n > 0 ? '+ ' : '') + rp(Math.abs(n))

export default async function LaporanStatement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx()
  const list = await loadStatements(ctx)
  const s = list.find((x) => x.id === id)
  if (!s) redirect('/dashboard/estatement')
  const cc = isCreditKind(s.pocket_kind)
  const calc = cc ? s.opening - s.total_in + s.total_out : s.opening + s.total_in - s.total_out
  const selfDiff = s.closing - calc
  const at = !cc && s.pocket_id ? (await loadPocketsAt(ctx, s.period)).find((p) => p.id === s.pocket_id) : undefined
  const appDiff = at ? s.closing - at.saldo : null
  const L = cc
    ? { o: 'Tagihan sebelumnya', i: 'Pembayaran diterima', u: 'Pembelanjaan bulan ini', c: 'Tagihan bulan ini' }
    : { o: 'Saldo awal', i: 'Total masuk', u: 'Total keluar', c: 'Saldo akhir' }

  return (
    <>
      <PageHead ctx={ctx} title={`E-Statement ${s.pocket_name}`} sub={ymLabel(s.period)} month={false} actions={
        <>
          <Link className="btn small ghost" href="/dashboard/estatement"><ArrowLeft aria-hidden size={16} /> Semua statement<LinkBusy /></Link>
          {s.file_path ? <StatementFileButton id={s.id} className="btn small ghost" /> : null}
          <PrintButton />
        </>
      } />
      <article className="report">
        <header className="rpt-head">
          <div>
            <p className="rpt-brand">Arus · Money Manager</p>
            <h1>Ringkasan E-Statement</h1>
            <p className="rpt-period">{s.pocket_name} · {ymLabel(s.period)}</p>
          </div>
          <dl className="rpt-meta">
            <div><dt>Disusun untuk</dt><dd>{ctx.nama}</dd></div>
            <div><dt>Dicetak</dt><dd>{tgl(ctx.today.iso)}</dd></div>
          </dl>
        </header>

        <section className="rpt-kpis" aria-label="Ringkasan">
          <div className="rpt-kpi"><span>{L.o}</span><b>{rp(s.opening)}</b></div>
          <div className="rpt-kpi"><span>{L.i}</span><b>{rp(s.total_in)}</b></div>
          <div className="rpt-kpi"><span>{L.u}</span><b>{rp(s.total_out)}</b></div>
          <div className="rpt-kpi pos"><span>{L.c}</span><b>{rp(s.closing)}</b></div>
        </section>

        <section className="rpt-sec">
          <h2>Perhitungan</h2>
          <table className="report-table">
            <tbody>
              <tr><td>{L.o}</td><td className="r">{rp(s.opening)}</td></tr>
              <tr><td>{cc ? '−' : '+'} {L.i}</td><td className="r">{rp(s.total_in)}</td></tr>
              <tr><td>{cc ? '+' : '−'} {L.u}</td><td className="r">{rp(s.total_out)}</td></tr>
              <tr className="total"><td>Hasil hitung</td><td className="r">{rp(calc)}</td></tr>
              <tr><td>{L.c} (tertera di statement)</td><td className="r">{rp(s.closing)}</td></tr>
              <tr className="total"><td>Selisih</td><td className="r">{selfDiff === 0 ? 'Cocok' : sgn(selfDiff)}</td></tr>
            </tbody>
          </table>
        </section>

        {cc ? (
          <section className="rpt-sec">
            <h2>Pembayaran</h2>
            <table className="report-table">
              <tbody>
                <tr><td>Tagihan bulan ini</td><td className="r">{rp(s.closing)}</td></tr>
                <tr><td>Pembayaran minimum</td><td className="r">{rp(s.min_payment)}</td></tr>
                <tr><td>Jatuh tempo</td><td className="r">{s.due_on ? tgl(s.due_on) : '—'}</td></tr>
              </tbody>
            </table>
          </section>
        ) : at ? (
          <section className="rpt-sec">
            <h2>Dibandingkan dengan catatan di aplikasi</h2>
            <table className="report-table">
              <tbody>
                <tr><td>Saldo akhir menurut statement</td><td className="r">{rp(s.closing)}</td></tr>
                <tr><td>Saldo {s.pocket_name} di aplikasi pada akhir {ymLabel(s.period)}</td><td className="r">{rp(at.saldo)}</td></tr>
                <tr className="total"><td>Selisih</td><td className="r">{appDiff === 0 ? 'Cocok' : sgn(appDiff ?? 0)}</td></tr>
              </tbody>
            </table>
            <p className="hint" style={{ marginTop: 'var(--space-2)' }}>{appDiff === 0 ? 'Catatan di aplikasi sudah sesuai dengan statement.' : 'Selisih berarti ada transaksi, biaya admin, bunga, atau pindah dana yang belum dicatat di aplikasi (atau tercatat keliru). Gunakan "Samakan saldo" di Sumber dana setelah ditelusuri.'}</p>
          </section>
        ) : null}

        <section className="rpt-sec">
          <h2>Arsip</h2>
          <table className="report-table">
            <tbody>
              <tr><td>File PDF asli</td><td className="r">{s.file_path ? `${s.file_name || 'tersimpan'} (${s.file_size >= 1_048_576 ? `${(s.file_size / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(s.file_size / 1024))} KB`})` : 'tidak disimpan'}</td></tr>
              {s.note ? <tr><td>Catatan</td><td className="r">{s.note}</td></tr> : null}
            </tbody>
          </table>
        </section>
      </article>
    </>
  )
}
