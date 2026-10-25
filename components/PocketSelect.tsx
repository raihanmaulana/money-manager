import { PocketPicker } from './PocketPicker'
import type { Pocket } from '@/lib/types'

/** Pilihan sumber dana di formulir (kartu bermerek). Tidak tampil kalau belum ada sumber dana. */
export function PocketSelect({ pockets, label = 'Sumber dana', name = 'pocket_id', full = false, defaultValue = '' }: { pockets: Pocket[]; label?: string; name?: string; full?: boolean; defaultValue?: string }) {
  if (!pockets.length) return null
  return (
    <div className={`field${full ? ' full' : ''}`}>
      <span>{label}</span>
      <PocketPicker pockets={pockets} name={name} label={label} defaultValue={defaultValue} />
    </div>
  )
}
