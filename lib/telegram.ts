/** Kirim pesan lewat Telegram Bot API. Mengembalikan null kalau sukses, atau teks galat singkat. */
export const telegramEnabled = () => !!process.env.TELEGRAM_BOT_TOKEN

export async function sendTelegram(chatId: string, text: string): Promise<string | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return 'Bot Telegram belum disiapkan di server (TELEGRAM_BOT_TOKEN).'
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    })
    if (res.ok) return null
    const j = (await res.json().catch(() => null)) as { description?: string } | null
    return j?.description ?? `Telegram menolak (HTTP ${res.status}).`
  } catch {
    return 'Tidak bisa menghubungi Telegram, coba lagi.'
  }
}
