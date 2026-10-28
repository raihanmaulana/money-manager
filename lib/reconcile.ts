/**
 * Rekonsiliasi: mencocokkan transaksi hasil baca e-statement dengan gerakan uang di aplikasi
 * (catatan, pembayaran tagihan, pindah dana, pelunasan hutang, pemasukan) untuk satu sumber dana.
 * Murni dan tanpa database supaya mudah diuji.
 */
export type RecTxn = { id: string; txn_on: string; kind: string; description: string; direction: 'in' | 'out'; amount: number }
export type Movement = {
  id: string
  src: 'catatan' | 'tagihan' | 'pindah' | 'hutang' | 'pemasukan' | 'kartu' | 'cashback'
  /** null untuk pemasukan, karena hanya tercatat per bulan */
  date: string | null
  ym: string
  direction: 'in' | 'out'
  amount: number
  label: string
}
export type RecResult = {
  matched: { txn: RecTxn; move: Movement }[]
  bankOnly: RecTxn[]
  appOnly: Movement[]
}

const day = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) / 86_400_000

/** Satu-satu: tiap transaksi bank dipasangkan dengan paling banyak satu catatan aplikasi (nominal sama, arah sama, tanggal terdekat dalam `window` hari). */
export function reconcile(txns: RecTxn[], moves: Movement[], window = 3): RecResult {
  const left = [...moves]
  const matched: RecResult['matched'] = []
  const take = (m: Movement) => left.splice(left.indexOf(m), 1)
  // Semua pasangan yang mungkin, yang tanggalnya paling dekat didahulukan supaya baris kembar tidak tertukar
  const pairs: { t: RecTxn; m: Movement; d: number }[] = []
  for (const t of txns) for (const m of moves) {
    if (!m.date || m.direction !== t.direction || m.amount !== t.amount) continue
    const d = Math.abs(day(m.date) - day(t.txn_on))
    if (d <= window) pairs.push({ t, m, d })
  }
  pairs.sort((x, y) => x.d - y.d || x.t.txn_on.localeCompare(y.t.txn_on))
  const usedT = new Set<RecTxn>()
  for (const { t, m, d: _d } of pairs) {
    if (usedT.has(t) || !left.includes(m)) continue
    usedT.add(t); matched.push({ txn: t, move: m }); take(m)
  }
  const rest = txns.filter((t) => !usedT.has(t)).sort((a, b) => a.txn_on.localeCompare(b.txn_on))
  // Pemasukan tanpa tanggal: cukup sama bulan dan nominalnya
  const bankOnly: RecTxn[] = []
  for (const t of rest) {
    const m = left.find((x) => !x.date && x.direction === t.direction && x.amount === t.amount && x.ym === t.txn_on.slice(0, 7))
    if (m) { matched.push({ txn: t, move: m }); take(m) } else bankOnly.push(t)
  }
  return { matched, bankOnly, appOnly: left }
}
