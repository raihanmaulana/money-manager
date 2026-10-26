'use client'
import { useState } from 'react'
import { DatePicker } from './DatePicker'
import { MoneyInput } from './Fields'
import { rp } from '@/lib/calc'
import { isCreditKind } from '@/lib/types'

type Init = { opening?: number; total_in?: number; total_out?: number; closing?: number; min_payment?: number; due_on?: string | null; note?: string }

/** Isian ringkasan statement. Untuk kartu kredit labelnya diganti (tagihan, pembayaran, pembelanjaan). */
export function StatementFields({ kind, init = {}, today, inModal = false }: { kind: string; init?: Init; today: string; inModal?: boolean }) {
  const cc = isCreditKind(kind)
  const [o, setO] = useState(init.opening ?? 0)
  const [i, setI] = useState(init.total_in ?? 0)
  const [u, setU] = useState(init.total_out ?? 0)
  const [c, setC] = useState(init.closing ?? 0)
  const calc = cc ? o - i + u : o + i - u
  const diff = c - calc
  const L = cc
    ? { o: 'Tagihan sebelumnya', i: 'Pembayaran diterima', u: 'Pembelanjaan bulan ini', c: 'Tagihan bulan ini (saldo akhir)' }
    : { o: 'Saldo awal', i: 'Total masuk (kredit)', u: 'Total keluar (debit)', c: 'Saldo akhir' }
  return (
    <div className="form-grid">
      <label className="field"><span>{L.o}</span><MoneyInput name="opening" label={L.o} defaultValue={init.opening ?? 0} onValue={setO} /></label>
      <label className="field"><span>{L.i}</span><MoneyInput name="total_in" label={L.i} defaultValue={init.total_in ?? 0} onValue={setI} /></label>
      <label className="field"><span>{L.u}</span><MoneyInput name="total_out" label={L.u} defaultValue={init.total_out ?? 0} onValue={setU} /></label>
      <label className="field"><span>{L.c}</span><MoneyInput name="closing" label={L.c} defaultValue={init.closing ?? 0} onValue={setC} /></label>
      <p className={`hint full${c && diff !== 0 ? ' form-msg err' : ''}`} aria-live="polite">
        {c || o || i || u ? (diff === 0 ? 'Hitungan cocok dengan saldo akhir.' : `Hitungan dari angka di atas ${rp(calc)}, selisih ${diff < 0 ? '−' : '+'}${rp(Math.abs(diff))} dengan saldo akhir. Cek lagi angkanya.`) : 'Salin angka ringkasan dari halaman pertama atau terakhir statement.'}
      </p>
      {cc ? (
        <>
          <label className="field"><span>Pembayaran minimum</span><MoneyInput name="min_payment" label="Pembayaran minimum" defaultValue={init.min_payment ?? 0} /></label>
          <label className="field"><span>Jatuh tempo</span><DatePicker name="due_on" label="Jatuh tempo" defaultValue={init.due_on ?? today} inModal={inModal} /></label>
        </>
      ) : null}
      <label className="field full"><span>Catatan (opsional)</span><input className="input" name="note" maxLength={200} defaultValue={init.note ?? ''} placeholder="mis. ada biaya admin tahunan" /></label>
    </div>
  )
}
