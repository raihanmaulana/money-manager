import { getCtx, loadMonth, loadPockets, loadSplits } from '@/lib/data'
import { isCreditKind } from '@/lib/types'
import { billRowsFor, rp, summarize, ymLabel } from '@/lib/calc'
import { PageHead } from '@/components/PageHead'
import { PrintButton } from '@/components/PrintButton'

export const metadata = { title: 'Laporan bulanan' }

const KIND = { tagihan: 'Tagihan rutin', cicilan: 'Cicilan', hutang: 'Hutang', kartu: 'Kartu kredit' } as const
const tgl = (iso: string) => `${Number(iso.slice(8))}/${iso.slice(5, 7)}`

export default async function Laporan() {
  const ctx = await getCtx()
  const [data, { pockets }, splits] = await Promise.all([loadMonth(ctx), loadPockets(ctx), loadSplits(ctx)])
  const rows = billRowsFor(data.bills, data.billMonths, ctx.ym)
  const s = summarize(data.income, data.budget, data.expenses, rows, ctx.today, ctx.ym)
  const cats = data.budget.filter((b) => b.grp === 'kebutuhan' || b.grp === 'gaya_hidup')
  const noCat = data.expenses.filter((e) => !e.budget_item_id).reduce((t, e) => t + e.amount, 0)
  const exps = [...data.expenses].sort((a, b) => a.spent_on.localeCompare(b.spent_on))

  return (
    <>
      <PageHead ctx={ctx} title={`Laporan ${ymLabel(ctx.ym)}`} sub={`Data ${ctx.nama}`} actions={<PrintButton />} />
      <article className="report">
        <header className="rpt-head">
          <div>
            <p className="rpt-brand">Arus · Money Manager</p>
            <h1>Laporan Keuangan</h1>
            <p className="rpt-period">{ymLabel(ctx.ym)}</p>
          </div>
          <dl className="rpt-meta">
            <div><dt>Disusun untuk</dt><dd>{ctx.nama}</dd></div>
            <div><dt>Dicetak</dt><dd>{new Date(ctx.today.iso + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</dd></div>
          </dl>
        </header>

        <section className="rpt-kpis" aria-label="Ringkasan utama">
          <div className="rpt-kpi"><span>Pemasukan bersih</span><b>{rp(s.bersih)}</b></div>
          <div className="rpt-kpi"><span>Uang belanja</span><b>{rp(s.uangBelanja)}</b></div>
          <div className="rpt-kpi"><span>Pengeluaran tercatat</span><b>{rp(s.spent)}</b></div>
          <div className={`rpt-kpi ${s.sisaJatah < 0 ? 'neg' : 'pos'}`}><span>Sisa jatah</span><b>{rp(s.sisaJatah)}</b></div>
        </section>

        <section className="rpt-sec">
          <h2>Ringkasan alokasi</h2>
          <table className="report-table">
            <tbody>
              <tr><td>Pemasukan bersih</td><td>{rp(s.bersih)}</td></tr>
              <tr><td>Tagihan, cicilan, dan hutang</td><td>− {rp(s.tagihan)}</td></tr>
              <tr><td>Tabungan</td><td>− {rp(s.grp.tabungan)}</td></tr>
              <tr><td>Investasi</td><td>− {rp(s.grp.investasi)}</td></tr>
              <tr className="total"><td>Uang belanja</td><td>{rp(s.uangBelanja)}</td></tr>
              <tr><td>Pengeluaran tercatat</td><td>− {rp(s.spent)}</td></tr>
              <tr className="total"><td>Sisa jatah</td><td>{rp(s.sisaJatah)}</td></tr>
            </tbody>
          </table>
        </section>

        <section className="rpt-sec">
          <h2>Pengeluaran per kategori</h2>
          <table className="report-table">
            <thead><tr><th>Kategori</th><th className="r">Dipakai</th><th className="r">Anggaran</th><th className="bar-col"><span className="sr-only">Pemakaian</span></th></tr></thead>
            <tbody>
              {cats.map((c) => {
                const used = s.spentByItem[c.id] ?? 0
                const pct = c.amount > 0 ? Math.min(100, (used / c.amount) * 100) : used ? 100 : 0
                return (
                  <tr key={c.id}>
                    <td>{c.label}</td><td className="r">{rp(used)}</td><td className="r">{rp(c.amount)}</td>
                    <td className="bar-col"><span className={`rpt-bar ${used > c.amount ? 'over' : ''}`}><i style={{ width: `${pct}%` }} /></span></td>
                  </tr>
                )
              })}
              {noCat > 0 ? <tr><td>Tanpa kategori</td><td className="r">{rp(noCat)}</td><td className="r">—</td><td className="bar-col" /></tr> : null}
            </tbody>
          </table>
        </section>

        <section className="rpt-sec">
          <h2>Tagihan</h2>
          {rows.length ? (
            <table className="report-table">
              <thead><tr><th>Nama</th><th>Jenis</th><th className="r">Tgl</th><th className="r">Nominal</th><th className="r">Dibayar</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const st = r.skipped ? 'Dilewati' : r.paid ? 'Lunas' : r.paidAmount > 0 ? 'Dicicil' : 'Belum'
                  return (
                    <tr key={r.bill.id}><td>{r.bill.name}</td><td>{KIND[r.bill.kind]}</td><td className="r">{r.dueDay}</td><td className="r">{rp(r.amount)}</td><td className="r">{rp(r.paidAmount)}</td><td><span className={`rpt-chip ${st === 'Lunas' ? 'ok' : st === 'Belum' ? 'warn' : ''}`}>{st}</span></td></tr>
                  )
                })}
              </tbody>
            </table>
          ) : <p className="hint">Tidak ada tagihan bulan ini.</p>}
        </section>

        <section className="rpt-sec">
          <h2>Catatan pengeluaran</h2>
          {exps.length ? (
            <table className="report-table">
              <thead><tr><th>Tgl</th><th>Catatan</th><th>Kategori</th><th>Sumber</th><th className="r">Jumlah</th></tr></thead>
              <tbody>
                {exps.map((e) => (
                  <tr key={e.id}><td className="nowrap">{tgl(e.spent_on)}</td><td>{e.note || '—'}{splits.some((x) => x.expense_id === e.id) ? <span className="rpt-chip split">Split bill</span> : null}</td><td>{data.budget.find((b) => b.id === e.budget_item_id)?.label ?? '—'}</td><td>{pockets.find((p) => p.id === e.pocket_id)?.name ?? '—'}</td><td className="r">{rp(e.amount)}</td></tr>
                ))}
              </tbody>
              <tfoot><tr className="total"><td colSpan={4}>Total</td><td className="r">{rp(s.spent)}</td></tr></tfoot>
            </table>
          ) : <p className="hint">Belum ada catatan.</p>}
        </section>

        {splits.length ? (
          <section className="rpt-sec">
            <h2>Split bill · hutang teman</h2>
            <table className="report-table">
              <thead><tr><th>Nama</th><th>Untuk</th><th className="r">Tgl</th><th className="r">Nominal</th></tr></thead>
              <tbody>
                {splits.map((x) => (
                  <tr key={x.id}><td>{x.name}</td><td>{data.expenses.find((e) => e.id === x.expense_id)?.note || x.note || '—'}</td><td className="r">{tgl(x.split_on)}</td><td className="r">{rp(x.amount)}</td></tr>
                ))}
              </tbody>
              <tfoot><tr className="total"><td colSpan={3}>Total</td><td className="r">{rp(splits.reduce((t, x) => t + x.amount, 0))}</td></tr></tfoot>
            </table>
          </section>
        ) : null}

        {pockets.some((p) => !isCreditKind(p.kind)) ? (
          <section className="rpt-sec">
            <h2>Saldo sumber dana <small>per hari ini</small></h2>
            <table className="report-table">
              <tbody>{pockets.filter((p) => !isCreditKind(p.kind)).map((p) => <tr key={p.id}><td>{p.name}</td><td className="r">{rp(p.saldo)}</td></tr>)}</tbody>
              <tfoot><tr className="total"><td>Total</td><td className="r">{rp(pockets.filter((p) => !isCreditKind(p.kind)).reduce((t, p) => t + p.saldo, 0))}</td></tr></tfoot>
            </table>
          </section>
        ) : null}

        <footer className="rpt-foot">Dibuat dengan Arus · Money Manager</footer>
      </article>
    </>
  )
}
