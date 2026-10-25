'use client'
import { useEffect, useRef, useState } from 'react'
import { Ban, Check } from 'lucide-react'
import { PocketAvatar } from './PocketAvatar'
import type { Pocket } from '@/lib/types'

const KIND = { bank: 'Bank', ewallet: 'E-wallet', tunai: 'Tunai', lainnya: 'Lainnya' } as const

/** Pilihan sumber dana berupa kartu dengan penanda merek bank / e-wallet. Nilai dikirim lewat input tersembunyi. */
export function PocketPicker({ pockets, name = 'pocket_id', label, defaultValue = '' }: { pockets: Pocket[]; name?: string; label: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue)
  const root = useRef<HTMLDivElement>(null)
  const ids = ['', ...pockets.map((p) => p.id)]

  useEffect(() => { // QuickForm mengosongkan formulir setelah simpan
    const f = root.current?.closest('form')
    const on = () => setValue(defaultValue)
    f?.addEventListener('reset', on)
    return () => f?.removeEventListener('reset', on)
  }, [defaultValue])

  const move = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const n = (i + d + ids.length) % ids.length
    setValue(ids[n])
    root.current?.querySelectorAll<HTMLElement>('[role=radio]')[n]?.focus()
  }

  const opt = (id: string, i: number, title: string, sub: string, avatar: React.ReactNode) => {
    const on = value === id
    return (
      <button key={id || 'none'} type="button" role="radio" aria-checked={on} tabIndex={on || (!ids.includes(value) && i === 0) ? 0 : -1}
        className={`pp-opt${on ? ' on' : ''}`} onClick={() => setValue(id)} onKeyDown={(e) => move(e, i)}>
        {avatar}
        <span className="pp-txt"><b>{title}</b><small>{sub}</small></span>
        {on ? <Check className="pp-check" aria-hidden size={16} /> : null}
      </button>
    )
  }

  return (
    <div className="pp" ref={root} role="radiogroup" aria-label={label}>
      <input type="hidden" name={name} value={value} />
      {opt('', 0, 'Tanpa sumber dana', 'Tidak dicatat', <span className="pa pa-none" style={{ width: 36, height: 36 }} aria-hidden="true"><Ban size={18} /></span>)}
      {pockets.map((p, i) => opt(p.id, i + 1, p.name, KIND[p.kind] ?? 'Lainnya', <PocketAvatar name={p.name} kind={p.kind} />))}
    </div>
  )
}
