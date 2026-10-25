import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, FileText, FileSpreadsheet, HandCoins, Plus, Scale, Wallet } from 'lucide-react'
import { getCtx, loadDebtPerson } from '@/lib/data'
import { rp } from '@/lib/calc'
import { debtSentence, debtSummary, shareLabel } from '@/lib/debt'
import { addDebtEntry, addDebtPayment, deleteDebtEntry, deleteDebtPayment, deleteDebtPerson } from '@/lib/debt-actions'
import type { DebtEntry } from '@/lib/types'
import { PageHead } from '@/components/PageHead'
import { TileTitle } from '@/components/TileTitle'
import { ActionButton, MoneyInput, QuickForm, Submit } from '@/components/Fields'
import { DatePicker } from '@/components/DatePicker'
import { ConfirmButton } from '@/components/ConfirmButton'
import { DebtEntryFields } from '@/components/DebtEntryFields'
import { DebtEntryEditor } from '@/components/DebtEntryEditor'
import { DebtImport } from '@/components/DebtImport'

export const metadata = { title: 'Hutang Split Bill' }
const tgl = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export default async function Orang({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCtx()
  const data = await loadDebtPerson(ctx, id)
  if (!data) redirect('/dashboard/hutang')
  const { person, entries, payments } = data
  const s = debtSummary(entries, payments)
  const out = debtSentence(s.net, person.name)
  const mine = entries.filter((e) => e.paid_by === 'me')
  const theirs = entries.filter((e) => e.paid_by === 'them')
  let i = 0

  const list = (rows: DebtEntry[], empty: string) => rows.length ? (
    <ul className="rows">
      {rows.map((e) => (
        <li key={e.id}>
          <span className="grow">
            <span className="name">{e.title}{e.fromSplit ? <span className="chip" style={{ marginLeft: 'var(--space-2)' }}>Dari Catatan</span> : null}</span>
            <span className="meta">{tgl(e.entry_on)} · harga {rp(e.amount)} · {shareLabel(e.amount, e.share)}{e.note ? ` · ${e.note}` : ''}</span>
          </span>
          <span className="amt">{rp(e.share)}</span>
          {!e.fromSplit ? <DebtEntryEditor entry={e} personName={person.name} today={ctx.today.iso} /> : null}
          {!e.fromSplit ? <ActionButton action={deleteDebtEntry} args={[e.id]} label={`Hapus ${e.title}`} /> : null}
        </li>
      ))}
    </ul>
  ) : <p className="hint">{empty}</p>

  return (
    <>
      <PageHead ctx={ctx} title={`Hutang dengan ${person.name}`} month={false} actions={
        <>
          <Link className="btn small ghost" href="/dashboard/hutang"><ArrowLeft aria-hidden size={16} /> Semua orang</Link>
          <Link className="btn small" href={`/dashboard/hutang/${person.id}/laporan`}><FileText aria-hidden size={16} /> Laporan PDF</Link>
        </>
      } />
      <div className="bento">
        <section className="tile col blush s5" style={{ ['--i' as string]: i++ }} aria-labelledby="h-hasil">
          <p className="kicker" id="h-hasil">Hasil akhir</p>
          <p className="sub" style={{ fontWeight: 600 }}>{out.who}</p>
          <p className={`big ${out.tone === 'neg' ? 'minus' : ''}`} style={{ fontSize: 'clamp(1.9rem, 3.4vw, 3rem)', whiteSpace: 'nowrap' }}>{out.amount ? rp(out.amount) : 'Lunas'}</p>
          <ul className="rows" style={{ marginTop: 'var(--space-3)' }}>
            <li><span className="grow">Dibayar saya, ditagih ke {person.name}</span><span className="amt">{rp(s.owedToMe)}</span></li>
            <li><span className="grow">Dibayar {person.name}, ditagih ke saya</span><span className="amt">{rp(s.owedByMe)}</span></li>
            <li><span className="grow"><b>Selisih</b></span><span className="amt"><b>{s.gross < 0 ? '−' : ''}{rp(Math.abs(s.gross))}</b></span></li>
            {s.paidToMe || s.paidByMe ? <li><span className="grow">Sudah dilunasi</span><span className="amt">{rp(s.paidToMe - s.paidByMe)}</span></li> : null}
          </ul>
        </section>

        <section className="tile s7" style={{ ['--i' as string]: i++ }} aria-labelledby="h-tambah">
          <div className="tile-head"><TileTitle id="h-tambah" icon={Plus}>Tambah baris</TileTitle></div>
          <QuickForm action={addDebtEntry} className="stack">
            <input type="hidden" name="person_id" value={person.id} />
            <DebtEntryFields personName={person.name} today={ctx.today.iso} />
            <Submit className="btn"><Plus aria-hidden /> Simpan baris</Submit>
          </QuickForm>
        </section>

        <section className="tile s6" style={{ ['--i' as string]: i++ }} aria-labelledby="h-saya">
          <div className="tile-head"><TileTitle id="h-saya" icon={HandCoins}>Dibayar saya</TileTitle><span className="tile-note">{rp(s.owedToMe)}</span></div>
          <p className="hint" style={{ marginBottom: 'var(--space-2)' }}>Angka di kanan = bagian yang ditagih ke {person.name}.</p>
          {list(mine, 'Belum ada.')}
        </section>
        <section className="tile s6" style={{ ['--i' as string]: i++ }} aria-labelledby="h-dia">
          <div className="tile-head"><TileTitle id="h-dia" icon={HandCoins}>Dibayar {person.name}</TileTitle><span className="tile-note">{rp(s.owedByMe)}</span></div>
          <p className="hint" style={{ marginBottom: 'var(--space-2)' }}>Angka di kanan = bagian yang ditagih ke saya.</p>
          {list(theirs, 'Belum ada.')}
        </section>

        <section className="tile s6" style={{ ['--i' as string]: i++ }} aria-labelledby="h-lunas">
          <div className="tile-head"><TileTitle id="h-lunas" icon={Wallet}>Pelunasan</TileTitle></div>
          <QuickForm action={addDebtPayment} className="stack">
            <input type="hidden" name="person_id" value={person.id} />
            <div className="form-grid">
              <label className="field"><span>Siapa bayar</span>
                <select className="select" name="direction" defaultValue={s.net < 0 ? 'me_to_them' : 'them_to_me'}>
                  <option value="them_to_me">{person.name} bayar ke saya</option><option value="me_to_them">Saya bayar ke {person.name}</option>
                </select>
              </label>
              <label className="field"><span>Jumlah</span><MoneyInput name="amount" label="Jumlah pelunasan" required defaultValue={out.amount} /></label>
              <label className="field"><span>Tanggal</span><DatePicker name="paid_on" label="Tanggal" defaultValue={ctx.today.iso} /></label>
              <label className="field"><span>Catatan</span><input className="input" name="note" maxLength={120} placeholder="mis. transfer BCA" /></label>
            </div>
            <Submit className="btn ghost"><Scale aria-hidden /> Catat pelunasan</Submit>
          </QuickForm>
          {payments.length ? (
            <ul className="rows" style={{ marginTop: 'var(--space-3)' }}>
              {payments.map((p) => (
                <li key={p.id}>
                  <span className="grow"><span className="name">{p.direction === 'them_to_me' ? `${person.name} bayar ke saya` : `Saya bayar ke ${person.name}`}</span><span className="meta">{tgl(p.paid_on)}{p.note ? ` · ${p.note}` : ''}</span></span>
                  <span className="amt">{rp(p.amount)}</span>
                  <ActionButton action={deleteDebtPayment} args={[p.id]} label={`Hapus pelunasan ${rp(p.amount)}`} />
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="tile s6" style={{ ['--i' as string]: i++ }} aria-labelledby="h-xl">
          <div className="tile-head"><TileTitle id="h-xl" icon={FileSpreadsheet}>Impor dari Excel</TileTitle></div>
          <DebtImport personId={person.id} personName={person.name} />
        </section>

        <section className="tile s12 plain" style={{ ['--i' as string]: i++ }}>
          <ConfirmButton action={deleteDebtPerson} args={[person.id]} trigger={`Hapus ${person.name} dan semua barisnya`} title={`Hapus ${person.name}?`}
            message="Semua baris dan pelunasan orang ini ikut terhapus. Split bill di Catatan tidak terhapus." />
        </section>
      </div>
    </>
  )
}
