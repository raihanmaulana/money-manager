'use server'

import { revalidatePath } from 'next/cache'
import { DEMO } from './data.ts'
import { supabaseServer } from './supabase/server.ts'

const BUCKET = 'statements'
const money = (v: FormDataEntryValue | string | number | null | undefined) => {
  const n = Number(String(v ?? '').replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? Math.min(n, 100_000_000_000) : 0
}
const text = (v: FormDataEntryValue | null | undefined, max = 80) => String(v ?? '').trim().slice(0, max)
const done = () => revalidatePath('/', 'layout')
const isYm = (s: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(s)
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))
const NO_TABLE = 'Tabel belum ada. Jalankan supabase/tambah-estatement.sql di SQL Editor Supabase dulu.'
const missing = (e: { message?: string; code?: string } | null) => !!e && (e.code === '42P01' || /does not exist|schema cache/i.test(e.message ?? ''))

async function me() {
  if (DEMO) return null
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Belum masuk')
  return { sb, uid: user.id }
}

function fields(fd: FormData) {
  const due = text(fd.get('due_on'), 10)
  return {
    opening: money(fd.get('opening')), total_in: money(fd.get('total_in')), total_out: money(fd.get('total_out')), closing: money(fd.get('closing')),
    min_payment: money(fd.get('min_payment')), due_on: due && isDate(due) ? due : null, note: text(fd.get('note'), 200),
  }
}

/** Rincian transaksi dari hasil baca PDF (JSON), divalidasi ulang di server. */
function parseTxns(raw: FormDataEntryValue | null) {
  if (!raw) return []
  try {
    const arr = JSON.parse(String(raw)) as unknown
    if (!Array.isArray(arr) || arr.length > 1500) return []
    const out: { txn_on: string; kind: string; description: string; direction: 'in' | 'out'; amount: number; balance: number | null }[] = []
    for (const t of arr as Record<string, unknown>[]) {
      const on = String(t.txn_on ?? '')
      const dir = t.direction === 'in' ? 'in' : t.direction === 'out' ? 'out' : null
      if (!isDate(on) || !dir) continue
      const bal = t.balance == null ? null : Number(t.balance)
      out.push({ txn_on: on, kind: text(t.kind as string, 40), description: text(t.description as string, 200), direction: dir, amount: money(t.amount as number), balance: bal != null && Number.isFinite(bal) ? Math.round(bal) : null })
    }
    return out
  } catch { return [] }
}

/** Simpan ringkasan statement. File PDF (kalau ada) sudah diunggah browser ke Storage; di sini hanya dicatat lokasinya. */
export async function saveStatement(fd: FormData): Promise<string | void> {
  const period = text(fd.get('period'), 7)
  if (!isYm(period)) return 'Periode tidak valid, pilih bulannya.'
  const c = await me()
  if (!c) return done()
  const pid = text(fd.get('pocket_id'), 40)
  const { data: pocket } = pid ? await c.sb.from('pockets').select('id,name,kind').eq('id', pid).eq('owner_id', c.uid).maybeSingle() : { data: null }
  if (!pocket) return 'Pilih sumber dana dulu.'
  const filePath = text(fd.get('file_path'), 200)
  if (filePath && !filePath.startsWith(`${c.uid}/`)) return 'Lokasi file tidak valid.'
  const row = {
    owner_id: c.uid, pocket_id: pocket.id as string, pocket_name: pocket.name as string, pocket_kind: pocket.kind as string, period, ...fields(fd),
    file_path: filePath || null, file_name: filePath ? text(fd.get('file_name'), 120) : '', file_size: filePath ? money(fd.get('file_size')) : 0,
  }
  const { data: ins, error } = await c.sb.from('statements').insert(row).select('id').single()
  if (error || !ins) {
    if (!error) return 'Gagal menyimpan statement.'
    if (filePath) await c.sb.storage.from(BUCKET).remove([filePath])
    if (missing(error)) return NO_TABLE
    return error.code === '23505' ? `Statement ${pocket.name} periode ${period} sudah ada. Ubah atau hapus yang lama dulu.` : `Gagal menyimpan: ${error.message}`
  }
  const txns = parseTxns(fd.get('txns'))
  if (txns.length) {
    const { error: e2 } = await c.sb.from('statement_txns').insert(txns.map((t) => ({ ...t, owner_id: c.uid, statement_id: ins.id as string })))
    if (e2) return missing(e2) ? `Statement tersimpan, tapi rincian transaksi belum bisa disimpan. ${NO_TABLE}` : `Statement tersimpan, tapi rincian transaksi gagal: ${e2.message}`
  }
  done()
}

export async function updateStatement(fd: FormData): Promise<string | void> {
  const c = await me()
  if (!c) return done()
  const { error } = await c.sb.from('statements').update(fields(fd)).eq('id', text(fd.get('id'), 40)).eq('owner_id', c.uid)
  if (error) return `Gagal menyimpan: ${error.message}`
  done()
}

/** Hapus ringkasan sekaligus file aslinya. */
export async function deleteStatement(id: string) {
  const c = await me()
  if (!c) return done()
  const { data: row } = await c.sb.from('statements').select('file_path').eq('id', id).eq('owner_id', c.uid).maybeSingle()
  if (row?.file_path) await c.sb.storage.from(BUCKET).remove([row.file_path as string])
  await c.sb.from('statements').delete().eq('id', id).eq('owner_id', c.uid)
  done()
}

/** Hapus hanya file PDF asli (menghemat kapasitas); ringkasannya tetap ada. */
export async function removeStatementFile(id: string) {
  const c = await me()
  if (!c) return done()
  const { data: row } = await c.sb.from('statements').select('file_path').eq('id', id).eq('owner_id', c.uid).maybeSingle()
  if (row?.file_path) await c.sb.storage.from(BUCKET).remove([row.file_path as string])
  await c.sb.from('statements').update({ file_path: null, file_name: '', file_size: 0 }).eq('id', id).eq('owner_id', c.uid)
  done()
}

/** Tautan sementara (5 menit) untuk membuka PDF asli. */
export async function statementFileUrl(id: string): Promise<{ url?: string; error?: string }> {
  const c = await me()
  if (!c) return { error: 'Mode demo: file contoh tidak tersedia.' }
  const { data: row } = await c.sb.from('statements').select('file_path').eq('id', id).eq('owner_id', c.uid).maybeSingle()
  if (!row?.file_path) return { error: 'File asli tidak disimpan.' }
  const { data, error } = await c.sb.storage.from(BUCKET).createSignedUrl(row.file_path as string, 300)
  if (error || !data) return { error: 'Gagal membuka file.' }
  return { url: data.signedUrl }
}
