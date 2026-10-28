import { NextResponse, type NextRequest } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { parseQuick } from '@/lib/quick-parse'
import { isCreditKind } from '@/lib/types'
import { queryPockets } from '@/lib/pockets'
import { rp, ymOfDate } from '@/lib/calc'
import { esc, tgCall, webhookSecret } from '@/lib/telegram'

export const dynamic = 'force-dynamic'

type Update = {
  message?: { chat: { id: number }; text?: string }
  callback_query?: { id: string; data?: string; message?: { chat: { id: number }; message_id: number; text?: string } }
}

const HELP = `<b>Catat pengeluaran dari sini</b>\nTulis seperti ngobrol, nominal boleh 20rb, 20k, 20 ribu, 20.000, atau 1,5 jt:\n\n▫️ <code>Makan siang 20 ribu</code>\n▫️ <code>Kopi 25k gopay</code>\n▫️ <code>Bensin 50rb kemarin pakai tunai</code>\n▫️ <code>Parkir 5rb tgl 25</code>\n\nSumber dana dikenali dari namanya, tanggal dari kata <i>kemarin</i>, <i>tgl 25</i>, <i>25/10</i>, atau <i>2 hari lalu</i>. Tanpa keterangan, dicatat hari ini tanpa sumber dana. Ada tombol <b>Batalkan</b> di setiap balasan.`

const say = (chat: number, text: string, extra: Record<string, unknown> = {}) => tgCall('sendMessage', { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra })
const tglPendek = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' })

/** Pesan masuk dari Telegram (webhook). Selalu membalas 200 supaya Telegram tidak mengulang kiriman. */
export async function POST(req: NextRequest) {
  if (req.headers.get('x-telegram-bot-api-secret-token') !== (await webhookSecret())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ ok: false })
  const sb = createClient(url, key, { auth: { persistSession: false } })
  const u = (await req.json().catch(() => null)) as Update | null
  try {
    if (u?.callback_query) await onCallback(sb, u.callback_query)
    else if (u?.message?.text) await onText(sb, u.message.chat.id, u.message.text)
  } catch (e) { console.error('[telegram]', e) }
  return NextResponse.json({ ok: true })
}

async function ownerOf(sb: SupabaseClient, chat: number): Promise<string | null> {
  const { data } = await sb.from('user_telegram').select('owner_id').eq('chat_id', String(chat)).maybeSingle()
  return (data?.owner_id as string) ?? null
}

async function onText(sb: SupabaseClient, chat: number, raw: string) {
  const owner = await ownerOf(sb, chat)
  if (!owner) { await say(chat, `Chat ini belum terhubung ke Arus.\nChat ID kamu: <code>${chat}</code>\nIsi di <b>Pengaturan → Pengingat Telegram</b>, lalu coba lagi.`); return }
  const text = raw.trim()
  if (/^\/(start|help|bantuan)\b/i.test(text)) { await say(chat, HELP); return }
  if (text.startsWith('/')) { await say(chat, 'Perintah itu belum ada. Kirim /bantuan untuk contoh penulisan.'); return }
  if (text.startsWith('+')) { await say(chat, 'Untuk sekarang yang bisa dicatat dari sini hanya pengeluaran. Pemasukan catat lewat aplikasi.'); return }

  const today = ymOfDate(new Date())
  const { data: pk } = await sb.from('pockets').select('id,name,kind').eq('owner_id', owner)
  const q = parseQuick(text, (pk ?? []) as { id: string; name: string; kind: string }[], today.iso)
  if (!q.ok) { await say(chat, `${esc(q.error)}\n\nContoh: <code>Makan siang 20rb</code>. Kirim /bantuan untuk contoh lain.`); return }

  // Kategori otomatis: pakai kategori dari catatan lama dengan keterangan yang sama persis
  const ym = q.date.slice(0, 7)
  const [past, buds] = await Promise.all([
    sb.from('expenses').select('note,budget_items(label)').eq('owner_id', owner).not('budget_item_id', 'is', null).ilike('note', q.note).order('spent_on', { ascending: false }).limit(1),
    sb.from('budget_items').select('id,label').eq('owner_id', owner).eq('ym', ym),
  ])
  const lb = ((past.data?.[0] as { budget_items?: { label?: string } | null } | undefined)?.budget_items?.label ?? '').toLowerCase()
  const bud = lb ? (buds.data ?? []).find((b) => String(b.label).toLowerCase() === lb) : undefined

  const { data: row, error } = await sb.from('expenses').insert({ owner_id: owner, ym, spent_on: q.date, note: q.note, amount: q.amount, pocket_id: q.pocket?.id ?? null, budget_item_id: (bud?.id as string) ?? null }).select('id').single()
  if (error || !row) { await say(chat, 'Gagal menyimpan. Coba lagi sebentar lagi.'); return }

  let saldoLine = ''
  if (q.pocket) {
    try {
      const { pockets } = await queryPockets(sb, owner, today)
      const p = pockets.find((x) => x.id === q.pocket!.id)
      if (p) {
        if (isCreditKind(p.kind)) { const used = -p.saldo, lim = p.credit_limit ?? 0; saldoLine = `\n💳 Terpakai ${rp(used)}${lim ? ` dari limit ${rp(lim)}` : ''}${lim && used > lim ? ' ⚠ melebihi limit' : ''}` }
        else saldoLine = `\n👛 Saldo ${esc(p.name)}: ${rp(p.saldo)}${p.saldo < 0 ? ' ⚠ minus' : ''}`
      }
    } catch { /* saldo hanya bonus */ }
  }
  const lines = [
    `✅ <b>Tersimpan</b>`, `${esc(q.note)} · <b>${rp(q.amount)}</b>`,
    `📅 ${q.date === today.iso ? 'Hari ini' : tglPendek(q.date)}${q.pocket ? ` · 👛 ${esc(q.pocket.name)}` : ' · tanpa sumber dana'}`,
    bud ? `🏷️ ${esc(String(bud.label))}` : '🏷️ tanpa kategori (atur di Catatan)',
  ]
  if (q.pocketHint) lines.push(`ℹ️ ${esc(q.pocketHint)}`)
  await say(chat, lines.join('\n') + saldoLine, { reply_markup: { inline_keyboard: [[{ text: '↩️ Batalkan', callback_data: `u:${row.id}` }]] } })
}

async function onCallback(sb: SupabaseClient, cb: NonNullable<Update['callback_query']>) {
  const chat = cb.message?.chat.id
  const m = cb.data?.match(/^u:([0-9a-f-]{36})$/i)
  if (!chat || !m) { await tgCall('answerCallbackQuery', { callback_query_id: cb.id }); return }
  const owner = await ownerOf(sb, chat)
  if (!owner) { await tgCall('answerCallbackQuery', { callback_query_id: cb.id, text: 'Chat belum terhubung.' }); return }
  const { data } = await sb.from('expenses').delete().eq('id', m[1]).eq('owner_id', owner).select('note,amount')
  const gone = data?.[0]
  await tgCall('answerCallbackQuery', { callback_query_id: cb.id, text: gone ? 'Dibatalkan' : 'Sudah tidak ada' })
  await tgCall('editMessageText', {
    chat_id: chat, message_id: cb.message!.message_id, parse_mode: 'HTML',
    text: gone ? `↩️ <s>${esc(String(gone.note))} · ${rp(Number(gone.amount))}</s>\nDibatalkan, catatan dihapus.` : 'Catatan ini sudah tidak ada.',
  })
}
