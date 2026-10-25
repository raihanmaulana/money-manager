import type { DebtEntry, DebtPayment } from './types.ts'

export type DebtSummary = {
  /** total bagian yang ditagihkan ke dia (saya yang bayar) */
  owedToMe: number
  /** total bagian yang ditagihkan ke saya (dia yang bayar) */
  owedByMe: number
  paidToMe: number
  paidByMe: number
  /** > 0: dia masih harus bayar ke saya. < 0: saya yang harus bayar. 0: lunas. */
  net: number
  /** selisih sebelum pelunasan */
  gross: number
}

export function debtSummary(entries: Pick<DebtEntry, 'paid_by' | 'share'>[], payments: Pick<DebtPayment, 'direction' | 'amount'>[]): DebtSummary {
  const owedToMe = entries.filter((e) => e.paid_by === 'me').reduce((t, e) => t + e.share, 0)
  const owedByMe = entries.filter((e) => e.paid_by === 'them').reduce((t, e) => t + e.share, 0)
  const paidToMe = payments.filter((p) => p.direction === 'them_to_me').reduce((t, p) => t + p.amount, 0)
  const paidByMe = payments.filter((p) => p.direction === 'me_to_them').reduce((t, p) => t + p.amount, 0)
  const gross = owedToMe - owedByMe
  return { owedToMe, owedByMe, paidToMe, paidByMe, gross, net: gross - paidToMe + paidByMe }
}

/** Bagian ditagih menurut pilihan cepat. */
export type ShareMode = 'penuh' | 'bagi2' | 'gratis' | 'sendiri'
export function shareOf(mode: ShareMode, amount: number, custom = 0) {
  if (mode === 'penuh') return amount
  if (mode === 'bagi2') return Math.round(amount / 2)
  if (mode === 'gratis') return 0
  return Math.max(0, Math.round(custom))
}

const BULAN = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember']
const BULAN_PENDEK: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, jun: 6, jul: 7, agu: 8, agt: 8, ags: 8, sep: 9, okt: 10, nov: 11, des: 12 }
const iso = (y: number, m: number, d: number) => {
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null
}

/** Tanggal dari sel Excel: Date, "16 Juli 2026", "2026-07-16", "16/07/2026". null kalau tidak terbaca. */
export function parseDebtDate(v: unknown): string | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return iso(v.getUTCFullYear(), v.getUTCMonth() + 1, v.getUTCDate())
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return null
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return iso(+m[1], +m[2], +m[3])
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (m) return iso(+m[3], +m[2], +m[1])
  m = s.match(/^(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})$/)
  if (m) {
    const idx = BULAN.indexOf(m[2])
    const mon = idx >= 0 ? idx + 1 : BULAN_PENDEK[m[2].slice(0, 3)]
    return mon ? iso(+m[3], mon, +m[1]) : null
  }
  return null
}

/** Angka dari sel: 150000, "Rp 150.000", "1.000.000,50" (desimal dibuang). */
export function parseDebtMoney(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? Math.round(v) : null
  const s = String(v ?? '').trim().toLowerCase()
  if (!s || s === '-') return null
  const digits = s.replace(/rp/g, '').replace(/,\d{1,2}$/, '').replace(/[^\d]/g, '')
  return digits ? Number(digits) : null
}

/** Bagian ditagih dari sel: angka, atau "penuh" / "dibagi 2" / "gratis" / "-" (= 0). Kosong = pakai default (bagi 2 untuk split, penuh bila tak ada isi). */
export function parseDebtShare(v: unknown, amount: number): number | null {
  const s = String(v ?? '').trim().toLowerCase()
  if (!s) return null
  if (s === '-' || s.startsWith('gratis') || s.startsWith('tidak') || s === '0') return 0
  if (s.startsWith('penuh') || s === 'full' || s === '100%') return amount
  if (/(bagi|dibagi|split|patung|50%)/.test(s)) return Math.round(amount / 2)
  return parseDebtMoney(v)
}

export type DebtImportRow = { entry_on: string; title: string; amount: number; share: number; note: string; paid_by: 'me' | 'them' }
export type DebtImportResult = { rows: DebtImportRow[]; errors: string[] }

/** Baris tabel (array of array) → baris impor. Kolom: Tanggal, Kegiatan, Harga, Bagian ditagih, Keterangan, Dibayar oleh. */
export function parseDebtSheet(data: unknown[][], personName: string): DebtImportResult {
  const rows: DebtImportRow[] = []
  const errors: string[] = []
  const first = (data[0] ?? []).map((c) => String(c ?? '').trim().toLowerCase())
  const hasHeader = first.some((c) => c.includes('tanggal')) || first.some((c) => c.includes('kegiatan'))
  const body = hasHeader ? data.slice(1) : data
  const person = personName.trim().toLowerCase()
  body.forEach((r, i) => {
    const n = i + (hasHeader ? 2 : 1)
    if (!r || r.every((c) => String(c ?? '').trim() === '')) return
    const [tgl, title, harga, bagian, ket, oleh] = r
    const t = String(title ?? '').trim()
    const d = parseDebtDate(tgl)
    const amount = parseDebtMoney(harga)
    if (!t) return void errors.push(`Baris ${n}: kegiatan kosong.`)
    if (!d) return void errors.push(`Baris ${n} (${t}): tanggal tidak terbaca. Pakai format 16 Juli 2026 atau 2026-07-16.`)
    if (amount == null) return void errors.push(`Baris ${n} (${t}): harga tidak terbaca.`)
    const sh = parseDebtShare(bagian, amount)
    const share = Math.min(sh ?? amount, amount)
    const who = String(oleh ?? '').trim().toLowerCase()
    const paid_by: 'me' | 'them' = !who || who === 'saya' || who === 'aku' || who === 'me' ? 'me' : who === person || who === 'dia' || who === 'them' ? 'them' : 'me'
    if (who && paid_by === 'me' && !['saya', 'aku', 'me'].includes(who)) return void errors.push(`Baris ${n} (${t}): "Dibayar oleh" harus "Saya" atau "${personName}".`)
    rows.push({ entry_on: d, title: t.slice(0, 80), amount, share, note: String(ket ?? '').trim().slice(0, 120), paid_by })
  })
  return { rows, errors }
}

/** Kalimat hasil akhir. net > 0: dia bayar ke saya. */
export function debtSentence(net: number, name: string, you = 'Anda') {
  if (net > 0) return { tone: 'pos' as const, who: `${name} bayar ke ${you}`, amount: net }
  if (net < 0) return { tone: 'neg' as const, who: `${you} bayar ke ${name}`, amount: -net }
  return { tone: 'ok' as const, who: 'Lunas, tidak ada yang perlu dibayar', amount: 0 }
}

/** Label bagian ditagih untuk keterangan baris. */
export function shareLabel(amount: number, share: number) {
  if (share === 0) return 'Gratis'
  if (share === amount) return 'Penuh'
  if (share === Math.round(amount / 2)) return 'Dibagi 2'
  return 'Sebagian'
}
