'use server'

import { revalidatePath } from 'next/cache'
import { DEMO } from './data.ts'
import { supabaseServer } from './supabase/server.ts'

const GRP = ['kebutuhan', 'gaya_hidup', 'tabungan', 'investasi'] as const
const money = (v: FormDataEntryValue | string | number | null | undefined) => {
  const n = Number(String(v ?? '').replace(/[^\d]/g, ''))
  return Number.isFinite(n) ? Math.min(n, 100_000_000_000) : 0
}
const text = (v: FormDataEntryValue | null | undefined, max = 80) => String(v ?? '').trim().slice(0, max)
const done = () => revalidatePath('/', 'layout')
const NO_TABLE = 'Tabel template belum ada. Jalankan supabase/tambah-template-bulan.sql di SQL Editor Supabase dulu.'
const missing = (e: { message?: string; code?: string } | null) => !!e && (e.code === '42P01' || /does not exist|schema cache/i.test(e.message ?? ''))

async function me() {
  if (DEMO) return null
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Belum masuk')
  return { sb, uid: user.id }
}

export async function addTemplateLine(fd: FormData): Promise<string | void> {
  const section = fd.get('section') === 'budget' ? 'budget' : 'income'
  const label = text(fd.get('label'))
  if (!label) return 'Isi namanya dulu.'
  const c = await me()
  if (!c) return done()
  const grp = text(fd.get('grp'), 12)
  if (section === 'budget' && !(GRP as readonly string[]).includes(grp)) return 'Pilih kelompok anggaran.'
  let pocket_id: string | null = null
  const pid = text(fd.get('pocket_id'), 40)
  if (section === 'income' && pid) {
    const { data } = await c.sb.from('pockets').select('id').eq('id', pid).eq('owner_id', c.uid).maybeSingle()
    pocket_id = (data?.id as string) ?? null
  }
  const { count } = await c.sb.from('month_template').select('id', { count: 'exact', head: true }).eq('owner_id', c.uid).eq('section', section)
  const { error } = await c.sb.from('month_template').insert({
    owner_id: c.uid, section, label, amount: money(fd.get('amount')), pocket_id, sort: count ?? 0,
    kind: section === 'income' ? (fd.get('kind') === 'potong' ? 'potong' : 'masuk') : null, grp: section === 'budget' ? grp : null,
  })
  if (error) return missing(error) ? NO_TABLE : `Gagal menyimpan: ${error.message}`
  done()
}

export async function updateTemplateLine(id: string, field: 'label' | 'amount', value: string) {
  const c = await me()
  if (!c) return done()
  const patch = field === 'label' ? { label: text(value) } : { amount: money(value) }
  if (field === 'label' && !patch.label) return
  await c.sb.from('month_template').update(patch).eq('id', id).eq('owner_id', c.uid)
  done()
}

export async function deleteTemplateLine(id: string) {
  const c = await me()
  if (!c) return done()
  await c.sb.from('month_template').delete().eq('id', id).eq('owner_id', c.uid)
  done()
}

/** Ganti seluruh template dengan isi pemasukan dan anggaran sebuah bulan. */
export async function saveMonthAsTemplate(ym: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ym)) return
  const c = await me()
  if (!c) return done()
  const [inc, bud] = await Promise.all([
    c.sb.from('income_items').select('label,kind,amount,sort,pocket_id').eq('owner_id', c.uid).eq('ym', ym).order('sort'),
    c.sb.from('budget_items').select('grp,label,amount,sort').eq('owner_id', c.uid).eq('ym', ym).order('sort'),
  ])
  const rows = [
    ...(inc.data ?? []).map((r, i) => ({ owner_id: c.uid, section: 'income', kind: r.kind, grp: null, label: r.label, amount: r.amount, pocket_id: r.pocket_id ?? null, sort: i })),
    ...(bud.data ?? []).map((r, i) => ({ owner_id: c.uid, section: 'budget', kind: null, grp: r.grp, label: r.label, amount: r.amount, pocket_id: null, sort: i })),
  ]
  if (!rows.length) return
  const { error: e1 } = await c.sb.from('month_template').delete().eq('owner_id', c.uid)
  if (e1) throw new Error(missing(e1) ? NO_TABLE : e1.message)
  const { error } = await c.sb.from('month_template').insert(rows)
  if (error) throw new Error(error.message)
  done()
}
