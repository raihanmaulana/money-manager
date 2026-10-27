import test from 'node:test'
import assert from 'node:assert/strict'
import { reconcile, type Movement, type RecTxn } from './reconcile.ts'

const t = (id: string, txn_on: string, direction: 'in' | 'out', amount: number): RecTxn => ({ id, txn_on, kind: '', description: id, direction, amount })
const m = (id: string, date: string | null, direction: 'in' | 'out', amount: number, ym = (date ?? '2026-09').slice(0, 7)): Movement => ({ id, src: 'catatan', date, ym, direction, amount, label: id })

test('nominal, arah, dan tanggal berdekatan dicocokkan', () => {
  const r = reconcile([t('a', '2026-09-10', 'out', 16000)], [m('x', '2026-09-11', 'out', 16000)])
  assert.equal(r.matched.length, 1)
  assert.equal(r.bankOnly.length, 0)
  assert.equal(r.appOnly.length, 0)
})

test('selisih tanggal lewat batas atau arah beda tidak cocok', () => {
  const r = reconcile([t('a', '2026-09-10', 'out', 16000), t('b', '2026-09-10', 'in', 5000)], [m('x', '2026-09-20', 'out', 16000), m('y', '2026-09-10', 'out', 5000)])
  assert.equal(r.matched.length, 0)
  assert.equal(r.bankOnly.length, 2)
  assert.equal(r.appOnly.length, 2)
})

test('dua transaksi kembar dipasangkan satu-satu dengan yang terdekat', () => {
  const r = reconcile([t('a', '2026-09-10', 'out', 6000), t('b', '2026-09-12', 'out', 6000)], [m('x', '2026-09-12', 'out', 6000)])
  assert.equal(r.matched.length, 1)
  assert.equal(r.matched[0].txn.id, 'b') // x tepat di tanggal b, jadi dipasangkan dengan b
  assert.equal(r.bankOnly.length, 1)
})

test('pemasukan tanpa tanggal dicocokkan lewat bulan dan nominal', () => {
  const r = reconcile([t('gaji', '2026-09-25', 'in', 6500000)], [m('g', null, 'in', 6500000, '2026-09')])
  assert.equal(r.matched.length, 1)
  const r2 = reconcile([t('gaji', '2026-10-01', 'in', 6500000)], [m('g', null, 'in', 6500000, '2026-09')])
  assert.equal(r2.matched.length, 0)
})
