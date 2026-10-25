'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { DEMO } from './data.ts'
import { parseDebtDate, parseDebtSheet, type DebtImportRow, type DebtImportResult } from './debt.ts'
import { supabaseServer } from './supabase/server.ts'

const money = (v: FormDataEntryValue | string | number | null | undefined) => {
  const n = Number(String(v ?? '').replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? Math.min(n, 100_000_000_000) : 0
}
const text = (v: FormDataEntryValue | null | undefined, max = 80) => String(v ?? '').trim().slice(0, max)
const done = () => revalidatePath('/', 'layout')

async function me() {
  if (DEMO) return null
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Belum masuk')
  return { sb, uid: user.id }
}
type C = NonNullable<Awaited<ReturnType<typeof me>>>
const NO_TABLE = 'Tabel belum ada. Jalankan supabase/tambah-hutang-split-bill.sql di SQL Editor Supabase dulu.'
const missing = (e: { message?: string; code?: string } | null) => !!e && (e.code === '42P01' || /does not exist|schema cache/i.test(e.message ?? ''))

async function personOf(c: C, id: string) {
  const { data } = await c.sb.from('debt_people').select('id,name').eq('id', id).eq('owner_id', c.uid).maybeSingle()
  return data as { id: string; name: string } | null
}

/** Aktifkan atau matikan menu Hutang Split Bill (Pengaturan). */
export async function setDebtMenu(on: boolean): Promise<string | void> {
  if (DEMO) { (await cookies()).set('arus.debt', on ? '1' : '0', { path: '/', maxAge: 31536000 }); return done() }
  const c = await me()
  if (!c) return done()
  const { error } = await c.sb.from('user_prefs').upsert({ owner_id: c.uid, debt_menu: !!on, updated_at: new Date().toISOString() })
  if (error) return missing(error) ? NO_TABLE : `Gagal menyimpan: ${error.message}`
  done()
}

export async function addDebtPerson(fd: FormData): Promise<string | void> {
  const name = text(fd.get('name'), 40)
  if (!name) return 'Nama wajib diisi.'
  const c = await me()
  if (!c) return done()
  const { error } = await c.sb.from('debt_people').insert({ owner_id: c.uid, name })
  if (error) return missing(error) ? NO_TABLE : error.code === '23505' ? `"${name}" sudah ada di daftar.` : `Gagal menyimpan: ${error.message}`
  done()
}

export async function deleteDebtPerson(id: string) {
  const c = await me()
  if (!c) return done()
  await c.sb.from('debt_people').delete().eq('id', id).eq('owner_id', c.uid)
  done()
}

function entryFields(fd: FormData) {
  const title = text(fd.get('title'))
  const amount = money(fd.get('amount'))
  const share = Math.min(money(fd.get('share')), amount)
  const entry_on = parseDebtDate(text(fd.get('entry_on'), 10))
  const paid_by = text(fd.get('paid_by'), 4) === 'them' ? 'them' : 'me'
  return { title, amount, share, entry_on, paid_by: paid_by as 'me' | 'them', note: text(fd.get('note'), 120) }
}

export async function addDebtEntry(fd: FormData): Promise<string | void> {
  const f = entryFields(fd)
  if (!f.title) return 'Kegiatan wajib diisi.'
  if (!f.entry_on) return 'Tanggal tidak valid.'
  if (f.amount <= 0) return 'Harga harus lebih dari 0.'
  const c = await me()
  if (!c) return done()
  const p = await personOf(c, text(fd.get('person_id'), 40))
  if (!p) return 'Orangnya tidak ditemukan.'
  const { error } = await c.sb.from('debt_entries').insert({ owner_id: c.uid, person_id: p.id, ...f })
  if (error) return `Gagal menyimpan: ${error.message}`
  done()
}

export async function updateDebtEntry(fd: FormData): Promise<string | void> {
  const f = entryFields(fd)
  if (!f.title) return 'Kegiatan wajib diisi.'
  if (!f.entry_on) return 'Tanggal tidak valid.'
  if (f.amount <= 0) return 'Harga harus lebih dari 0.'
  const c = await me()
  if (!c) return done()
  const { error } = await c.sb.from('debt_entries').update(f).eq('id', text(fd.get('id'), 40)).eq('owner_id', c.uid)
  if (error) return `Gagal menyimpan: ${error.message}`
  done()
}

export async function deleteDebtEntry(id: string) {
  const c = await me()
  if (!c) return done()
  await c.sb.from('debt_entries').delete().eq('id', id).eq('owner_id', c.uid)
  done()
}

export async function addDebtPayment(fd: FormData): Promise<string | void> {
  const amount = money(fd.get('amount'))
  const paid_on = parseDebtDate(text(fd.get('paid_on'), 10))
  const direction = text(fd.get('direction'), 12) === 'me_to_them' ? 'me_to_them' : 'them_to_me'
  if (amount <= 0) return 'Jumlah harus lebih dari 0.'
  if (!paid_on) return 'Tanggal tidak valid.'
  const c = await me()
  if (!c) return done()
  const p = await personOf(c, text(fd.get('person_id'), 40))
  if (!p) return 'Orangnya tidak ditemukan.'
  const pid = text(fd.get('pocket_id'), 40)
  const pocket = pid ? (await c.sb.from('pockets').select('id,kind').eq('id', pid).eq('owner_id', c.uid).maybeSingle()).data : null
  if (pid && (!pocket || pocket.kind === 'kredit' || pocket.kind === 'paylater')) return 'Pilih sumber dana yang bukan kartu kredit atau PayLater.'
  const { error } = await c.sb.from('debt_payments').insert({ owner_id: c.uid, person_id: p.id, direction, amount, paid_on, note: text(fd.get('note'), 120), pocket_id: pocket ? (pocket.id as string) : null })
  if (error) return `Gagal menyimpan: ${error.message}`
  done()
}

export async function deleteDebtPayment(id: string) {
  const c = await me()
  if (!c) return done()
  await c.sb.from('debt_payments').delete().eq('id', id).eq('owner_id', c.uid)
  done()
}

/** Baca file Excel unggahan dan kembalikan pratinjau (belum disimpan). */
export async function parseDebtUpload(fd: FormData): Promise<DebtImportResult & { error?: string }> {
  const file = fd.get('file')
  const person = text(fd.get('person'), 40)
  if (!(file instanceof File) || !file.size) return { rows: [], errors: [], error: 'Pilih file Excel (.xlsx) dulu.' }
  if (file.size > 2_000_000) return { rows: [], errors: [], error: 'File terlalu besar (maksimal 2 MB).' }
  if (!/\.xlsx$/i.test(file.name)) return { rows: [], errors: [], error: 'Format harus .xlsx. Unduh templatenya dari tombol di atas.' }
  try {
    const { readSheet } = await import('read-excel-file/node')
    const data = (await readSheet(Buffer.from(await file.arrayBuffer()))) as unknown[][]
    const r = parseDebtSheet(data, person)
    if (!r.rows.length && !r.errors.length) return { rows: [], errors: [], error: 'Tidak ada baris data di file ini.' }
    return { ...r, rows: r.rows.slice(0, 500) }
  } catch {
    return { rows: [], errors: [], error: 'File tidak bisa dibaca. Pastikan formatnya .xlsx dan sesuai template.' }
  }
}

/** Simpan baris hasil pratinjau. Baris yang sama persis (tanggal, kegiatan, harga, pembayar) dilewati. */
export async function importDebtRows(personId: string, rows: DebtImportRow[]): Promise<{ added: number; skipped: number; error?: string }> {
  const c = await me()
  if (!c) { done(); return { added: 0, skipped: 0 } }
  const p = await personOf(c, personId)
  if (!p) return { added: 0, skipped: 0, error: 'Orangnya tidak ditemukan.' }
  const clean = (Array.isArray(rows) ? rows : []).slice(0, 500).map((r) => ({
    entry_on: parseDebtDate(r.entry_on), title: text(r.title), amount: money(r.amount), share: Math.min(money(r.share), money(r.amount)),
    note: text(r.note, 120), paid_by: r.paid_by === 'them' ? 'them' as const : 'me' as const,
  })).filter((r) => r.entry_on && r.title && r.amount > 0)
  const { data: have } = await c.sb.from('debt_entries').select('entry_on,title,amount,paid_by').eq('person_id', p.id).eq('owner_id', c.uid)
  const key = (r: { entry_on: string | null; title: string; amount: number; paid_by: string }) => `${r.entry_on}|${r.title.toLowerCase()}|${Number(r.amount)}|${r.paid_by}`
  const seen = new Set((have ?? []).map((r) => key(r as never)))
  const fresh = clean.filter((r) => { const k = key(r); if (seen.has(k)) return false; seen.add(k); return true })
  if (fresh.length) {
    const { error } = await c.sb.from('debt_entries').insert(fresh.map((r) => ({ owner_id: c.uid, person_id: p.id, ...r })))
    if (error) return { added: 0, skipped: 0, error: `Gagal menyimpan: ${error.message}` }
  }
  done()
  return { added: fresh.length, skipped: clean.length - fresh.length }
}
