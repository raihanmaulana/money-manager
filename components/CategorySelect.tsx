'use client'
import { useEffect, useRef, useState } from 'react'
import { ThemedSelect } from './ThemedSelect'
type Cat = { id: string; label: string; grp?: string }

const GROUP_TITLE: Record<string, string> = { kebutuhan: 'Kebutuhan pokok', gaya_hidup: 'Gaya hidup', tabungan: 'Tabungan', investasi: 'Investasi' }

/** Pilihan kategori anggaran bertema, dikelompokkan dan mengikuti urutan di halaman Anggaran. Kembali ke "Tanpa kategori" saat formulir di-reset. */
export function CategorySelect({ name, cats, defaultValue = '', by = 'id' }: { name: string; cats: Cat[]; defaultValue?: string; by?: 'id' | 'label' }) {
  const [v, setV] = useState(defaultValue)
  const mark = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const f = mark.current?.form
    if (!f) return
    const reset = () => setV(defaultValue)
    f.addEventListener('reset', reset)
    return () => f.removeEventListener('reset', reset)
  }, [defaultValue])
  const val = (c: Cat) => (by === 'id' ? c.id : c.label)
  return (
    <>
      <input type="hidden" name={name} value={v} ref={mark} />
      <ThemedSelect label="Kategori" value={v} onChange={setV}
        options={[{ value: '', label: 'Tanpa kategori' }, ...cats.map((c) => ({ value: val(c), label: c.label, group: (c.grp ? GROUP_TITLE[c.grp] : undefined) }))]} />
    </>
  )
}
