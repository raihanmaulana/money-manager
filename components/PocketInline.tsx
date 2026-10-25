'use client'
import { useBusyTransition } from './Busy'
import { useToast } from './Toast'
import type { Pocket } from '@/lib/types'

/** Pilihan sumber dana langsung di baris (menyimpan begitu dipilih). */
export function PocketInline({ table, id, value, pockets, action, label = 'Sumber dana', emptyLabel = 'Tanpa sumber dana' }: {
  table: string; id: string; value?: string | null; pockets: Pocket[]; label?: string; emptyLabel?: string
  action: (table: any, id: string, field: string, value: string) => Promise<void>
}) {
  const [pending, start] = useBusyTransition(true)
  const toast = useToast()
  return (
    <select className="select pocket-inline" aria-label={label} aria-busy={pending} disabled={pending} value={value ?? ''}
      onChange={(e) => { const v = e.target.value; start(async () => { await action(table, id, 'pocket', v); toast('Sumber dana diperbarui') }) }}>
      <option value="">{emptyLabel}</option>
      {pockets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  )
}
