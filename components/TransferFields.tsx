'use client'
import { useEffect, useRef, useState } from 'react'
import { ThemedSelect } from './ThemedSelect'
import { isCreditKind, type Pocket } from '@/lib/types'

/** Pilihan "Dari" (termasuk kartu kredit, untuk tarik tunai / card to cash) dan "Ke" (rekening, e-wallet, tunai) pada Pindah dana. */
export function TransferFields({ from, to, defaultFrom, defaultTo }: { from: Pocket[]; to: Pocket[]; defaultFrom: string; defaultTo: string }) {
  const [f, setF] = useState(defaultFrom)
  const [t, setT] = useState(defaultTo)
  const mark = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const form = mark.current?.form
    if (!form) return
    const reset = () => { setF(defaultFrom); setT(defaultTo) }
    form.addEventListener('reset', reset)
    return () => form.removeEventListener('reset', reset)
  }, [defaultFrom, defaultTo])
  const hasCard = from.some((p) => isCreditKind(p.kind))
  const grp = (p: Pocket) => (hasCard ? (isCreditKind(p.kind) ? 'Kartu kredit' : 'Rekening, e-wallet, tunai') : undefined)
  // Kelompok rekening dulu, kartu kredit di bawahnya
  const src = [...from.filter((p) => !isCreditKind(p.kind)), ...from.filter((p) => isCreditKind(p.kind))]
  return (
    <>
      <input type="hidden" name="from_pocket" value={f} ref={mark} />
      <input type="hidden" name="to_pocket" value={t} />
      <div className="field"><span>Dari</span>
        <ThemedSelect label="Dari" value={f} onChange={setF} options={src.map((p) => ({ value: p.id, label: p.name, group: grp(p) }))} />
      </div>
      <div className="field"><span>Ke</span>
        <ThemedSelect label="Ke" value={t} onChange={setT} options={to.map((p) => ({ value: p.id, label: p.name }))} />
      </div>
    </>
  )
}
