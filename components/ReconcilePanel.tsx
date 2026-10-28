'use client'
import { useState } from 'react'
import { CheckCircle2, CircleAlert, ListChecks, Plus } from 'lucide-react'
import { rp } from '@/lib/calc'
import { importStatementExpenses } from '@/lib/estatement-actions'
import { QuickForm, Submit } from './Fields'

type Txn = { id: string; txn_on: string; kind: string; description: string; direction: 'in' | 'out'; amount: number }
type Move = { id: string; src: string; date: string | null; direction: 'in' | 'out'; amount: number; label: string }
const SRC: Record<string, string> = { catatan: 'Catatan', tagihan: 'Tagihan', pindah: 'Pindah dana', hutang: 'Hutang', pemasukan: 'Pemasukan', kartu: 'Bayar kartu', cashback: 'Cashback' }
const tgl = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`
const sign = (d: 'in' | 'out', n: number) => `${d === 'in' ? '+' : '−'} ${rp(n)}`

/** Hasil pencocokan statement dengan Catatan: yang cocok, yang belum dicatat (bisa dicatat sekaligus), dan yang hanya ada di aplikasi. */
export function ReconcilePanel({ statementId, pocketName, matched, bankOnly, appOnly, credit }: {
  statementId: string; pocketName: string; credit: boolean
  matched: { txn: Txn; move: Move }[]; bankOnly: Txn[]; appOnly: Move[]
}) {
  // Cicilan di kartu masuk lewat Tagihan, jadi tidak dicentang otomatis
  const importable = bankOnly.filter((t) => t.direction === 'out')
  const [picked, setPicked] = useState<Set<string>>(() => new Set(importable.filter((t) => !/^Cicilan/.test(t.kind)).map((t) => t.id)))
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const pickedSum = importable.filter((t) => picked.has(t.id)).reduce((a, t) => a + t.amount, 0)
  const sumOf = (l: Txn[]) => l.reduce((a, t) => a + t.amount, 0)
  const allOk = !bankOnly.length && !appOnly.length

  return (
    <section className="rpt-sec" aria-label="Pencocokan dengan Catatan">
      <h2>Dicocokkan dengan Catatan</h2>
      <p className="cluster" style={{ gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <span className="chip ok"><CheckCircle2 aria-hidden size={14} /> {matched.length} cocok</span>
        <span className={bankOnly.length ? 'chip warn' : 'chip'}><CircleAlert aria-hidden size={14} /> {bankOnly.length} belum dicatat{bankOnly.length ? ` · ${rp(sumOf(bankOnly))}` : ''}</span>
        <span className="chip">{appOnly.length} hanya di aplikasi</span>
      </p>
      {allOk ? <p className="hint">Semua transaksi di statement {pocketName} sudah tercatat di aplikasi.</p> : null}

      {bankOnly.length ? (
        <>
          <h3 style={{ fontSize: '1rem', margin: 'var(--space-4) 0 var(--space-2)' }}>Ada di bank, belum ada di aplikasi</h3>
          <QuickForm action={importStatementExpenses} className="stack" resetOnDone={false} toastText="Tercatat di Catatan">
            <input type="hidden" name="statement_id" value={statementId} />
            <ul className="rows">
              {bankOnly.map((t) => (
                <li key={t.id} className="row wrap">
                  {t.direction === 'out' ? (
                    <input type="checkbox" className="check" name="ids" value={t.id} checked={picked.has(t.id)} onChange={() => toggle(t.id)} aria-label={`Catat ${t.description}`} />
                  ) : <span style={{ width: 18 }} aria-hidden />}
                  <span className="grow"><span className="name">{t.description || t.kind}</span>
                    <span className="meta">{tgl(t.txn_on)} · {t.kind}{t.direction === 'in' ? ' · uang masuk, catat lewat Pindah dana atau Anggaran' : /^Cicilan/.test(t.kind) ? ' · lewat Tagihan' : ''}</span></span>
                  <span className={`amt ${t.direction === 'out' ? 'minus' : ''}`}>{sign(t.direction, t.amount)}</span>
                </li>
              ))}
            </ul>
            {importable.length ? (
              <div className="cluster no-print">
                <Submit className="btn small" pendingText="Mencatat…"><Plus aria-hidden /> Catat {picked.size} terpilih{picked.size ? ` (${rp(pickedSum)})` : ''}</Submit>
                <button type="button" className="btn small ghost" onClick={() => setPicked(picked.size === importable.length ? new Set() : new Set(importable.map((t) => t.id)))}>
                  <ListChecks aria-hidden size={16} /> {picked.size === importable.length ? 'Kosongkan' : 'Pilih semua'}
                </button>
                <span className="hint">Kategori diisi otomatis bila keterangannya pernah dikategorikan.</span>
              </div>
            ) : null}
          </QuickForm>
        </>
      ) : null}

      {appOnly.length ? (
        <>
          <h3 style={{ fontSize: '1rem', margin: 'var(--space-5) 0 var(--space-2)' }}>Ada di aplikasi, tidak ada di bank</h3>
          <ul className="rows">
            {appOnly.map((m) => (
              <li key={m.id} className="row wrap">
                <span className="grow"><span className="name">{m.label}</span><span className="meta">{m.date ? tgl(m.date) : 'bulan ini'} · {SRC[m.src] ?? m.src}</span></span>
                <span className={`amt ${m.direction === 'out' ? 'minus' : ''}`}>{sign(m.direction, m.amount)}</span>
              </li>
            ))}
          </ul>
          <p className="hint">Bisa salah nominal atau tanggal, tercatat di sumber dana yang keliru, atau memang belum diproses bank. Cek di halaman Catatan.</p>
        </>
      ) : null}

      {matched.length ? (
        <details style={{ marginTop: 'var(--space-4)' }}>
          <summary className="hint">Lihat {matched.length} transaksi yang cocok</summary>
          <ul className="rows">
            {matched.map(({ txn, move }) => (
              <li key={txn.id} className="row wrap">
                <span className="grow"><span className="name">{txn.description || txn.kind}</span><span className="meta">{tgl(txn.txn_on)} · cocok dengan {SRC[move.src] ?? move.src}: {move.label}</span></span>
                <span className={`amt ${txn.direction === 'out' ? 'minus' : ''}`}>{sign(txn.direction, txn.amount)}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  )
}
