'use client'
import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { MoneyInput } from './Fields'
import { PocketSelect } from './PocketSelect'
import type { Pocket } from '@/lib/types'

/** Pilihan sumber dana. Kalau yang dipilih e-wallet, muncul pilihan opsional "dapat cashback" dengan nominalnya. */
export function PocketCashbackFields({ pockets, defaultPocket = '', defaultCashback = 0 }: { pockets: Pocket[]; defaultPocket?: string; defaultCashback?: number }) {
  const [pid, setPid] = useState(defaultPocket)
  const [on, setOn] = useState(defaultCashback > 0)
  const box = useRef<HTMLDivElement>(null)
  const wallet = pockets.find((p) => p.id === pid)?.kind === 'ewallet'

  useEffect(() => { // QuickForm mengosongkan formulir setelah simpan
    const f = box.current?.closest('form')
    const reset = () => setOn(false)
    f?.addEventListener('reset', reset)
    return () => f?.removeEventListener('reset', reset)
  }, [])

  return (
    <div className="full stack" ref={box} style={{ gap: 'var(--space-3)' }}>
      <PocketSelect pockets={pockets} full defaultValue={defaultPocket} onChange={setPid} />
      {wallet ? (
        <div className="stack" style={{ gap: 'var(--space-2)' }}>
          <label className="cluster" style={{ flexWrap: 'nowrap', alignItems: 'center', gap: 'var(--space-2)' }}><input type="checkbox" className="check" checked={on} onChange={(e) => setOn(e.target.checked)} /> <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Sparkles aria-hidden size={14} /> Dapat cashback dari transaksi ini</span></label>
          {on ? (
            <label className="field"><span>Cashback yang diterima</span><MoneyInput name="cashback" label="Nominal cashback" defaultValue={defaultCashback} required /></label>
          ) : null}
          {on ? <p className="hint">Masuk ke saldo e-wallet ini, bukan pemasukan, jadi tidak memengaruhi anggaran.</p> : null}
        </div>
      ) : null}
    </div>
  )
}
