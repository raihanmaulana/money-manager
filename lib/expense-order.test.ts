import test from 'node:test'
import assert from 'node:assert/strict'
import { effectiveTime, sortDay } from './expense-order.ts'

const e = (id: string, o: Partial<{ spent_time: string | null; sort_pos: number | null; created_at: string; spent_on: string }> = {}) => ({ id, spent_on: '2026-10-30', spent_time: null, sort_pos: null, created_at: undefined as string | undefined, ...o })
// 2026-10-30 07:00 UTC = 14:00 WIB
const WIB = (hhmm: string, date = '2026-10-30') => new Date(`${date}T${String(Number(hhmm.slice(0, 2)) - 7).padStart(2, '0')}:${hhmm.slice(3)}:00Z`).toISOString()
const ids = (l: { id: string }[]) => l.map((x) => x.id).join(',')

test('urut pagi ke malam dari jam yang diisi, walau dicatat terbalik', () => {
  const l = [e('malam', { spent_time: '20:15:00' }), e('pagi', { spent_time: '07:30:00' }), e('siang', { spent_time: '12:00' })]
  assert.equal(ids(sortDay(l)), 'pagi,siang,malam')
  assert.equal(ids(sortDay(l, 'desc')), 'malam,siang,pagi')
})

test('tanpa jam memakai jam saat dicatat di hari yang sama', () => {
  assert.equal(effectiveTime(e('a', { created_at: WIB('13:05') })), '13:05')
  const l = [e('b', { created_at: WIB('18:00') }), e('a', { created_at: WIB('09:00') }), e('c', { spent_time: '12:00' })]
  assert.equal(ids(sortDay(l)), 'a,c,b')
})

test('dicatat di hari lain tanpa jam ditaruh di akhir hari', () => {
  const l = [e('telat', { created_at: WIB('08:00', '2026-10-31') }), e('ok', { spent_time: '23:00' })]
  assert.equal(ids(sortDay(l)), 'ok,telat')
})

test('urutan manual dipakai, catatan baru tanpa posisi di akhir', () => {
  const l = [e('a', { spent_time: '08:00', sort_pos: 1 }), e('b', { spent_time: '20:00', sort_pos: 0 }), e('baru', { spent_time: '06:00' })]
  assert.equal(ids(sortDay(l)), 'b,a,baru')
})
