'use client'
import { useState } from 'react'
import { setDebtMenu } from '@/lib/debt-actions'
import { useBusyTransition } from './Busy'
import { useToast } from './Toast'

/** Saklar untuk menampilkan atau menyembunyikan menu Hutang Split Bill di sidebar. */
export function DebtMenuToggle({ on }: { on: boolean }) {
  const [pending, start] = useBusyTransition(true)
  const [msg, setMsg] = useState('')
  const toast = useToast()
  const flip = () => start(async () => {
    setMsg('')
    const r = await setDebtMenu(!on)
    if (typeof r === 'string') setMsg(r)
    else toast(on ? 'Menu dimatikan' : 'Menu diaktifkan')
  })
  return (
    <div className="stack">
      <div className="cluster">
        <button type="button" className={`btn small${on ? ' ghost' : ''}`} aria-pressed={on} aria-busy={pending} disabled={pending} onClick={flip}>
          {on ? 'Matikan menu' : 'Aktifkan menu'}
        </button>
      </div>
      {msg ? <p className="form-msg err" role="alert">{msg}</p> : null}
    </div>
  )
}
