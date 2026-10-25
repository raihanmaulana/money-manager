'use client'
import { useState } from 'react'
import { MoneyInput } from './Fields'

/** Pilihan jenis + kolom minimum bayar yang hanya muncul untuk kartu kredit. */
export function BillKindFields({ cards = [] }: { cards?: { id: string; name: string }[] }) {
  const [kind, setKind] = useState('tagihan')
  const [card, setCard] = useState('')
  return (
    <>
      <label className="field"><span>Jenis</span>
        <select className="select" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="tagihan">Tagihan rutin</option><option value="cicilan">Cicilan</option>
          <option value="hutang">Hutang</option><option value="kartu">Kartu kredit</option>
        </select>
      </label>
      <label className="field"><span>{kind === 'kartu' ? 'Tagihan bulan ini' : 'Per bulan'}</span><MoneyInput name="amount" label="Nominal" required /></label>
      {kind === 'kartu' ? (
        <label className="field full"><span>Pembayaran minimum</span>
          <MoneyInput name="min_payment" label="Pembayaran minimum kartu kredit" />
          <small className="hint">Bayar di bawah ini bisa kena denda telat. Tagihan tiap bulan bisa diubah di daftar.</small>
        </label>
      ) : null}
      {kind !== 'hutang' && cards.length ? (
        <label className="field full"><span>Hubungkan ke kartu kredit atau PayLater</span>
          <select className="select" name="card_pocket_id" value={card} onChange={(e) => setCard(e.target.value)}><option value="">Tidak terhubung</option>{cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <small className="hint">Membayar tagihan ini akan mengembalikan limit di Sumber dana.</small>
        </label>
      ) : null}
      {kind !== 'kartu' && kind !== 'hutang' && card ? (
        <label className="field full"><span>Pokok per bulan (opsional)</span>
          <MoneyInput name="principal" label="Pokok per bulan" />
          <small className="hint">Isi kalau cicilan memuat bunga atau admin. Limit hanya pulih sebesar pokok ini tiap bulan. Kosong = seluruh nominal.</small>
        </label>
      ) : null}
    </>
  )
}
