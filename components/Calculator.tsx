'use client'
import { useEffect, useRef, useState } from 'react'
import { Calculator as CalcIcon, Check, Copy, Delete, X } from 'lucide-react'

type Tok = number | '+' | '-' | '*' | '/' | '%'
const OPS = { '+': 1, '-': 1, '*': 2, '/': 2 } as const
const SHOW: Record<string, string> = { '*': '×', '/': '÷', '-': '−' }

/** Hitung ekspresi tanpa eval: + − × ÷ dan persen (50% = 0,5), minus di depan angka didukung. */
function calc(expr: string): number | null {
  const toks: Tok[] = []
  const re = /\d+(?:[.,]\d*)?|[.,]\d+|[+\-*/%]/g
  let m: RegExpExecArray | null
  let last = 0
  while ((m = re.exec(expr))) {
    if (m.index !== last) return null
    last = re.lastIndex
    const t = m[0]
    toks.push(/^[+\-*/%]$/.test(t) ? (t as Tok) : Number(t.replace(',', '.')))
  }
  if (last !== expr.length || !toks.length) return null
  const out: Tok[] = [], st: ('+' | '-' | '*' | '/')[] = []
  let prevNum = false
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]
    if (typeof t === 'number') { out.push(t); prevNum = true; continue }
    if (t === '%') { if (!prevNum) return null; out.push('%'); continue }
    if (!prevNum) { // minus/plus unary
      if (t === '-' || t === '+') {
        const n = toks[i + 1]
        if (typeof n !== 'number') return null
        out.push(t === '-' ? -n : n); i++; prevNum = true; continue
      }
      return null
    }
    while (st.length && OPS[st[st.length - 1]] >= OPS[t]) out.push(st.pop()!)
    st.push(t); prevNum = false
  }
  if (!prevNum) return null
  while (st.length) out.push(st.pop()!)
  const v: number[] = []
  for (const t of out) {
    if (typeof t === 'number') v.push(t)
    else if (t === '%') { if (!v.length) return null; v.push(v.pop()! / 100) }
    else {
      const b = v.pop(), a = v.pop()
      if (a === undefined || b === undefined) return null
      v.push(t === '+' ? a + b : t === '-' ? a - b : t === '*' ? a * b : a / b)
    }
  }
  const r = v[0]
  return v.length === 1 && Number.isFinite(r) ? Math.round(r * 1e8) / 1e8 : null
}

const fmt = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 8 })
const group = (e: string) => e.replace(/(\d+)(,\d*)?/g, (_, i: string, d = '') => i.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + d)
const pretty = (e: string) => group(e).replace(/[*/-]/g, (c) => ` ${SHOW[c]} `).replace(/\+/g, ' + ')

