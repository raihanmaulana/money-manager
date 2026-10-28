/**
 * Pembaca catatan cepat dari satu kalimat, mis. "Makan siang 20 ribu" atau "kopi 25k gopay kemarin".
 * Aturan tetap (tanpa AI): nominal, tanggal, sumber dana dikenali, sisanya jadi nama catatan.
 */
export type QuickPocket = { id: string; name: string; kind: string }
export type Quick = { note: string; amount: number; date: string; pocket: QuickPocket | null; pocketHint: string }
export type QuickResult = ({ ok: true } & Quick) | { ok: false; error: string }

const UNIT: Record<string, number> = { juta: 1_000_000, jt: 1_000_000, ribu: 1_000, rb: 1_000, k: 1_000 }
const GENERIC = new Set(['kartu', 'kredit', 'rekening', 'bank', 'dompet', 'tabungan', 'digital', 'akun', 'saldo'])
const PREP = '(?:pakai|pake|pk|via|lewat|dari|dengan|dgn|di|ke|pada)'
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const shift = (iso: string, days: number) => {
  const d = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10) + days))
  return d.toISOString().slice(0, 10)
}
const validDate = (y: number, m: number, d: number) => {
  const t = new Date(Date.UTC(y, m - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}
const iso3 = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

export function parseQuick(input: string, pockets: QuickPocket[], today: string): QuickResult {
  let s = ` ${input.trim().replace(/\s+/g, ' ')} `
  if (!input.trim()) return { ok: false, error: 'Pesannya kosong.' }
  let date = today

  // ── Tanggal ──
  const cut = (re: RegExp, fn: (m: RegExpMatchArray) => string | null): boolean => {
    const m = s.match(re)
    if (!m || m.index == null) return false
    const r = fn(m)
    if (!r) return false
    date = r
    s = s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)
    return true
  }
  const ty = +today.slice(0, 4), tm = +today.slice(5, 7), td = +today.slice(8, 10)
  cut(/\b(\d{1,2})\s*hari\s*(?:yang\s*)?lalu\b/i, (m) => shift(today, -Number(m[1]))) ||
    cut(/\bkemarin\s*lusa\b/i, () => shift(today, -2)) ||
    cut(/\bkemarin\b/i, () => shift(today, -1)) ||
    cut(/\bhari\s*ini\b/i, () => today) ||
    cut(/\b(?:tgl|tanggal)\.?\s*(\d{1,2})\b/i, (m) => {
      const d = Number(m[1]); const [y, mo] = d > td ? (tm === 1 ? [ty - 1, 12] : [ty, tm - 1]) : [ty, tm]
      return validDate(y, mo, d) ? iso3(y, mo, d) : null
    }) ||
    cut(/(?<![\d.,])(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?(?![\d.,])/, (m) => {
      const d = Number(m[1]), mo = Number(m[2]); let y = m[3] ? Number(m[3]) : ty
      if (m[3] && y < 100) y += 2000
      if (!m[3] && mo > tm) y -= 1 // tanggal bulan depan di tahun ini berarti tahun lalu
      return validDate(y, mo, d) ? iso3(y, mo, d) : null
    })
  if (date > today) date = today

  // ── Nominal ──
  const re = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)*)\s*(juta|jt|ribu|rb|k)?(?![a-z0-9])/gi
  const cands: { start: number; end: number; value: number; unit: boolean }[] = []
  for (const m of s.matchAll(re)) {
    const raw = m[1], unit = m[2]?.toLowerCase()
    let value: number
    if (unit) {
      const n = parseFloat(raw.replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.'))
      if (!Number.isFinite(n)) continue
      value = Math.round(n * UNIT[unit])
    } else if (/^\d{1,3}(?:[.,]\d{3})+$/.test(raw)) value = Number(raw.replace(/[.,]/g, ''))
    else if (/^\d+$/.test(raw) && raw.length >= 4) value = Number(raw)
    else continue // angka kecil tanpa satuan dianggap jumlah barang
    cands.push({ start: m.index!, end: m.index! + m[0].length, value, unit: !!unit })
  }
  const pick = [...cands].reverse().find((c) => c.unit) ?? cands[cands.length - 1]
  if (!pick) return { ok: false, error: 'Nominalnya belum terbaca. Tulis misalnya 20rb, 20 ribu, 20k, 20.000, atau 1,5 jt.' }
  if (pick.value <= 0 || pick.value > 100_000_000_000) return { ok: false, error: 'Nominalnya tidak masuk akal.' }
  s = s.slice(0, pick.start) + ' ' + s.slice(pick.end)

  // ── Sumber dana ──
  let pocket: QuickPocket | null = null, pocketHint = ''
  const strip = (name: string) => { s = s.replace(new RegExp(`(?:\\b${PREP}\\s+)?(?<![\\w])${esc(name).replace(/\s+/g, '\\s+')}(?![\\w])`, 'i'), ' ') }
  const full = pockets.filter((p) => new RegExp(`(?<![\\w])${esc(p.name.trim()).replace(/\s+/g, '\\s+')}(?![\\w])`, 'i').test(s)).sort((a, b) => b.name.length - a.name.length)
  if (full.length && (full.length === 1 || full[0].name.length > full[1].name.length)) { pocket = full[0]; strip(pocket.name) }
  else if (full.length) pocketHint = `Nama sumber dana ambigu: ${full.map((p) => p.name).join(', ')}.`
  else {
    const hits = new Map<string, { p: QuickPocket; tok: string }>()
    for (const p of pockets) for (const tok of p.name.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 3 && !GENERIC.has(t))) {
      if (new RegExp(`(?<![\\w])${esc(tok)}(?![\\w])`, 'i').test(s)) hits.set(p.id, { p, tok })
    }
    if (hits.size === 1) { const h = [...hits.values()][0]; pocket = h.p; strip(h.tok) }
    else if (hits.size > 1) pocketHint = `"${[...hits.values()][0].tok}" cocok dengan beberapa sumber dana: ${[...hits.values()].map((h) => h.p.name).join(', ')}. Tulis nama lengkapnya.`
    else if (/(?<![\w])(tunai|cash)(?![\w])/i.test(s)) {
      const cash = pockets.filter((p) => p.kind === 'tunai')
      if (cash.length === 1) { pocket = cash[0]; strip(s.match(/(?<![\w])(tunai|cash)(?![\w])/i)![0]) }
    }
  }

  // ── Nama catatan ──
  let note = s.replace(/\b(?:rp|rupiah|sebesar|seharga|sekitar|tadi|barusan)\b\.?/gi, ' ').replace(/[,;:]+/g, ' ').replace(/\s+/g, ' ').trim()
  note = note.replace(new RegExp(`^(?:${PREP}\\s+)+`, 'i'), '').replace(new RegExp(`(?:\\s+${PREP})+$`, 'i'), '').trim()
  note = note.slice(0, 120)
  if (!note) note = 'Pengeluaran'
  note = note[0].toUpperCase() + note.slice(1)
  return { ok: true, note, amount: pick.value, date, pocket, pocketHint }
}
