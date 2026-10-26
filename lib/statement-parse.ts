/**
 * Pembaca e-statement dari teks PDF (posisi tiap potongan teks). Dijalankan di browser.
 * Format yang dikenali: BNI Mutasi Rekening (mobile banking) dan BNI e-billing Kartu Kredit.
 */
export type PItem = { s: string; x: number; y: number; w: number } // y dihitung dari atas halaman
export type ParsedTxn = { txn_on: string; description: string; kind: string; direction: 'in' | 'out'; amount: number; balance: number | null }
export type ParsedStatement = {
  bank: string; type: 'rekening' | 'kartu'; label: string; account: string; period: string
  opening: number; total_in: number; total_out: number; closing: number
  min_payment: number; due_on: string | null; note: string
  txns: ParsedTxn[]; warnings: string[]
}
export type ParseResult = ParsedStatement | { error: string }

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, agt: 8, ags: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 }
const digits = (s: string) => Number(s.replace(/[^\d]/g, '')) || 0
const pad = (n: number) => String(n).padStart(2, '0')
const rpf = (n: number) => 'Rp' + n.toLocaleString('id-ID')
const right = (i: PItem) => i.x + i.w

/** "02 Sep 2026" → "2026-09-02" */
function dateLong(s: string): string | null {
  const m = s.trim().match(/^(\d{1,2})\s+([A-Za-z]{3,9})\.?\s+(\d{4})$/)
  if (!m) return null
  const mon = MONTHS[m[2].slice(0, 3).toLowerCase()]
  return mon ? `${m[3]}-${pad(mon)}-${pad(+m[1])}` : null
}
/** "20-09-2026" → "2026-09-20" */
function dateDash(s: string): string | null {
  const m = s.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null
}

function rowsOf(items: PItem[]): PItem[][] {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x)
  const rows: PItem[][] = []
  for (const it of sorted) {
    const last = rows[rows.length - 1]
    if (last && Math.abs(last[0].y - it.y) <= 1.5) last.push(it)
    else rows.push([it])
  }
  return rows.map((r) => r.sort((a, b) => a.x - b.x))
}

// ── BNI Mutasi Rekening ──────────────────────────────────────────────

