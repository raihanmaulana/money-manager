import { TileTitle } from '@/components/TileTitle'
import { isCreditKind } from '@/lib/types'
import Link from 'next/link'
import { Banknote, Calculator, Home, PiggyBank, Plus, Sparkle, TrendingUp } from 'lucide-react'
import { getCtx, loadMonth, loadPockets } from '@/lib/data'
import { billRowsFor, incomeCounts, rp, summarize, ymLabel } from '@/lib/calc'
import { addBudget, addIncome, setRowPocket, deleteBudget, deleteIncome, resetMonth, updateBudget, updateIncome } from '@/lib/actions'
import { PageHead } from '@/components/PageHead'
import { EmptyMonth } from '@/components/EmptyMonth'
import { ConfirmButton } from '@/components/ConfirmButton'
import { BudgetRows } from '@/components/BudgetRows'
import { PocketInline } from '@/components/PocketInline'
import { PocketSelect } from '@/components/PocketSelect'
import { ActionButton, InlineField, MoneyInput, QuickForm, Submit } from '@/components/Fields'
import type { Grp } from '@/lib/types'

export const metadata = { title: 'Anggaran' }

const GROUPS: { grp: Grp; title: string; note: string; ph: string }[] = [
  { grp: 'kebutuhan', title: 'Kebutuhan pokok', note: 'Makan, transport, kos atau kontribusi rumah', ph: 'mis. Makan' },
  { grp: 'gaya_hidup', title: 'Gaya hidup', note: 'Jajan, hiburan, belanja, sosial', ph: 'mis. Jajan' },
  { grp: 'tabungan', title: 'Tabungan', note: 'Dana darurat dan tujuan tertentu', ph: 'mis. Dana darurat' },
  { grp: 'investasi', title: 'Investasi', note: 'Reksa dana, SBN, emas', ph: 'mis. Reksa dana' },
]

const GROUP_ICONS = { kebutuhan: Home, gaya_hidup: Sparkle, tabungan: PiggyBank, investasi: TrendingUp } as const

