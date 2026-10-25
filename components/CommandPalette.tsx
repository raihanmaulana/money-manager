'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { BookOpen, Cpu, CornerDownLeft, ListChecks, LogIn, Search, UserPlus } from 'lucide-react'
import { ACTIONS, NAV } from './nav-items'
import { useNav } from './NavPrefs'

type Entry = { href: string; label: string; group: string; Icon: (typeof NAV)[number]['Icon']; hint?: string; download?: boolean }
export type PaletteMode = 'app' | 'site'

const SITE: Entry[] = [
  { href: '#fitur', label: 'Fitur', group: 'Di halaman ini', Icon: ListChecks, hint: 'Modul dan kemampuannya' },
  { href: '#cara-kerja', label: 'Cara kerja', group: 'Di halaman ini', Icon: BookOpen, hint: 'Dari rencana sampai laporan' },
  { href: '#teknologi', label: 'Teknologi', group: 'Di halaman ini', Icon: Cpu, hint: 'Arsitektur dan keamanan data' },
  { href: '/masuk', label: 'Masuk', group: 'Akun', Icon: LogIn },
  { href: '/masuk?mode=daftar', label: 'Buat akun', group: 'Akun', Icon: UserPlus },
]
const appEntries = (nav: typeof NAV): Entry[] => [
  ...nav.map((n) => ({ ...n, group: 'Halaman' })),
  ...ACTIONS.map((a) => ({ ...a, group: 'Tindakan' })),
]

/** Palet perintah (Ctrl/⌘ + K): lompat ke halaman atau unduh data tanpa menyentuh mouse. */
export function CommandPaletteTrigger({ mode = 'app', className = '' }: { mode?: PaletteMode; className?: string }) {
  const [open, setOpen] = useState(false)
  const [mac, setMac] = useState(false)
  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform))
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return (
    <>
      <button type="button" className={`cmdk-trigger ${className}`} onClick={() => setOpen(true)} aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K">
        <Search aria-hidden />
        <span>{mode === 'site' ? 'Cari bagian halaman…' : 'Cari…'}</span>
        <kbd aria-hidden>{mac ? '⌘' : 'Ctrl'} K</kbd>
      </button>
      {open ? <Palette mode={mode} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

function Palette({ mode, onClose }: { mode: PaletteMode; onClose: () => void }) {
  const router = useRouter()
  const navItems = useNav()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)

  const entries = useMemo<Entry[]>(() => {
    const all = mode === 'site' ? SITE : appEntries(navItems)
    const t = q.trim().toLowerCase()
    return t ? all.filter((e) => `${e.label} ${e.hint ?? ''}`.toLowerCase().includes(t)) : all
  }, [q, mode, navItems])

  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => { setSel(0) }, [q])
  useEffect(() => { list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' }) }, [sel])

  const go = (e: Entry) => {
    onClose()
    if (e.download) window.location.assign(e.href)
    else router.push(e.href)
  }
  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key === 'Escape') { ev.preventDefault(); onClose() }
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); setSel((i) => Math.min(entries.length - 1, i + 1)) }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setSel((i) => Math.max(0, i - 1)) }
    else if (ev.key === 'Enter' && entries[sel]) { ev.preventDefault(); go(entries[sel]) }
  }

  let lastGroup = ''
  return createPortal(
    <div className="cmdk" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cmdk-panel" role="dialog" aria-modal="true" aria-label="Palet perintah" onKeyDown={onKey}>
        <div className="cmdk-input">
          <Search aria-hidden size={18} />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={mode === 'site' ? 'Ketik nama bagian atau tindakan' : 'Ketik nama halaman atau tindakan'}
            role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-activedescendant={entries[sel] ? `cmdk-${sel}` : undefined} aria-label="Cari" />
        </div>
        <ul className="cmdk-list" id="cmdk-list" role="listbox" ref={list}>
          {entries.map((e, i) => {
            const head = e.group !== lastGroup ? e.group : null
            lastGroup = e.group
            return (
              <li key={`${e.group}-${e.href}`} role="presentation">
                {head ? <p className="label cmdk-group">{head}</p> : null}
                <div id={`cmdk-${i}`} role="option" aria-selected={i === sel} className="cmdk-item" onMouseMove={() => setSel(i)} onClick={() => go(e)}>
                  <e.Icon aria-hidden />
                  <span>{e.label}</span>
                  {e.hint ? <span className="hint">{e.hint}</span> : null}
                </div>
              </li>
            )
          })}
        </ul>
        {entries.length === 0 ? <p className="cmdk-empty" role="status">Tidak ada hasil untuk “{q}”.</p> : null}
        <div className="cmdk-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> pilih</span><span><CornerDownLeft aria-hidden size={12} style={{ verticalAlign: '-1px' }} /> buka</span><span><kbd>Esc</kbd> tutup</span></div>
      </div>
    </div>,
    document.body,
  )
}
