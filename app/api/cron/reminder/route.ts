import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendTelegram } from '@/lib/telegram'
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

  const { data: users } = await sb.from('user_telegram').select('owner_id, chat_id, last_sent_on')
  let sent = 0, failed = 0
  for (const u of users ?? []) {
    if (u.last_sent_on === iso) continue // sudah terkirim hari ini
    const [{ data: items }, { data: bought }] = await Promise.all([
      sb.from('need_items').select('id, name, category, est_price, qty, remind_day').eq('owner_id', u.owner_id).not('remind_day', 'is', null).lte('remind_day', day),
      sb.from('need_purchases').select('item_id').eq('owner_id', u.owner_id).eq('ym', ym),
    ])
    const got = new Set((bought ?? []).map((b) => b.item_id))
    const due = (items ?? []).filter((i) => !got.has(i.id))
    if (!due.length) continue
    const total = due.reduce((t, i) => t + Math.round(Number(i.est_price) * Number(i.qty)), 0)
    const lines = due.slice(0, 20).map((i) => `• ${i.name} (${i.category})${i.remind_day! < day ? ` — terlewat dari tgl ${i.remind_day}` : ''}`)
    const text = `🛒 Waktunya beli (${due.length} barang)\n${lines.join('\n')}${due.length > 20 ? '\n…' : ''}\n\nPerkiraan ${rp(total)}\nCatat di Arus setelah dibeli.`
    const err = await sendTelegram(u.chat_id, text)
    if (err) { failed++; console.error('[telegram]', err); continue }
    await sb.from('user_telegram').update({ last_sent_on: iso }).eq('owner_id', u.owner_id)
    sent++
  }
  return NextResponse.json({ ok: true, sent, failed })
}
