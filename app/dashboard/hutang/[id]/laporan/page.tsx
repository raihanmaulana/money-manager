import { redirect } from 'next/navigation'
import { getCtx, loadDebtPerson } from '@/lib/data'
import { rp } from '@/lib/calc'
import { debtSentence, debtSummary, shareLabel } from '@/lib/debt'
import type { DebtEntry } from '@/lib/types'
import { PageHead } from '@/components/PageHead'
import { PrintButton } from '@/components/PrintButton'

export const metadata = { title: 'Laporan hutang' }
const tgl = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export default async function LaporanHutang({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx()
  const data = await loadDebtPerson(ctx, id)
  if (!data) redirect('/dashboard/hutang')
  const { person, entries, payments } = data
  const s = debtSummary(entries, payments)
  const out = debtSentence(s.net, person.name, ctx.nama)
  const mine = entries.filter((e) => e.paid_by === 'me')
  const theirs = entries.filter((e) => e.paid_by === 'them')

  const table = (title: string, rows: DebtEntry[], total: number) => (
    <section className="rpt-sec">
      <h2>{title}</h2>
      <table className="report-table">
        <thead><tr><th>Tanggal</th><th>Kegiatan</th><th className="r">Harga</th><th>Bagian</th><th>Keterangan</th><th className="r">Total bayar</th></tr></thead>
        <tbody>
          {rows.length ? rows.map((e) => (
            <tr key={e.id}><td className="nowrap">{tgl(e.entry_on)}</td><td>{e.title}</td><td className="r">{rp(e.amount)}</td><td>{shareLabel(e.amount, e.share)}</td><td>{e.note || '—'}</td><td className="r">{rp(e.share)}</td></tr>
          )) : <tr><td colSpan={6}>Tidak ada.</td></tr>}
        </tbody>
        <tfoot><tr className="total"><td colSpan={5}>Total</td><td className="r">{rp(total)}</td></tr></tfoot>
      </table>
    </section>
  )

  return (
    <>
      <PageHead ctx={ctx} title={`Laporan hutang ${person.name}`} month={false} actions={<PrintButton />} />
      <article className="report">
        <header className="rpt-head">
          <div>
            <p className="rpt-brand">Arus · Money Manager</p>
            <h1>Rincian Hutang Split Bill</h1>
            <p className="rpt-period">{ctx.nama} dan {person.name}</p>
          </div>
          <dl className="rpt-meta">
            <div><dt>Dicetak</dt><dd>{tgl(ctx.today.iso)}</dd></div>
          </dl>
        </header>

        <section className="rpt-kpis" aria-label="Ringkasan">
          <div className="rpt-kpi"><span>Dibayar {ctx.nama}</span><b>{rp(s.owedToMe)}</b></div>
          <div className="rpt-kpi"><span>Dibayar {person.name}</span><b>{rp(s.owedByMe)}</b></div>
          <div className="rpt-kpi"><span>Sudah dilunasi</span><b>{rp(s.paidToMe - s.paidByMe)}</b></div>
          <div className={`rpt-kpi ${out.tone === 'neg' ? 'neg' : 'pos'}`}><span>{out.amount ? out.who : 'Status'}</span><b>{out.amount ? rp(out.amount) : 'Lunas'}</b></div>
        </section>

        {table(`Dibayar ${ctx.nama}`, mine, s.owedToMe)}
        {table(`Dibayar ${person.name}`, theirs, s.owedByMe)}

        <section className="rpt-sec">
          <h2>Perhitungan</h2>
          <table className="report-table">
            <tbody>
              <tr><td>Total dibayar {ctx.nama} (ditagih ke {person.name})</td><td className="r">{rp(s.owedToMe)}</td></tr>
              <tr><td>Total dibayar {person.name} (ditagih ke {ctx.nama})</td><td className="r">− {rp(s.owedByMe)}</td></tr>
              <tr className="total"><td>Selisih</td><td className="r">{s.gross < 0 ? '− ' : ''}{rp(Math.abs(s.gross))}</td></tr>
              {payments.map((p) => (
                <tr key={p.id}><td>Pelunasan {tgl(p.paid_on)}: {p.direction === 'them_to_me' ? `${person.name} bayar ke ${ctx.nama}` : `${ctx.nama} bayar ke ${person.name}`}{p.note ? ` (${p.note})` : ''}</td><td className="r">{p.direction === 'them_to_me' ? '− ' : '+ '}{rp(p.amount)}</td></tr>
              ))}
              <tr className="total"><td>{out.amount ? out.who : 'Status'}</td><td className="r">{out.amount ? rp(out.amount) : 'Lunas'}</td></tr>
            </tbody>
          </table>
        </section>
      </article>
    </>
  )
}
