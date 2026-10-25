import { Banknote, Building2, CreditCard, Smartphone, Wallet } from 'lucide-react'
import type { PocketKind } from '@/lib/types'

/** Merek yang dikenali dari nama sumber dana. Hanya warna + singkatan, bukan logo asli. */
const BRANDS: { key: string; re: RegExp; abbr: string }[] = [
  { key: 'bca', re: /\bbca\b|blu\b/i, abbr: 'BCA' },
  { key: 'bri', re: /\bbri\b|brimo/i, abbr: 'BRI' },
  { key: 'bni', re: /\bbni\b/i, abbr: 'BNI' },
  { key: 'mandiri', re: /mandiri|livin/i, abbr: 'MDR' },
  { key: 'cimb', re: /cimb|octo/i, abbr: 'CIMB' },
  { key: 'jago', re: /jago/i, abbr: 'JAGO' },
  { key: 'seabank', re: /sea\s?bank/i, abbr: 'SEA' },
  { key: 'jenius', re: /jenius|btpn/i, abbr: 'JNS' },
  { key: 'btn', re: /\bbtn\b/i, abbr: 'BTN' },
  { key: 'permata', re: /permata/i, abbr: 'PMT' },
  { key: 'gopay', re: /go\s?pay|gojek/i, abbr: 'GP' },
  { key: 'ovo', re: /\bovo\b/i, abbr: 'OVO' },
  { key: 'dana', re: /\bdana\b/i, abbr: 'DANA' },
  { key: 'shopeepay', re: /shopee/i, abbr: 'SPAY' },
  { key: 'linkaja', re: /link\s?aja/i, abbr: 'LA' },
]

const KIND_ICON = { bank: Building2, ewallet: Smartphone, tunai: Banknote, lainnya: Wallet, kredit: CreditCard } as const

export function brandOf(name: string) {
  return BRANDS.find((b) => b.re.test(name)) ?? null
}

/** Lingkaran kecil berwarna merek (atau ikon jenis sumber dana bila merek tidak dikenali). */
export function PocketAvatar({ name, kind = 'lainnya', size = 36 }: { name: string; kind?: PocketKind; size?: number }) {
  const b = brandOf(name)
  const Icon = KIND_ICON[kind] ?? Wallet
  const long = b ? b.abbr.length : 0
  return (
    <span className={`pa ${b ? `pa-${b.key}` : 'pa-none'}`} style={{ width: size, height: size, fontSize: size * (long > 3 ? 0.27 : long > 2 ? 0.31 : 0.38) }} aria-hidden="true">
      {b ? b.abbr : <Icon size={Math.round(size * 0.5)} />}
    </span>
  )
}
