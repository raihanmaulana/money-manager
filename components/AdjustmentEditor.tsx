'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Pencil } from 'lucide-react'
import { useBusyTransition } from './Busy'
import { useToast } from './Toast'
import { MoneyInput } from './Fields'
import { DatePicker } from './DatePicker'
import { ThemedSelect } from './ThemedSelect'
import { updateAdjustment } from '@/lib/actions'
import type { PocketAdjustment } from '@/lib/types'

/** Tombol pensil + popup untuk mengubah penyesuaian saldo (tanggal, tambah/kurang, jumlah, catatan). */
export function AdjustmentEditor({ adjustment, pocketName }: { adjustment: PocketAdjustment; pocketName: string }) {
  const [open, setOpen] = useState(false)
  const [dir, setDir] = useState(adjustment.amount < 0 ? 'kurang' : 'tambah')
  const [pending, start] = useBusyTransition(true)
  const toast = useToast()
  const opener = useRef<HTMLButtonElement>(null)
  const card = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setDir(adjustment.amount < 0 ? 'kurang' : 'tambah')
    card.current?.querySelector<HTMLInputElement>('input.money')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.querySelector('.mp-panel, .ts-panel')) { setOpen(false); opener.current?.focus() }
      if (e.key === 'Tab' && card.current) {
        const f = [...card.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([type=hidden]):not([disabled]), select')]
        if (!f.length) return
        const first = f[0], last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, adjustment.amount])

  const save = (fd: FormData) => start(async () => {
    const r = await updateAdjustment(fd)
    if (typeof r === 'string') { toast(r, 'warn'); return }
    toast('Perubahan tersimpan'); setOpen(false)
  })

  return (
    <>
      <button type="button" ref={opener} className="btn icon" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="Ubah penyesuaian ini" title="Ubah penyesuaian"><Pencil aria-hidden size={18} /></button>
      {open ? createPortal(
        <div className="confirm" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="confirm-card edit-card" ref={card} role="dialog" aria-modal="true" aria-labelledby={`ea-${adjustment.id}`}>
            <h2 id={`ea-${adjustment.id}`}>Ubah penyesuaian saldo</h2>
            <p className="hint" style={{ margin: 0 }}>{pocketName}</p>
            <form action={save} className="stack edit-form">
              <input type="hidden" name="id" value={adjustment.id} />
              <input type="hidden" name="dir" value={dir} />
              <div className="form-grid">
                <div className="field"><span>Arah</span>
                  <ThemedSelect label="Arah penyesuaian" value={dir} onChange={setDir} options={[{ value: 'tambah', label: 'Menambah saldo' }, { value: 'kurang', label: 'Mengurangi saldo' }]} />
                </div>
                <label className="field"><span>Jumlah</span><MoneyInput name="amount" label="Jumlah penyesuaian" defaultValue={Math.abs(adjustment.amount)} required /></label>
                <label className="field"><span>Tanggal</span><DatePicker name="adjusted_on" label="Tanggal" defaultValue={adjustment.adjusted_on} inModal /></label>
                <label className="field"><span>Catatan</span><input className="input" name="note" maxLength={80} defaultValue={adjustment.note} /></label>
              </div>
              <div className="confirm-actions">
                <button type="submit" className="btn" disabled={pending} aria-busy={pending}>{pending ? 'Menyimpan…' : 'Simpan perubahan'}</button>
                <button type="button" className="btn ghost" onClick={() => { setOpen(false); opener.current?.focus() }}>Batal</button>
              </div>
            </form>
          </div>
        </div>, document.body) : null}
    </>
  )
}
