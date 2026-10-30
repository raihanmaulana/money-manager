/**
 * Urutan catatan dalam satu hari. Bawaan: pagi ke malam.
 * - Ada jam → dipakai jam itu.
 * - Tanpa jam → dipakai jam saat dicatat (WIB), asal dicatat di hari yang sama dengan tanggalnya.
 *   Yang dicatat belakangan di hari lain ditaruh di akhir hari.
 * - Setelah digeser manual (sort_pos), urutan manual yang dipakai; catatan baru tanpa posisi ditaruh di akhir.
 */
import type { Expense } from './types.ts'

type K = Pick<Expense, 'id' | 'spent_on' | 'spent_time' | 'sort_pos' | 'created_at'>
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

function createdLocal(iso?: string): { date: string; time: string } | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const p = Object.fromEntries(fmt.formatToParts(d).map((x) => [x.type, x.value]))
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` }
}

export const timeOf = (e: Pick<Expense, 'spent_time'>): string | null => (e.spent_time ? e.spent_time.slice(0, 5) : null)

export function effectiveTime(e: K): string {
  const t = timeOf(e)
  if (t) return t
  const c = createdLocal(e.created_at)
  return c && c.date === e.spent_on ? c.time : '99:99'
}

/** Urutkan catatan dari satu hari. dir 'asc' = pagi ke malam (bawaan), 'desc' = sebaliknya. */
export function sortDay<T extends K>(list: T[], dir: 'asc' | 'desc' = 'asc'): T[] {
  const key = (e: T) => `${effectiveTime(e)}|${e.created_at ?? ''}|${e.id}`
  const byKey = (a: T, b: T) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0)
  const manual = list.some((e) => e.sort_pos != null)
  const asc = manual
    ? [...list.filter((e) => e.sort_pos != null).sort((a, b) => (a.sort_pos! - b.sort_pos!) || byKey(a, b)), ...list.filter((e) => e.sort_pos == null).sort(byKey)]
    : [...list].sort(byKey)
  return dir === 'asc' ? asc : asc.reverse()
}