function parseBniMutasi(pages: PItem[][]): ParseResult {
  const all = pages.flat()
  const find = (re: RegExp) => all.find((i) => re.test(i.s))
  const per = find(/^Periode:/)?.s.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (!per) return { error: 'Periode di PDF tidak terbaca.' }
  const mon = MONTHS[per[3].slice(0, 3).toLowerCase()]
  if (!mon) return { error: 'Bulan periode tidak dikenali.' }
  const period = `${per[4]}-${pad(mon)}`
  const acc = find(/^[A-Z ]+ - \d{6,}$/)?.s ?? ''
  const account = acc.match(/(\d{6,})$/)?.[1] ?? ''
  const label = acc ? `BNI ${acc.replace(/\s*-\s*\d+$/, '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}` : 'BNI'

  // Ringkasan: empat label berurutan, nilainya di baris di bawahnya
  const labels: Record<string, PItem | undefined> = { opening: find(/^Saldo Awal$/), in: find(/^Total Pemasukan$/), out: find(/^Total Pengeluaran$/), closing: undefined }
  const sums = all.filter((i) => /^Saldo Akhir$/.test(i.s))
  labels.closing = sums.find((i) => i.y < 200) ?? sums[0]
  const headerLabel = labels.opening
  if (!headerLabel || !labels.in || !labels.out || !labels.closing) return { error: 'Ringkasan saldo di PDF tidak terbaca.' }
  const valueFor = (l: PItem) => {
    const c = l.x + l.w / 2
    return all.filter((i) => i.y > l.y && i.y < l.y + 30 && Math.abs(i.x + i.w / 2 - c) < 45 && /^[+-]?[\d,]+$/.test(i.s))[0]
  }
  const vals = { opening: valueFor(labels.opening!), in: valueFor(labels.in!), out: valueFor(labels.out!), closing: valueFor(labels.closing!) }
  if (!vals.opening || !vals.in || !vals.out || !vals.closing) return { error: 'Angka ringkasan saldo tidak terbaca.' }
  const opening = digits(vals.opening.s), total_in = digits(vals.in.s), total_out = digits(vals.out.s), closing = digits(vals.closing.s)

  const txns: ParsedTxn[] = []
  let cur: { on: string; type: string; desc: string[]; amount: number | null; sign: 1 | -1; balance: number | null } | null = null
  const flush = () => {
    if (cur && cur.amount != null) txns.push({ txn_on: cur.on, description: cur.desc.join(' ').trim() || cur.type, kind: cur.type, direction: cur.sign > 0 ? 'in' : 'out', amount: cur.amount, balance: cur.balance })
    cur = null
  }
  for (const page of pages) {
    const head = page.find((i) => i.s === 'Tanggal & Waktu')
    if (!head) continue
    const foot = page.find((i) => /^PT Bank Negara/.test(i.s))
    const body = page.filter((i) => i.y > head.y + 3 && (!foot || i.y < foot.y - 2))
    for (const it of body) {
      if (it.x < 110) {
        const d = dateLong(it.s)
        if (d) { flush(); cur = { on: d, type: '', desc: [], amount: null, sign: -1, balance: null } }
        continue // jam transaksi diabaikan
      }
      if (/^Saldo (Awal|Akhir)$/.test(it.s) && it.x < 200) { flush(); continue }
      if (!cur) continue
      const r = right(it)
      if (r >= 395 && r <= 450 && /^[+-][\d,]+$/.test(it.s)) { cur.sign = it.s.startsWith('+') ? 1 : -1; cur.amount = digits(it.s); continue }
      if (r > 480 && /^-?[\d,]+$/.test(it.s)) { cur.balance = (it.s.startsWith('-') ? -1 : 1) * digits(it.s); continue }
      if (it.x >= 110 && r < 395) { if (!cur.type) cur.type = it.s.trim(); else cur.desc.push(it.s.trim()) }
    }
  }
  flush()

  const warnings: string[] = []
  const sumIn = txns.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0)
  const sumOut = txns.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0)
  if (sumIn !== total_in) warnings.push(`Total masuk dari transaksi ${rpf(sumIn)} berbeda dari ringkasan ${rpf(total_in)}.`)
  if (sumOut !== total_out) warnings.push(`Total keluar dari transaksi ${rpf(sumOut)} berbeda dari ringkasan ${rpf(total_out)}.`)
  if (opening + total_in - total_out !== closing) warnings.push('Saldo awal + masuk − keluar tidak sama dengan saldo akhir di PDF.')
  let run = opening, broken = 0
  for (const t of txns) {
    run += t.direction === 'in' ? t.amount : -t.amount
    if (t.balance != null && t.balance !== run) { broken++; run = t.balance }
  }
  if (broken) warnings.push(`${broken} transaksi tidak nyambung dengan saldo berjalan. Periksa daftar sebelum menyimpan.`)
  if (!txns.length) warnings.push('Tidak ada transaksi yang terbaca.')
  return { bank: 'BNI', type: 'rekening', label, account, period, opening, total_in, total_out, closing, min_payment: 0, due_on: null, note: '', txns, warnings }
}

// ── BNI e-billing Kartu Kredit ───────────────────────────────────────

