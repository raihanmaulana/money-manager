'use client'
import { useBusyTransition } from './Busy'
import { useToast } from './Toast'

/** Tanggal mulai kartu kredit dihitung (menyimpan begitu tanggal dipilih). */
export function SinceField({ id, value, action, label }: { id: string; value: string; action: (id: string, field: any, value: string) => Promise<void>; label: string }) {
  const [pending, start] = useBusyTransition(true)
  const toast = useToast()
  return (
    <input className="input pocket-inline" type="date" aria-label={label} aria-busy={pending} disabled={pending} defaultValue={value}
      onChange={(e) => { const v = e.target.value; if (!v) return; start(async () => { await action(id, 'credit_since', v); toast('Tanggal diperbarui') }) }} />
  )
}
