'use client'
import { useState } from 'react'
import { MoneyInput } from './Fields'

/** Isian jenis + saldo sumber dana baru. Untuk kartu kredit: limit dan pemakaian saat ini. */
export function PocketKindFields() {
  const [kind, setKind] = useState('bank')
  return (
    <>
      <label className="field"><span>Jenis</span>
        <select className="select" name="kind" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="bank">Bank</option><option value="ewallet">E-wallet</option><option value="tunai">Tunai</option>
          <option value="kredit">Kartu kredit</option><option value="paylater">PayLater</option><option value="lainnya">Lainnya</option>
        </select>
      </label>
      {kind === 'kredit' || kind === 'paylater' ? (
        <>
          <label className="field"><span>Limit</span><MoneyInput name="credit_limit" label="Limit" /></label>
          <label className="field full"><span>Terpakai saat ini</span><MoneyInput name="opening_balance" label="Pemakaian saat ini" /><small className="hint">Hanya dokumentasi limit. Tidak masuk anggaran, sisa jatah, atau total sumber dana.</small></label>
        </>
      ) : (
        <label className="field"><span>Saldo sekarang</span><MoneyInput name="opening_balance" label="Saldo awal" /></label>
      )}
    </>
  )
}
