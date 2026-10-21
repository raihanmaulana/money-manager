import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { esc, sendTelegram } from '@/lib/telegram'
import { rp, ymOfDate } from '@/lib/calc'

export const dynamic = 'force-dynamic'

/** Dipanggil Vercel Cron tiap pagi: kirim ringkasan kebutuhan yang waktunya dibeli tapi belum dibeli. */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum diisi' }, { status: 500 })
  const sb = createClient(url, key, { auth: { persistSession: false } })
  const { ym, day, iso } = ymOfDate(new Date())
  const force = req.nextUrl.searchParams.get('force') === '1' // untuk tes: abaikan batas sekali sehari
  const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/dashboard/kebutuhan` : ''
  const tgl = new Date(iso + 'T00:00:00Z').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

  const { data: users } = await sb.from('user_telegram').select('owner_id, chat_id, last_sent_on')
  let sent = 0, failed = 0
  for (const u of users ?? []) {
    if (!force && u.last_sent_on === iso) continue // sudah terkirim hari ini
    const [{ data: items }, { data: bought }] = await Promise.all([
      sb.from('need_items').select('id, name, category, est_price, qty, remind_day').eq('owner_id', u.owner_id).not('remind_day', 'is', null).lte('remind_day', day),
      sb.from('need_purchases').select('item_id').eq('owner_id', u.owner_id).or(`ym.eq.${ym},bought_on.gte.${ym}-01`), // dihitung sudah dibeli bila ditandai di bulan ini ATAU tanggal belinya bulan ini
    ])
    const got = new Set((bought ?? []).map((b) => b.item_id))
    const due = (items ?? []).filter((i) => !got.has(i.id))
    if (!due.length) continue
    const est = (i: (typeof due)[number]) => Math.round(Number(i.est_price) * Number(i.qty))
    const total = due.reduce((t, i) => t + est(i), 0)
    const byCat = new Map<string, typeof due>()
    for (const i of due) byCat.set(i.category, [...(byCat.get(i.category) ?? []), i])
    const blocks = [...byCat.entries()].slice(0, 10).map(([cat, list]) => `<b>${esc(cat)}</b>\n` + list.slice(0, 15).map((i) => {
      const late = day - (i.remind_day as number)
      const when = late <= 0 ? 'hari ini' : `terlewat ${late} hari (tgl ${i.remind_day})`
      const q = Number(i.qty) !== 1 ? ` ×${String(Number(i.qty)).replace('.', ',')}` : ''
      return `▫️ ${esc(i.name)}${q}\n      ≈ ${rp(est(i))} · ${when}`
    }).join('\n'))
    const text = `🛒 <b>Waktunya beli</b> · ${tgl}\n${due.length} barang belum dibeli\n\n${blocks.join('\n\n')}\n\n💰 <b>Perkiraan total ${rp(total)}</b>\n\nSudah beli? Tekan <i>Sudah dibeli</i> di menu Kebutuhan supaya pengingat ini berhenti.${site ? `\n👉 ${site}` : ''}`
    const err = await sendTelegram(u.chat_id, text, true)
    if (err) { failed++; console.error('[telegram]', err); continue }
    await sb.from('user_telegram').update({ last_sent_on: iso }).eq('owner_id', u.owner_id)
    sent++
  }
  return NextResponse.json({ ok: true, sent, failed })
}