function parseBniCard(pages: PItem[][]): ParseResult {
  const all = pages.flat()
  const cetak = all.find((i) => i.s === 'Tanggal Cetak')
  const cetakDate = cetak ? dateDash(all.find((i) => i.y > cetak.y && i.y < cetak.y + 20 && Math.abs(i.x - cetak.x) < 20 && dateDash(i.s))?.s ?? '') : null
  if (!cetakDate) return { error: 'Tanggal cetak tagihan tidak terbaca.' }
  const period = cetakDate.slice(0, 7)

  // Ringkasan di kolom kanan: label di x ≥ 390, nilai rata kanan di baris yang sama
  const rows = pages.flatMap((p) => rowsOf(p))
  const sum: Record<string, string> = {}
  for (const r of rows) {
    const label = r.find((i) => i.x >= 390 && /^[A-Z][A-Z &]+$/.test(i.s.trim()))
    const val = r.find((i) => i.x >= 500 && right(i) > 520)
    if (label && val && !(label.s.trim() in sum)) sum[label.s.trim()] = val.s.trim()
  }
  const need = ['TAGIHAN BULAN LALU', 'PEMBAYARAN', 'PEMBELANJAAN', 'TAGIHAN BULAN INI']
  if (need.some((k) => !(k in sum))) return { error: 'Ringkasan tagihan kartu tidak terbaca.' }
  const opening = digits(sum['TAGIHAN BULAN LALU']), paid = digits(sum['PEMBAYARAN']), spend = digits(sum['PEMBELANJAAN'])
  const cash = digits(sum['PENARIKAN TUNAI'] ?? '0'), fee = digits(sum['BIAYA ADM & BUNGA'] ?? '0'), closing = digits(sum['TAGIHAN BULAN INI'])
  const min_payment = digits(sum['PEMBAYARAN MINIMUM'] ?? '0')
  const due_on = dateDash(sum['TANGGAL JATUH TEMPO'] ?? '')
  const limit = digits(sum['BATAS KREDIT'] ?? '0'), left = digits(sum['SISA KREDIT'] ?? '0')

  const txns: ParsedTxn[] = []
  let converted = 0 // pencairan yang diubah jadi cicilan (0/NN Rp. X): masuk pembelanjaan tapi tidak ditagih bulan itu
  for (const r of rows) {
    const left0 = r.filter((i) => i.x < 390)
    const dates = left0.filter((i) => i.x < 110 && dateDash(i.s))
    if (dates.length < 2) {
      // baris lanjutan, mis. kurs "(USD1=IDR18368,46)"
      const last = txns[txns.length - 1]
      const cont = left0.filter((i) => i.x >= 110 && /^\(.*\)$/.test(i.s.trim()))
      if (last && cont.length && !left0.some((i) => i.x < 110)) last.description += ' ' + cont.map((i) => i.s.trim()).join(' ')
      continue
    }
    const amt = left0.find((i) => right(i) >= 365 && right(i) <= 392 && /^[\d.]+(\s?CR)?$/.test(i.s.trim()))
    if (!amt) {
      const conv = left0.map((i) => i.s).join(' ').match(/:\s*0\/\d{2}\s+Rp\.?\s*([\d.]+)/)
      if (conv) converted += digits(conv[1])
      continue
    }
    const desc = left0.filter((i) => i.x >= 110 && i !== amt).map((i) => i.s.trim()).join(' ').replace(/\s+/g, ' ').trim()
    const cr = /CR$/.test(amt.s.trim())
    const inst = desc.match(/:\s*(\d{2})\/(\d{2})\b/)
    const kind = cr ? 'Pembayaran' : /^BY\s/.test(desc) ? 'Biaya' : inst ? `Cicilan ${+inst[1]}/${+inst[2]}` : 'Belanja'
    txns.push({ txn_on: dateDash(dates[0].s)!, description: desc, kind, direction: cr ? 'in' : 'out', amount: digits(amt.s), balance: null })
  }

  const warnings: string[] = []
  const charges = txns.filter((t) => t.direction === 'out').reduce((s, t) => s + t.amount, 0)
  const credits = txns.filter((t) => t.direction === 'in').reduce((s, t) => s + t.amount, 0)
  if (opening - paid + spend + cash + fee - converted !== closing) warnings.push('Tagihan lalu − pembayaran + pembelanjaan + biaya tidak sama dengan tagihan bulan ini di PDF.')
  if (credits !== paid) warnings.push(`Pembayaran dari transaksi ${rpf(credits)} berbeda dari ringkasan ${rpf(paid)}.`)
  if (charges !== spend + cash + fee - converted) warnings.push(`Total transaksi ${rpf(charges)} berbeda dari pembelanjaan + biaya ${rpf(spend + cash + fee - converted)}.`)
  if (!txns.length) warnings.push('Tidak ada transaksi yang terbaca.')
  const card = rows.flat().find((i) => /^\d{4}-\d{2}XX-XXXX-\d{3,4}$/.test(i.s))?.s ?? ''
  const note = `${limit ? `Limit ${rpf(limit)}${left ? `, sisa kredit ${rpf(left)}` : ''}` : ''}`.trim()
  return { bank: 'BNI', type: 'kartu', label: 'BNI Kartu Kredit', account: card, period, opening, total_in: paid, total_out: spend + cash + fee - converted, closing, min_payment, due_on, note, txns, warnings }
}

export function parseStatementPages(pages: PItem[][]): ParseResult {
  const text = pages.flat().map((i) => i.s).join(' ')
  if (/Laporan Mutasi Rekening/i.test(text) && /BNI|Bank Negara/i.test(text)) return parseBniMutasi(pages)
  if (/BATAS KREDIT/.test(text) && /TAGIHAN BULAN INI/.test(text) && /BNI/i.test(text)) return parseBniCard(pages)
  return { error: 'Format statement ini belum dikenali. Isi ringkasannya manual, atau kirim contoh PDF-nya supaya pembacanya ditambahkan.' }
}
