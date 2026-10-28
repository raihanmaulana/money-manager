import test from 'node:test'
import assert from 'node:assert/strict'
import { parseQuick, type QuickPocket } from './quick-parse.ts'

const P: QuickPocket[] = [
  { id: 'bca', name: 'BCA', kind: 'bank' }, { id: 'gopay', name: 'GoPay', kind: 'ewallet' }, { id: 'tunai', name: 'Dompet', kind: 'tunai' },
  { id: 'bri', name: 'BRI', kind: 'bank' }, { id: 'bricc', name: 'BRI CC', kind: 'kredit' },
]
const T = '2026-10-29'
const ok = (s: string) => { const r = parseQuick(s, P, T); assert.ok(r.ok, `gagal: ${s}`); return r as Extract<ReturnType<typeof parseQuick>, { ok: true }> }

test('contoh dasar: nama lalu nominal', () => {
  const r = ok('Makan siang 20 ribu')
  assert.deepEqual([r.note, r.amount, r.date, r.pocket], ['Makan siang', 20000, T, null])
  assert.equal(ok('makan siang 20rb').amount, 20000)
  assert.equal(ok('makan siang 20k').amount, 20000)
  assert.equal(ok('makan siang 20.000').amount, 20000)
  assert.equal(ok('makan siang Rp20.000').amount, 20000)
  assert.equal(ok('makan siang 25000').amount, 25000)
})

test('nominal di depan dan nominal desimal', () => {
  const a = ok('20rb makan siang'); assert.deepEqual([a.note, a.amount], ['Makan siang', 20000])
  assert.equal(ok('laptop 1,5 jt').amount, 1_500_000)
  assert.equal(ok('laptop 1.5jt').amount, 1_500_000)
  assert.equal(ok('servis 2 juta').amount, 2_000_000)
})

test('jumlah barang dan satuan bukan nominal', () => {
  const a = ok('beli 2 galon 44rb'); assert.deepEqual([a.note, a.amount], ['Beli 2 galon', 44000])
  const b = ok('beras 5kg 70rb'); assert.deepEqual([b.note, b.amount], ['Beras 5kg', 70000])
})

test('tanpa nominal ditolak dengan petunjuk', () => {
  assert.equal(parseQuick('kopi', P, T).ok, false)
  assert.equal(parseQuick('kopi 25', P, T).ok, false)
})

test('tanggal: kemarin, tgl, dd/mm, n hari lalu', () => {
  assert.equal(ok('bensin 50rb kemarin').date, '2026-10-28')
  assert.equal(ok('bensin 50rb kemarin').note, 'Bensin')
  assert.equal(ok('tgl 15 parkir 5rb').date, '2026-10-15')
  assert.equal(ok('tgl 30 parkir 5rb').date, '2026-09-30')
  assert.equal(ok('parkir 5rb 25/10').date, '2026-10-25')
  assert.equal(ok('2 hari lalu makan 30rb').date, '2026-10-27')
  assert.equal(ok('2 hari lalu makan 30rb').amount, 30000)
})

test('sumber dana: nama, kata depan, tunai, dan ambigu', () => {
  const a = ok('kopi 25k gopay'); assert.deepEqual([a.note, a.pocket?.id], ['Kopi', 'gopay'])
  const b = ok('kopi 25k pakai BCA'); assert.deepEqual([b.note, b.pocket?.id], ['Kopi', 'bca'])
  assert.equal(ok('bensin 50rb tunai').pocket?.id, 'tunai')
  assert.equal(ok('makan 20rb bri').pocket?.id, 'bri')
  assert.equal(ok('makan 20rb bri cc').pocket?.id, 'bricc')
})
