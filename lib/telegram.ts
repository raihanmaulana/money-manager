/** Kirim pesan lewat Telegram Bot API. Mengembalikan null kalau sukses, atau teks galat singkat. */
export const telegramEnabled = () => !!process.env.TELEGRAM_BOT_TOKEN

export const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function sendTelegram(chatId: string, text: string, html = false): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return 'Bot Telegram belum disiapkan di server (TELEGRAM_BOT_TOKEN).'
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true, ...(html ? { parse_mode: 'HTML' } : {}) }),
    })
    if (res.ok) return null
    const j = (await res.json().catch(() => null)) as { description?: string } | null
    return j?.description ?? `Telegram menolak (HTTP ${res.status}).`
  } catch {
    return 'Tidak bisa menghubungi Telegram, coba lagi.'
  }
}

/** Panggil metode Bot API apa pun. */
export async function tgCall(method: string, body: Record<string, unknown>): Promise<{ ok: boolean; description?: string; result?: unknown }> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false, description: 'Bot Telegram belum disiapkan di server (TELEGRAM_BOT_TOKEN).' }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
    return (await res.json().catch(() => ({ ok: false, description: `HTTP ${res.status}` }))) as { ok: boolean; description?: string; result?: unknown }
  } catch {
    return { ok: false, description: 'Tidak bisa menghubungi Telegram, coba lagi.' }
  }
}

/** Rahasia webhook diturunkan dari token bot, jadi tidak perlu variabel lingkungan tambahan. */
export async function webhookSecret(): Promise<string> {
  const { createHash } = await import('node:crypto')
  return createHash('sha256').update(`arus-webhook:${process.env.TELEGRAM_BOT_TOKEN ?? ''}`).digest('hex').slice(0, 48)
}

/** Apakah webhook pencatatan sudah terpasang ke alamat aplikasi ini. */
export async function captureActive(): Promise<boolean> {
  if (!telegramEnabled()) return false
  const r = await tgCall('getWebhookInfo', {})
  return !!r.ok && String((r.result as { url?: string } | undefined)?.url ?? '').endsWith('/api/telegram')
}
