'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Plus } from 'lucide-react'

/** Isian kategori dengan daftar pilihan dari kategori yang sudah ada; boleh mengetik nama baru. */
export function CategoryCombo({ name, options, defaultValue = '', placeholder }: { name: string; options: string[]; defaultValue?: string; placeholder?: string }) {
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const [idx, setIdx] = useState(-1)
  const [box, setBox] = useState<{ left: number; width: number; top?: number; bottom?: number; max: number } | null>(null)
  const wrap = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const id = useId()

  const q = value.trim().toLowerCase()
  const shown = options.filter((o) => !q || o.toLowerCase().includes(q))
  const isNew = !!q && !options.some((o) => o.toLowerCase() === q)

  const place = () => {
    const r = wrap.current?.getBoundingClientRect()
    if (!r) return
    const below = window.innerHeight - r.bottom - 12
    const above = r.top - 12
    const up = below < 160 && above > below
    setBox({ left: r.left, width: r.width, max: Math.max(110, Math.min(240, up ? above : below)), ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }) })
  }
  const show = () => { place(); setOpen(true) }
  const pick = (v: string) => { setValue(v); setOpen(false); setIdx(-1); input.current?.focus() }

  useEffect(() => { // ikut kembali ke nilai awal saat formulir di-reset setelah tersimpan
    const f = wrap.current?.closest('form')
    const on = () => { setValue(defaultValue); setOpen(false) }
    f?.addEventListener('reset', on)
    return () => f?.removeEventListener('reset', on)
  }, [defaultValue])

  useEffect(() => {
    if (!open) return
    const out = (e: MouseEvent) => { const t = e.target as Node; if (!list.current?.contains(t) && !wrap.current?.contains(t)) setOpen(false) }
    const move = () => place()
    document.addEventListener('mousedown', out)
    window.addEventListener('resize', move)
    window.addEventListener('scroll', move, true)
    return () => { document.removeEventListener('mousedown', out); window.removeEventListener('resize', move); window.removeEventListener('scroll', move, true) }
  }, [open])

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (!open) show(); setIdx((i) => Math.min(shown.length - 1, i + 1)) }
    else if (e.key === 'ArrowUp' && open) { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)) }
    else if (e.key === 'Enter' && open && idx >= 0 && shown[idx]) { e.preventDefault(); pick(shown[idx]) }
    else if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); setOpen(false) }
    else if (e.key === 'Tab') setOpen(false)
  }

  const nothing = !shown.length && !isNew
  return (
    <>
      <div className="combo" ref={wrap}>
        <input ref={input} className="input" name={name} value={value} maxLength={40} placeholder={placeholder} required autoComplete="off"
          role="combobox" aria-expanded={open} aria-controls={open ? id : undefined} aria-autocomplete="list"
          onChange={(e) => { setValue(e.target.value); setIdx(-1); if (!open) show() }} onFocus={show} onClick={() => !open && show()} onKeyDown={onKey} />
        <button type="button" className="combo-btn" tabIndex={-1} aria-label="Lihat kategori yang ada" onMouseDown={(e) => e.preventDefault()} onClick={() => (open ? setOpen(false) : (input.current?.focus(), show()))}>
          <ChevronDown aria-hidden size={18} className="ts-chev" style={open ? { transform: 'rotate(180deg)' } : undefined} />
        </button>
      </div>
      {open && box && (shown.length || isNew || nothing) ? createPortal(
        <ul id={id} ref={list} role="listbox" aria-label="Kategori" className="ts-panel" style={{ left: box.left, width: box.width, top: box.top, bottom: box.bottom, maxHeight: box.max }}>
          {shown.map((o, i) => (
            <li key={o} role="option" aria-selected={o === value} className={`ts-opt${i === idx ? ' is-active' : ''}${o === value ? ' is-on' : ''}`}
              onMouseEnter={() => setIdx(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(o)}>
              <span className="grow">{o}</span>{o === value ? <Check aria-hidden size={16} /> : null}
            </li>
          ))}
          {isNew ? <li role="presentation" className="ts-opt combo-new"><Plus aria-hidden size={16} /><span className="grow">Kategori baru: “{value.trim()}”</span></li> : null}
          {nothing ? <li role="presentation" className="ts-opt combo-new"><span className="grow">Belum ada kategori. Ketik nama untuk membuat.</span></li> : null}
        </ul>, document.body) : null}
    </>
  )
}
