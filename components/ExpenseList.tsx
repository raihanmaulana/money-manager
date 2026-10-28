'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Filter, FilterX, Search, Users, CreditCard, ListChecks, Sparkles } from 'lucide-react'
import { ThemedSelect } from './ThemedSelect'
import { ActionButton } from './Fields'
import { ExpenseEditor } from './ExpenseEditor'
import { RangeSlider } from './RangeSlider'
import { deleteExpense, setExpensesPocket } from '@/lib/actions'
import { useBusyTransition } from './Busy'
import { useToast } from './Toast'
import { rp } from '@/lib/calc'
import type { Cashback, Expense, Pocket, Split } from '@/lib/types'

const tgl = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const NONE = '__none'

/** Daftar catatan dengan filter tanggal, kategori, sumber dana, dan rentang nominal. */
export function ExpenseList({ expenses, cats, pockets, days, splits = [], cashbacks = [] }: {
  splits?: Split[]; cashbacks?: Cashback[]; expenses: Expense[]; cats: { id: string; label: string }[]; pockets: Pocket[]; days: number
}) {
  const [dayR, setDayR] = useState<[number, number] | null>(null)
  const [amtR, setAmtR] = useState<[number, number] | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [pocket, setPocket] = useState('')
  const [open, setOpen] = useState(false)
  const [dayLimit, setDayLimit] = useState(4)
  const [pick, setPick] = useState(false)
  const [sel, setSel] = useState<Set<string>>(new Set())
  const [target, setTarget] = useState('')
  const [applying, startApply] = useBusyTransition(true)
  const toast = useToast()
  const opener = useRef<HTMLButtonElement>(null)
  const card = useRef<HTMLDivElement>(null)

  // Slider nominal: 0 – 9.999.999, per 10 ribu (posisi paling kanan = 9.999.999).
  const AMT_TOP = 9_999_999, step = 10_000, maxPos = 1000
  const toAmt = (n: number) => (n >= maxPos ? AMT_TOP : n * step)
  const maxAmt = maxPos
  const d: [number, number] = dayR ?? [1, days]
  const a: [number, number] = amtR ?? [0, maxAmt]
  const aAmt: [number, number] = [toAmt(a[0]), toAmt(a[1])]
  const active = !!(dayR || amtR || cat || pocket || q.trim())

  const label = (id: string | null) => cats.find((p) => p.id === id)?.label
  const pk = (id?: string | null) => pockets.find((p) => p.id === id)?.name

  const shown = useMemo(() => expenses.filter((e) => {
    const day = Number(e.spent_on.slice(8, 10))
    const kw = q.trim().toLowerCase()
    if (kw && !(`${e.note} ${label(e.budget_item_id) ?? ''} ${pk(e.pocket_id) ?? ''} ${splits.filter((x) => x.expense_id === e.id).map((x) => x.name).join(' ')}`.toLowerCase().includes(kw))) return false
    if (day < d[0] || day > d[1]) return false
    if (e.amount < aAmt[0] || e.amount > aAmt[1]) return false
    if (cat === NONE ? e.budget_item_id : cat && e.budget_item_id !== cat) return false
    if (pocket === NONE ? e.pocket_id : pocket && e.pocket_id !== pocket) return false
    return true
  }), [expenses, splits, q, d[0], d[1], a[0], a[1], cat, pocket]) // eslint-disable-line react-hooks/exhaustive-deps

  const byDay = new Map<string, Expense[]>()
  for (const e of shown) byDay.set(e.spent_on, [...(byDay.get(e.spent_on) ?? []), e])
  const total = shown.reduce((t, e) => t + (e.credit ? 0 : e.amount), 0)
  const nActive = [dayR, amtR, cat, pocket].filter(Boolean).length
  const selectable = shown.filter((e) => !e.transfer_id)
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const stopPick = () => { setPick(false); setSel(new Set()); setTarget('') }
  const apply = () => startApply(async () => {
    const ids = [...sel]
    await setExpensesPocket(ids, target === NONE ? '' : target)
    toast(`${ids.length} catatan diperbarui`)
    stopPick()
  })
  const closeModal = () => { setOpen(false); opener.current?.focus() }

  useEffect(() => {
    if (!open) return
    card.current?.querySelector<HTMLElement>('button.ts-btn')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.ts-panel')) closeModal()
      if (e.key === 'Tab' && card.current) {
        const f = [...card.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])')]
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { setDayLimit(4) }, [dayR, amtR, cat, pocket, q])
  const reset = () => { setQ(''); setDayLimit(4); setDayR(null); setAmtR(null); setCat(''); setPocket('') }

  return (
    <div className="stack" style={{ gap: 'var(--space-5)' }}>
      <label className="search-box">
        <Search aria-hidden size={16} />
        <input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari catatan, mis. makan siang" aria-label="Cari catatan" maxLength={60} />
      </label>
      <div className="filter-bar">
        <button type="button" ref={opener} className="btn small ghost filter-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
          <Filter aria-hidden size={16} /> Filter{nActive ? <span className="filter-badge" aria-label={`${nActive} filter aktif`}>{nActive}</span> : null}
        </button>
        <span className="hint" aria-live="polite">{active ? `${shown.length} dari ${expenses.length} catatan · ${rp(total)}` : `${expenses.length} catatan · ${rp(total)}`}</span>
        {active ? <button type="button" className="btn small ghost" onClick={reset}><FilterX aria-hidden size={16} /> Reset</button> : null}
        <button type="button" className={`btn small ghost${pick ? ' on' : ''}`} aria-pressed={pick} onClick={() => (pick ? stopPick() : setPick(true))}><ListChecks aria-hidden size={16} /> {pick ? 'Selesai memilih' : 'Pilih banyak'}</button>
      </div>
      {open ? createPortal(
        <div className="confirm" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="confirm-card edit-card filter-card" ref={card} role="dialog" aria-modal="true" aria-labelledby="flt-t">
            <h2 id="flt-t"><Filter aria-hidden size={20} /> Filter catatan</h2>
            <div className="stack">
              <div className="field"><span>Kategori</span>
                <ThemedSelect label="Kategori" value={cat} onChange={setCat} options={[{ value: '', label: 'Semua kategori' }, ...cats.map((c) => ({ value: c.id, label: c.label })), { value: NONE, label: 'Tanpa kategori' }]} />
              </div>
              <div className="field"><span>Sumber dana</span>
                <ThemedSelect label="Sumber dana" value={pocket} onChange={setPocket} options={[{ value: '', label: 'Semua sumber' }, ...pockets.map((p) => ({ value: p.id, label: p.name })), { value: NONE, label: 'Belum dipilih' }]} />
              </div>
              <div className="field f-range">
                <span>Tanggal <b>{d[0] === d[1] ? `tgl ${d[0]}` : `tgl ${d[0]} – ${d[1]}`}</b></span>
                <RangeSlider min={1} max={days} value={d} onChange={(v) => setDayR(v[0] === 1 && v[1] === days ? null : v)} label="Rentang tanggal" format={(n) => `tanggal ${n}`} />
              </div>
              <div className="field f-range">
                <span>Nominal <b>{rp(aAmt[0])} – {rp(aAmt[1])}</b></span>
                <RangeSlider min={0} max={maxAmt} step={step} value={a} onChange={(v) => setAmtR(v[0] === 0 && v[1] === maxAmt ? null : v)} label="Rentang nominal" format={(n) => rp(toAmt(n))} />
              </div>
            </div>
            <div className="confirm-actions">
              <button type="button" className="btn" onClick={closeModal}>Tampilkan {shown.length} catatan</button>
              <button type="button" className="btn ghost" onClick={reset} disabled={!active}>Reset filter</button>
            </div>
          </div>
        </div>, document.body) : null}

      {shown.length ? [...byDay.entries()].slice(0, dayLimit).map(([day, list]) => (
        <section key={day} className="day" aria-label={tgl(day)}>
          <div className="day-sep">
            <span className="day-badge" aria-hidden><b>{Number(day.slice(8, 10))}</b><i>{new Date(day + 'T00:00:00Z').toLocaleDateString('id-ID', { weekday: 'short', timeZone: 'UTC' })}</i></span>
            <span className="day-title"><b>{tgl(day)}</b><span>{list.length} catatan</span></span>
            <span className="day-line" aria-hidden />
            <span className="day-total">{rp(list.reduce((t, e) => t + (e.credit ? 0 : e.amount), 0))}</span>
          </div>
          <ul className="rows">
            {list.map((e) => (
              <li key={e.id} className={pick && sel.has(e.id) ? 'picked' : undefined}>
                {pick ? (e.transfer_id ? <span className="pick-box" aria-hidden /> : <input type="checkbox" className="pick-box" checked={sel.has(e.id)} onChange={() => toggle(e.id)} aria-label={`Pilih catatan ${e.note || rp(e.amount)}`} />) : null}
                <span className="grow"><span className="name">{e.note || label(e.budget_item_id) || 'Pengeluaran'}</span>
                  {label(e.budget_item_id) || pk(e.pocket_id) || e.transfer_id || e.recurring_id ? <span className="meta">{[label(e.budget_item_id), pk(e.pocket_id), e.recurring_id ? 'Berulang' : '', e.transfer_id ? 'Otomatis dari Pindah dana (hapus lewat halaman Sumber dana)' : ''].filter(Boolean).join(' · ')}</span> : null}
                  {e.credit ? <span className="chip" title="Dibayar lewat kartu kredit, masuk anggaran saat tagihan kartu dibayar"><CreditCard aria-hidden size={12} /> Kartu kredit · tidak masuk anggaran</span> : null}
                  {(() => { const sp = splits.filter((x) => x.expense_id === e.id); return sp.length ? <span className="chip split-chip" title={sp.map((x) => `${x.name} ${rp(x.amount)}`).join(', ')}><Users aria-hidden size={12} /> Split bill · {sp.map((x) => `${x.name} ${rp(x.amount)}`).join(', ')}</span> : null })()}
                  {(() => { const cb = cashbacks.filter((x) => x.expense_id === e.id).reduce((t, x) => t + x.amount, 0); return cb > 0 ? <span className="chip ok" title="Cashback masuk ke saldo e-wallet, tidak memengaruhi anggaran"><Sparkles aria-hidden size={12} /> Cashback + {rp(cb)}</span> : null })()}
                </span>
                <span className="amt">{rp(e.amount)}</span>
                {!e.transfer_id && !pick ? <ExpenseEditor expense={e} cats={cats} pockets={pockets} cashback={cashbacks.filter((x) => x.expense_id === e.id).reduce((t, x) => t + x.amount, 0)} /> : null}
                {!e.transfer_id && !pick ? <ActionButton action={deleteExpense} args={[e.id]} label={`Hapus catatan ${e.note || rp(e.amount)}`} /> : null}
              </li>
            ))}
          </ul>
        </section>
      )) : <p className="hint">{expenses.length ? 'Tidak ada catatan yang cocok dengan filter ini.' : 'Belum ada catatan.'}</p>}
      {pick ? (
        <div className="sel-bar" role="region" aria-label="Ubah banyak catatan">
          <span className="sel-count"><b>{sel.size}</b> dipilih</span>
          <button type="button" className="btn small ghost" onClick={() => setSel(sel.size === selectable.length ? new Set() : new Set(selectable.map((e) => e.id)))}>
            {sel.size === selectable.length && selectable.length ? 'Kosongkan' : `Pilih semua (${selectable.length})`}
          </button>
          <span className="sel-pick"><ThemedSelect label="Sumber dana baru" value={target} onChange={setTarget} placeholder="Pilih sumber dana baru"
            options={[...pockets.map((p) => ({ value: p.id, label: p.name })), { value: NONE, label: 'Tanpa sumber dana' }]} /></span>
          <button type="button" className="btn small" disabled={!sel.size || !target || applying} aria-busy={applying} onClick={apply}>{applying ? 'Menyimpan…' : 'Terapkan'}</button>
        </div>
      ) : null}
      {byDay.size > dayLimit ? (
        <button type="button" className="btn small ghost more-btn" onClick={() => setDayLimit(dayLimit + 4)}>
          <ChevronDown aria-hidden size={16} /> Lihat lebih banyak ({byDay.size - dayLimit} hari lagi)
        </button>
      ) : null}
    </div>
  )
}
