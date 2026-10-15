'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LogOut } from 'lucide-react'
import { useBusyTransition } from './Busy'
import { signOut } from '@/lib/auth-actions'

export function LogoutButton({ className = 'btn ghost small', icon = false }: { className?: string; icon?: boolean }) {
  const [open, setOpen] = useState(false)
  const [pending, start] = useBusyTransition()
  const trigger = useRef<HTMLButtonElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const ok = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); trigger.current?.focus() }
      if (e.key === 'Tab') {
        const first = cancel.current, last = ok.current
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const confirm = () => { setOpen(false); start(() => signOut()) }

  return (
    <>
      <button type="button" ref={trigger} className={className} onClick={() => setOpen(true)} disabled={pending} aria-haspopup="dialog">
        {icon ? <LogOut aria-hidden /> : null} Keluar
      </button>
      {open ? createPortal(
        <div className="confirm" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="out-t" aria-describedby="out-d">
            <span className="confirm-icon" aria-hidden><LogOut /></span>
            <h2 id="out-t">Keluar dari akun?</h2>
            <p id="out-d">Data tetap tersimpan. Anda bisa masuk lagi kapan saja.</p>
            <div className="confirm-actions">
              <button type="button" ref={cancel} className="btn ghost" onClick={() => { setOpen(false); trigger.current?.focus() }}>Batal</button>
              <button type="button" ref={ok} className="btn" onClick={confirm}><LogOut aria-hidden /> Keluar</button>
            </div>
          </div>
        </div>, document.body) : null}
    </>
  )
}