/** Tombol melayang di kanan layar yang membuka kalkulator mini. */
export function Calculator() {
  const [open, setOpen] = useState(false)
  const [expr, setExpr] = useState('')
  const [done, setDone] = useState(false) // true setelah "=" supaya angka berikutnya memulai hitungan baru
  const [copied, setCopied] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 }) // geser panel supaya tidak menutupi formulir
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  const result = expr ? calc(expr) : null
  const press = (k: string) => {
    setCopied(false)
    if (k === 'C') { setExpr(''); setDone(false); return }
    if (k === 'DEL') { setExpr((e) => e.slice(0, -1)); setDone(false); return }
    if (k === '=') { if (result !== null) { setExpr(String(result).replace('.', ',')); setDone(true) } return }
    const isOp = /^[+\-*/%]$/.test(k)
    setExpr((e) => {
      if (done && !isOp) return k // angka baru setelah "="
      if (e.length > 60) return e
      if (isOp && k !== '%' && /[+\-*/]$/.test(e)) return k === '-' && /[*/]$/.test(e) ? e + k : e.replace(/[+\-*/]+$/, '') + k
      if (isOp && !e && (k === '*' || k === '/' || k === '%')) return e
      if (k === ',') { const part = e.split(/[+\-*/%]/).pop() ?? ''; if (part.includes(',')) return e; return part ? e + ',' : e + '0,' }
      return e + k
    })
    setDone(false)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') { setOpen(false); opener.current?.focus(); return }
      const t = ev.target as HTMLElement | null
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !panel.current?.contains(t)) return // sedang mengetik di formulir
      if (!panel.current?.contains(t) && t !== document.body) return
      const k = ev.key
      if (/^[0-9]$/.test(k) || k === '+' || k === '-' || k === '*' || k === '/' || k === '%') { ev.preventDefault(); press(k) }
      else if (k === ',' || k === '.') { ev.preventDefault(); press(',') }
      else if (k === 'Enter' && t?.tagName !== 'BUTTON') { ev.preventDefault(); press('=') }
      else if (k === 'Backspace') { ev.preventDefault(); press('DEL') }
      else if (k === 'Delete') { ev.preventDefault(); press('C') }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }) // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async () => {
    if (!done || result === null) return
    try { await navigator.clipboard.writeText(String(result)); setCopied(true) } catch { /* diabaikan */ }
  }

  const keys: [string, string, string?][] = [
    ['C', 'C', 'fn'], ['DEL', '⌫', 'fn'], ['%', '%', 'fn'], ['/', '÷', 'op'],
    ['7', '7'], ['8', '8'], ['9', '9'], ['*', '×', 'op'],
    ['4', '4'], ['5', '5'], ['6', '6'], ['-', '−', 'op'],
    ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+', 'op'],
    ['0', '0'], [',', ','], ['=', '=', 'eq'],
  ]

  return (
    <div className="calc no-print">
      {open ? (
        <div className="calc-panel" ref={panel} role="dialog" aria-label="Kalkulator mini" style={{ translate: `${pos.x}px ${pos.y}px` }}>
          <div className="calc-head" title="Tarik untuk memindahkan"
            onPointerDown={(e) => { if ((e.target as HTMLElement).closest('button')) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y } }}
            onPointerMove={(e) => { const d = drag.current; if (d) setPos({ x: d.px + e.clientX - d.x, y: d.py + e.clientY - d.y }) }}
            onPointerUp={() => { drag.current = null }}>
            <span><CalcIcon aria-hidden size={16} /> Kalkulator</span>
            <button type="button" className="btn icon" onClick={() => { setOpen(false); opener.current?.focus() }} aria-label="Tutup kalkulator"><X aria-hidden size={18} /></button>
          </div>
          <div className="calc-screen" aria-live="polite">
            <span className="calc-expr">{expr ? pretty(expr) : '0'}</span>
            <b className="calc-res">{done && result !== null ? fmt(result) : ' '}</b>
          </div>
          <div className="calc-keys">
            {keys.map(([k, label, kind]) => (
              <button key={k} type="button" className={`calc-key ${kind ?? ''} ${k === '0' ? 'zero' : ''}`} onClick={() => press(k)} aria-label={k === 'DEL' ? 'Hapus satu karakter' : k === 'C' ? 'Kosongkan' : k === '/' ? 'bagi' : k === '*' ? 'kali' : k === '-' ? 'kurang' : k === '+' ? 'tambah' : k === '=' ? 'sama dengan' : k === ',' ? 'koma' : k === '%' ? 'persen' : undefined}>
                {k === 'DEL' ? <Delete aria-hidden size={18} /> : label}
              </button>
            ))}
          </div>
          <button type="button" className="btn small ghost full" onClick={copy} disabled={!done || result === null}>
            {copied ? <><Check aria-hidden size={16} /> Tersalin</> : <><Copy aria-hidden size={16} /> Salin hasil</>}
          </button>
        </div>
      ) : null}
      <button type="button" ref={opener} className="calc-fab" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Tutup kalkulator' : 'Buka kalkulator'} title="Kalkulator">
        <CalcIcon aria-hidden size={22} />
      </button>
    </div>
  )
}
