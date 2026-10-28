'use client'
import { useEffect, useState } from 'react'
import { Building2, X } from 'lucide-react'

/**
 * Kartu kecil "Kantor Arus" di Ringkasan: status kantor dan satu baris aktivitas karyawan.
 * Ringan: hanya teks. Kantor 3D (web kantor-ai) baru dimuat di dalam lembar layar penuh
 * setelah kartu diketuk, supaya Arus di PWA/HP tetap cepat. Bisa disembunyikan di Pengaturan.
 */
export const KANTOR_HIDE_KEY = 'arus.kantor.hide'
const LABEL = { aman: 'Aman', waspada: 'Waspada', kritis: 'Kritis' } as const

export function KantorCard({ url, level, line }: { url: string; level: 'aman' | 'waspada' | 'kritis'; line: string }) {
  const [hidden, setHidden] = useState(true)
  const [open, setOpen] = useState(false)
  useEffect(() => { try { setHidden(localStorage.getItem(KANTOR_HIDE_KEY) === '1') } catch { setHidden(false) } }, [])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])
  if (hidden) return null
  return (
    <>
      <button type="button" className={`tile s12 kantor-card ${level}`} onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span className="badge" aria-hidden><Building2 size={18} strokeWidth={2.3} /></span>
        <span className="grow">
          <span className="kc-title">Kantor · <b>{LABEL[level]}</b></span>
          <span className="kc-line">{line}</span>
        </span>
        <span className="kc-go">Lihat kantor →</span>
      </button>
      {open ? (
        <div className="kantor-sheet" role="dialog" aria-modal="true" aria-label="Kantor Arus">
          <div className="ks-bar">
            <b>Kantor Arus</b>
            <a className="link" href={url} target="_blank" rel="noopener">Buka di tab baru</a>
            <button type="button" className="btn icon" aria-label="Tutup kantor" onClick={() => setOpen(false)}><X size={18} /></button>
          </div>
          <iframe src={url} title="Kantor Arus" allow="fullscreen" />
        </div>
      ) : null}
    </>
  )
}

/** Saklar di Pengaturan: tampilkan / sembunyikan kartu kantor (disimpan di perangkat ini). */
export function KantorToggle() {
  const [hidden, setHidden] = useState<boolean | null>(null)
  useEffect(() => { try { setHidden(localStorage.getItem(KANTOR_HIDE_KEY) === '1') } catch { setHidden(false) } }, [])
  const flip = () => {
    const next = !hidden
    try { if (next) localStorage.setItem(KANTOR_HIDE_KEY, '1'); else localStorage.removeItem(KANTOR_HIDE_KEY) } catch { /* penyimpanan tidak tersedia */ }
    setHidden(next)
  }
  if (hidden === null) return null
  return (
    <div className="cluster">
      <button type="button" className={`btn small${hidden ? '' : ' ghost'}`} aria-pressed={!hidden} onClick={flip}>{hidden ? 'Tampilkan kartu kantor' : 'Sembunyikan kartu kantor'}</button>
    </div>
  )
}
