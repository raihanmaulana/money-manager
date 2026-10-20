'use client'
import { useEffect, useRef, useState } from 'react'
import { Plus, Users, X } from 'lucide-react'
import { MoneyInput } from './Fields'

/** Tombol "Split bill" di form catatan: tiap baris = nama teman + nominal yang harus ia bayar. */
export function SplitFields() {
  const [rows, setRows] = useState<number[]>([])
  const next = useRef(1)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => { // ikut kosong saat formulir di-reset setelah tersimpan
    const f = box.current?.closest('form')
    const on = () => setRows([])
    f?.addEventListener('reset', on)
    return () => f?.removeEventListener('reset', on)
  }, [])
  const add = () => setRows((r) => [...r, next.current++])
  return (
    <div className="field full split-fields" ref={box}>
      {rows.length ? <span>Split bill — yang harus dibayar teman</span> : null}
      {rows.map((id) => (
        <div key={id} className="split-row">
          <input className="input" name="split_name" maxLength={60} placeholder="Nama (mis. Kartika)" aria-label="Nama teman" required />
          <MoneyInput name="split_amount" label="Nominal yang harus dibayar" required />
          <button type="button" className="btn icon" onClick={() => setRows((r) => r.filter((x) => x !== id))} aria-label="Hapus baris split bill" title="Hapus baris"><X aria-hidden size={18} /></button>
        </div>
      ))}
      <button type="button" className="btn small ghost split-add" onClick={add}>
        {rows.length ? <Plus aria-hidden size={16} /> : <Users aria-hidden size={16} />} {rows.length ? 'Tambah orang lagi' : 'Split bill'}
      </button>
    </div>
  )
}
