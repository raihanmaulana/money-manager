import test from 'node:test'
import assert from 'node:assert/strict'
import { parseStatementPages, type PItem } from './statement-parse.ts'

const it = (s: string, x: number, y: number, w = s.length * 5): PItem => ({ s, x, y, w })
/** Halaman e-billing kartu BNI sintetis (angka karangan). */
const kartu = (): PItem[][] => [[
  it('BNI', 20, 20), it('BATAS KREDIT', 400, 40), it('9.000.000', 520, 40, 45),
  it('TAGIHAN BULAN INI', 20, 60), it('Tanggal Cetak', 20, 70), it('01-09-2026', 20, 82),
  it('01-08-2026', 20, 100), it('01-08-2026', 60, 100), it('BELANJA TOKO', 120, 100), it('100.000', 340, 100, 45),
  it('05-08-2026', 20, 112), it('05-08-2026', 60, 112), it('PEMBAYARAN TAGIHAN CC', 120, 112), it('50.000 CR', 330, 112, 55),
  it('10-08-2026', 20, 124), it('10-08-2026', 60, 124), it('BNI CARD TO CASH    : 0/06 Rp. 600.000', 120, 124, 200),
  it('TAGIHAN BULAN LALU', 400, 140), it('50.000', 520, 140, 40),
  it('PEMBAYARAN', 400, 150), it('50.000', 520, 150, 40),
  it('PEMBELANJAAN', 400, 160), it('700.000', 520, 160, 40),
  it('PENARIKAN TUNAI', 400, 170), it('0', 520, 170, 10),
  it('BIAYA ADM & BUNGA', 400, 180), it('0', 520, 180, 10),
  it('TAGIHAN BULAN INI', 400, 190), it('100.000', 520, 190, 40),
  it('PEMBAYARAN MINIMUM', 400, 200), it('50.000', 520, 200, 40),
  it('TANGGAL JATUH TEMPO', 400, 210), it('10-09-2026', 520, 210, 50),
]]

test('format tak dikenal ditolak dengan pesan', () => {
  const r = parseStatementPages([[it('Halaman acak', 10, 10)]])
  assert.ok('error' in r)
})

test('kartu BNI: cicilan 0/NN tidak dihitung sebagai tagihan bulan itu', () => {
  const r = parseStatementPages(kartu())
  assert.ok(!('error' in r))
  if ('error' in r) return
  assert.equal(r.type, 'kartu')
  assert.equal(r.period, '2026-09')
  assert.equal(r.txns.length, 2)
  assert.equal(r.total_out, 100_000)
  assert.equal(r.closing, 100_000)
  assert.equal(r.due_on, '2026-09-10')
  assert.deepEqual(r.warnings, [])
})