export default async function Anggaran() {
  const ctx = await getCtx()
  const [data, { pockets }] = await Promise.all([loadMonth(ctx), loadPockets(ctx)])
  const pk = (id?: string | null) => pockets.find((p) => p.id === id)?.name
  const rows = billRowsFor(data.bills, data.billMonths, ctx.ym)
  const s = summarize(data.income, data.budget, data.expenses, rows, ctx.today, ctx.ym)
  if (!data.income.length && !data.budget.length) {
    return (<><PageHead ctx={ctx} title="Anggaran" sub="Atur pemasukan dan jatah tiap kategori" /><div className="bento"><EmptyMonth ctx={ctx} /></div></>)
  }
  const pctOf = (n: number) => (s.bersih > 0 ? `${Math.round((n / s.bersih) * 100)}%` : '–')

  return (
    <>
      <PageHead ctx={ctx} title="Anggaran" sub={`Khusus ${ymLabel(ctx.ym)}. Mengubah angka di sini tidak mengubah bulan lain.`}
        actions={<ConfirmButton action={resetMonth} args={[ctx.ym]} trigger="Reset bulan" confirmText="Ya, reset semua" className="btn small ghost danger-ghost"
          title={`Reset ${ymLabel(ctx.ym)}?`}
          message={`Semua data ${ymLabel(ctx.ym)} dihapus sampai kosong: pemasukan, anggaran, catatan pengeluaran, setoran tabungan, status tagihan, dan pindah dana. Tagihan yang dibuat di bulan sebelumnya tetap ada. Tidak bisa dibatalkan.`} />} />
      <div className="bento">
        <section className="tile s7" style={{ ['--i' as string]: 0 }} aria-labelledby="h-masuk">
          <div className="tile-head"><TileTitle id="h-masuk" icon={Banknote}>Pemasukan</TileTitle><span className="tile-note">bersih {rp(s.bersih)}</span></div>
          <ul className="rows">
            {data.income.map((i) => (
              <li key={i.id} className="inc-row">
                <span className="inc-name"><InlineField id={i.id} field="label" value={i.label} action={updateIncome} label="Nama pemasukan" /></span>
                <span className="inc-del"><ActionButton action={deleteIncome} args={[i.id]} label={`Hapus ${i.label}`} /></span>
                <span className="inc-sub">
                <span className="inc-day"><InlineField id={i.id} field="pay_day" value={i.pay_day ?? ''} action={updateIncome} label={`Tanggal masuk ${i.label} (kosong = awal bulan)`} placeholder="Tgl" extra="center boxed" /></span>
                <span className="inc-amt"><InlineField id={i.id} field="amount" value={i.amount} money action={updateIncome} label={`Nominal ${i.label}`} /></span>
                </span>
                <span className="inc-meta"><span className="meta">{i.kind === 'masuk' ? 'Uang masuk' : 'Potongan'}{i.pay_day ? ` · tgl ${i.pay_day}` : ''}{i.pocket_id && i.pay_day && !incomeCounts(i, ctx.today) ? ' · belum masuk' : ''}</span>
                  {pockets.length ? <PocketInline table="income_items" id={i.id} value={i.pocket_id} pockets={pockets.filter((p) => !isCreditKind(p.kind))} action={setRowPocket} /> : null}</span>
              </li>
            ))}
          </ul>
          {(
            <QuickForm action={addIncome} className="form-grid three" >
              <input type="hidden" name="ym" value={ctx.ym} />
              <label className="field"><span>Tambah</span><input className="input" name="label" placeholder="mis. Bonus" maxLength={80} required /></label>
              <label className="field"><span>Jenis</span><select className="select" name="kind"><option value="masuk">Uang masuk</option><option value="potong">Potongan</option></select></label>
              <label className="field"><span>Nominal</span><MoneyInput name="amount" label="Nominal" /></label>
              <label className="field"><span>Tanggal (opsional)</span><input className="input" type="number" name="pay_day" min={1} max={31} placeholder="mis. 25" inputMode="numeric" /></label>
              <PocketSelect pockets={pockets.filter((p) => !isCreditKind(p.kind))} label="Masuk ke / dipotong dari" full />
              <p className="hint full" style={{ margin: 0 }}>Dengan tanggal, saldo sumber dana baru bertambah setelah tanggal itu tiba. Anggaran bulan ini tetap menghitung penuh.</p>
              <div className="full"><Submit className="btn small ghost"><Plus aria-hidden /> Tambah</Submit></div>
            </QuickForm>
          )}
        </section>

        <section className="tile blush s5" style={{ ['--i' as string]: 1 }} aria-labelledby="h-hasil">
          <div className="tile-head"><TileTitle id="h-hasil" icon={Calculator}>Hasil akhir bulan ini</TileTitle></div>
          <ul className="rows">
            <li><span className="grow name">Pemasukan bersih</span><span className="amt">{rp(s.bersih)}</span></li>
            <li><span className="grow"><span className="name">Tagihan, cicilan, hutang</span><span className="meta">Otomatis dari <Link className="link" href="/dashboard/tagihan">halaman Tagihan</Link> · {pctOf(s.tagihan)}</span></span><span className="amt minus">−{rp(s.tagihan)}</span></li>
            <li><span className="grow name">Tabungan · {pctOf(s.grp.tabungan)}</span><span className="amt minus">−{rp(s.grp.tabungan)}</span></li>
            <li><span className="grow name">Investasi · {pctOf(s.grp.investasi)}</span><span className="amt minus">−{rp(s.grp.investasi)}</span></li>
            <li className="total-row"><span className="grow">Uang belanja</span><span className="amt">{rp(s.uangBelanja)}</span></li>
            <li><span className="grow name">Rencana kebutuhan + gaya hidup</span><span className="amt">{rp(s.rencanaBelanja)}</span></li>
          </ul>
          {s.selisihRencana < 0
            ? <p className="form-msg err" style={{ marginTop: 'var(--space-4)' }}>Rencana belanja melebihi uang yang tersedia sebesar {rp(-s.selisihRencana)}. Kurangi kategori belanja, tabungan, atau investasi.</p>
            : <p className="form-msg info" style={{ marginTop: 'var(--space-4)' }}>{s.selisihRencana === 0 ? 'Pas! Semua uang sudah punya tempat.' : `${rp(s.selisihRencana)} belum dialokasikan. Bisa ditambah ke tabungan atau jadi bantalan.`}</p>}
        </section>

        {GROUPS.map((g, idx) => {
          const items = data.budget.filter((b) => b.grp === g.grp)
          return (
            <section key={g.grp} className="tile s6" style={{ ['--i' as string]: idx + 2 }} aria-labelledby={`h-${g.grp}`}>
              <div className="tile-head"><div><TileTitle id={`h-${g.grp}`} icon={GROUP_ICONS[g.grp]}>{g.title}</TileTitle><p className="tile-note">{g.note}</p></div>
                <span className="chip">{rp(s.grp[g.grp])} · {pctOf(s.grp[g.grp])}</span></div>
              <BudgetRows items={items} />
              {(
                <QuickForm action={addBudget} className="cluster" >
                  <input type="hidden" name="ym" value={ctx.ym} /><input type="hidden" name="grp" value={g.grp} />
                  <input className="input" style={{ flex: '1 1 9rem' }} name="label" placeholder={g.ph} maxLength={80} required aria-label="Nama kategori baru" />
                  <div style={{ flex: '1 1 8rem' }}><MoneyInput name="amount" label="Jatah kategori baru" /></div>
                  <Submit className="btn small ghost"><Plus aria-hidden /> Tambah</Submit>
                </QuickForm>
              )}
            </section>
          )
        })}
      </div>
    </>
  )
}
