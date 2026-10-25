'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Ban, Check, ChevronDown } from 'lucide-react'
import { PocketAvatar } from './PocketAvatar'
import type { Pocket } from '@/lib/types'

const KIND = { bank: 'Bank', ewallet: 'E-wallet', tunai: 'Tunai', lainnya: 'Lainnya', kredit: 'Kartu kredit', paylater: 'PayLater' } as const

/** Pilihan sumber dana: tombol ringkas yang membuka daftar bermerek bank / e-wallet. Nilai dikirim lewat input tersembunyi. */
export function PocketPicker({ pockets, name = 'pocket_id', label, defaultValue = '' }: { pockets: Pocket[]; name?: string; label: string; defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(0)
  const [box, setBox] = useState<{ left: number; width: number; top?: number; bottom?: number; max: number } | null>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const id = useId()
  const ids = ['', ...pockets.map((p) => p.id)]
  const cur = pockets.find((p) => p.id === value)

  useEffect(() => { // QuickForm mengosongkan formulir setelah simpan
    const f = btn.current?.closest('form')
    const on = () => { setValue(defaultValue); setOpen(false) }
    f?.addEventListener('reset', on)
    return () => f?.removeEventListener('reset', on)
  }, [defaultValue])

  const place = () => {
    const r = btn.current?.getBoundingClientRect()
    if (!r) return
    const below = window.innerHeight - r.bottom - 12
    const above = r.top - 12
    const up = below < 200 && above > below
    setBox({ left: r.left, width: r.width, max: Math.max(120, Math.min(300, up ? above : below)), ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }) })
  }
  const show = () => { setIdx(Math.max(0, ids.indexOf(value))); place(); setOpen(true) }
  const close = (focus = true) => { setOpen(false); if (focus) btn.current?.focus() }
  const pick = (v: string) => { setValue(v); close() }

  useEffect(() => {
    if (!open) return
    const out = (e: MouseEvent) => { const t = e.target as Node; if (!list.current?.contains(t) && !btn.current?.contains(t)) close(false) }
    const move = () => place()
    document.addEventListener('mousedown', out)
    window.addEventListener('resize', move)
    window.addEventListener('scroll', move, true)
    return () => { document.removeEventListener('mousedown', out); window.removeEventListener('resize', move); window.removeEventListener('scroll', move, true) }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (open) list.current?.querySelector<HTMLElement>(`[data-i="${idx}"]`)?.scrollIntoView({ block: 'nearest' }) }, [idx, open])

  const onKey = (e: React.KeyboardEvent) => {
    if (!open) { if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); show() } return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(ids.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Home') { e.preventDefault(); setIdx(0) }
    else if (e.key === 'End') { e.preventDefault(); setIdx(ids.length - 1) }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(ids[idx]) }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() }
    else if (e.key === 'Tab') close(false)
  }

  const row = (pid: string, i: number, title: string, sub: string, avatar: React.ReactNode) => (
    <li key={pid || 'none'} role="option" data-i={i} aria-selected={pid === value} className={`ts-opt pp-row${i === idx ? ' is-active' : ''}${pid === value ? ' is-on' : ''}`}
      onMouseEnter={() => setIdx(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(pid)}>
      {avatar}
      <span className="pp-txt grow"><b>{title}</b><small>{sub}</small></span>
      {pid === value ? <Check aria-hidden size={16} /> : null}
    </li>
  )

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <button type="button" ref={btn} className="ts-btn pp-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? id : undefined}
        aria-label={`${label}: ${cur?.name ?? 'Tanpa sumber dana'}`} onClick={() => (open ? close(false) : show())} onKeyDown={onKey}>
        {cur ? <PocketAvatar name={cur.name} kind={cur.kind} size={26} /> : <span className="pa pa-none" style={{ width: 26, height: 26 }} aria-hidden="true"><Ban size={14} /></span>}
        <span className="grow">{cur?.name ?? 'Tanpa sumber dana'}</span>
        <ChevronDown aria-hidden size={18} className="ts-chev" />
      </button>
      {open && box ? createPortal(
        <ul id={id} ref={list} role="listbox" aria-label={label} className="ts-panel" style={{ left: box.left, width: box.width, top: box.top, bottom: box.bottom, maxHeight: box.max }}>
          {row('', 0, 'Tanpa sumber dana', 'Tidak dicatat', <span className="pa pa-none" style={{ width: 32, height: 32 }} aria-hidden="true"><Ban size={16} /></span>)}
          {pockets.map((p, i) => row(p.id, i + 1, p.name, KIND[p.kind] ?? 'Lainnya', <PocketAvatar name={p.name} kind={p.kind} size={32} />))}
        </ul>, document.body) : null}
    </>
  )
}
