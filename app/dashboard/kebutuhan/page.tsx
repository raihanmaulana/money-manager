import { TileTitle } from '@/components/TileTitle'
import { AlarmClock, CheckCircle2, ListTodo, Plus, Wallet } from 'lucide-react'
import { getCtx, loadMonth, loadNeeds, loadPockets } from '@/lib/data'
import { daysInMonth, rp, ymLabel } from '@/lib/calc'
import { addNeed, deleteNeed, unbuyNeed } from '@/lib/actions'
import { ConfirmButton } from '@/components/ConfirmButton'
import { PageHead } from '@/components/PageHead'
import { QuickForm, Submit, ActionButton } from '@/components/Fields'
import { NeedBuy, NeedEdit, NeedFields } from '@/components/NeedForms'
import { Fold } from '@/components/ShowMore'
import type { NeedItem } from '@/lib/types'

export const metadata = { title: 'List Kebutuhan' }

const qty = (n: number) => String(n).replace('.', ',')

export default async function Kebutuhan() {
  const ctx = await getCtx()
  const [data, { pockets }, { items, purchases }] = await Promise.all([loadMonth(ctx), loadPockets(ctx), loadNeeds(ctx)])
  const labels = [...new Set(data.budget.filter((b) => b.grp === 'kebutuhan' || b.grp === 'gaya_hidup').map((b) => b.label))]
  const categories = [...new Set(items.map((i) => i.category))]
  const bought = new Map(purchases.map((p) => [p.item_id, p]))
  const nowMonth = ctx.ym === ctx.today.ym
  const defDate = nowMonth ? ctx.today.iso : `${ctx.ym}-01`
  const lastDay = `${ctx.ym}-${String(daysInMonth(ctx.ym)).padStart(2, '0')}`

  const estOf = (i: NeedItem) => Math.round(i.est_price * i.qty)
  const estAll = items.reduce((t, i) => t + estOf(i), 0)
  const spent = purchases.reduce((t, p) => t + p.total, 0)
  const estBought = purchases.reduce((t, p) => t + p.est_total, 0)
  const diff = spent - estBought
  const todo = items.filter((i) => !bought.has(i.id))
  const due = (i: NeedItem) => (nowMonth && i.remind_day ? i.remind_day - ctx.today.day : null) // <=0 : sudah waktunya
  const reminders = todo.filter((i) => { const d = due(i); return d !== null && d <= 0 })

  const groups = new Map<string, NeedItem[]>()
  for (const i of items) groups.set(i.category, [...(groups.get(i.category) ?? []), i])

  return (
    <>
      <PageHead ctx={ctx} title="List Kebutuhan" sub={`Barang wajib beli · ${ymLabel(ctx.ym)} · ${purchases.length} dari ${items.length} sudah dibeli`} />
      <div className="bento">
        {reminders.length ? (
          <section className="tile s12 alerts need-alert" style={{ ['--i' as string]: 0 }} aria-labelledby="h-ingat">
            <div className="tile-head"><TileTitle id="h-ingat" icon={AlarmClock}>Waktunya beli</TileTitle><span className="tile-note">{reminders.length} barang</span></div>
            <ul className="alert-list">
              {reminders.map((i) => {
                const d = due(i) as number
                return <li key={i.id} className={`alert ${d < 0 ? 'over' : 'warn'}`}><span className="alert-dot" aria-hidden /><span className="grow">{i.name} <span className="meta">({i.category}) · {d === 0 ? 'ingatkan hari ini' : `terlewat ${-d} hari dari tgl ${i.remind_day}`}</span></span></li>
              })}
            </ul>
          </section>
        ) : null}

        <section className="tile s12 need-sum" style={{ ['--i' as string]: 1 }} aria-label="Ringkasan belanja kebutuhan">
          <div className="need-stats">
            <div><span className="kicker">Perkiraan bulan ini</span><b>{rp(estAll)}</b></div>
            <div><span className="kicker">Sudah dibeli</span><b>{rp(spent)}</b></div>
            <div><span className="kicker">Selisih vs perkiraan</span><b className={diff > 0 ? 'neg' : diff < 0 ? 'pos' : ''}>{purchases.length ? `${diff > 0 ? '+' : diff < 0 ? '−' : ''}${rp(Math.abs(diff))}` : '—'}</b><small>{purchases.length ? (diff > 0 ? 'lebih mahal dari perkiraan' : diff < 0 ? 'lebih hemat dari perkiraan' : 'sesuai perkiraan') : 'belum ada pembelian'}</small></div>
            <div><span className="kicker">Belum dibeli</span><b>{todo.length} barang</b><small>≈ {rp(todo.reduce((t, i) => t + estOf(i), 0))}</small></div>
          </div>
        </section>

        <div className="stack s7-col">
          {groups.size ? [...groups.entries()].map(([cat, list], n) => {
            const done = list.filter((i) => bought.has(i.id)).length
            return (
              <section key={cat} className="tile need-group" style={{ ['--i' as string]: 2 + n }} aria-labelledby={`h-c${n}`}>
                <div className="tile-head"><TileTitle id={`h-c${n}`} icon={ListTodo}>{cat}</TileTitle><span className="tile-note">{done}/{list.length} dibeli</span></div>
                <div className={`meter ${done === list.length ? '' : ''}`} style={{ marginBottom: 'var(--space-3)' }} role="img" aria-label={`${done} dari ${list.length} barang ${cat} sudah dibeli`}><i style={{ width: `${(done / list.length) * 100}%` }} /></div>
                <ul className="rows">
                  {list.map((i) => {
                    const p = bought.get(i.id)
                    const d = due(i)
                    return (
                      <li key={i.id} className={`row wrap need-row ${p ? 'is-done' : ''}`}>
                        <span className="grow" style={{ minWidth: '9rem' }}>
                          <span className="name">{p ? <CheckCircle2 aria-hidden size={16} className="done-ic" /> : null}{i.name}</span>
                          <span className="meta">
                            {qty(i.qty)} × {rp(i.est_price)} = {rp(estOf(i))}
                            {i.remind_day ? ` · ingatkan tgl ${i.remind_day}` : ''}
                          </span>
                          {p ? (
                            <span className={`chip need-chip ${p.total > p.est_total ? 'warn' : 'ok'}`}>
                              Dibeli {rp(p.total)} · {p.total === p.est_total ? 'sesuai perkiraan' : p.total > p.est_total ? `lebih ${rp(p.total - p.est_total)}` : `hemat ${rp(p.est_total - p.total)}`}
                            </span>
                          ) : d !== null && d <= 0 ? <span className="chip need-chip over">{d === 0 ? 'Hari ini' : `Terlewat ${-d} hari`}</span> : null}
                        </span>
                        {p ? (
                          <ConfirmButton action={unbuyNeed} args={[p.id]} trigger="Batalkan" confirmText="Ya, batalkan" title={`Batalkan pembelian ${i.name}?`} message="Catatan pengeluaran yang terhubung ikut dihapus dan barang kembali jadi belum dibeli." />
                        ) : (
                          <NeedBuy item={i} ym={ctx.ym} date={defDate} min={`${ctx.ym}-01`} max={lastDay} labels={labels} pockets={pockets} />
                        )}
                        <NeedEdit item={i} categories={categories} labels={labels} pockets={pockets} />
                        <ConfirmButton action={deleteNeed} args={[i.id]} trigger="Hapus" title={`Hapus "${i.name}" dari list?`} confirmText="Ya, hapus" message="Barang tidak muncul lagi di bulan-bulan berikutnya. Catatan pengeluaran yang sudah terbuat tetap ada." />
                      </li>
                    )
                  })}
                </ul>
              </section>
            )
          }) : (
            <section className="tile" style={{ ['--i' as string]: 2 }}>
              <p className="hint">Belum ada barang. Tambahkan kebutuhan bulanan di samping, misalnya kategori <b>Kucing</b> dengan barang <b>Makanan kucing</b>. Daftar ini otomatis muncul lagi tiap bulan dengan status belum dibeli.</p>
            </section>
          )}
        </div>

        <div className="stack col5 first-m">
          <section className="tile" style={{ ['--i' as string]: 2 }} aria-labelledby="h-tambah">
            <div className="tile-head"><TileTitle id="h-tambah" icon={Plus}>Tambah barang</TileTitle></div>
            <Fold summary={<><Plus aria-hidden size={16} /> Tambah barang baru</>} defaultOpen={!items.length}>
            <QuickForm action={addNeed} className="stack">
              <div className="form-grid"><NeedFields categories={categories} labels={labels} pockets={pockets} /></div>
              <Submit className="btn full"><Plus aria-hidden /> Simpan barang</Submit>
            </QuickForm>
            </Fold>
            <p className="hint" style={{ marginTop: 'var(--space-3)' }}><Wallet aria-hidden size={14} /> Saat dibeli, harga asli otomatis jadi catatan pengeluaran.</p>
          </section>
        </div>
      </div>
    </>
  )
}
