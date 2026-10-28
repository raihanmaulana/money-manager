// Pengambilan gerakan uang sebuah sumber dana untuk rekonsiliasi. Dipakai halaman laporan dan aksi impor.
import type { SupabaseClient } from '@supabase/supabase-js'
import { cardRestores } from './calc.ts'
import { reconcile, type Movement, type RecResult, type RecTxn } from './reconcile.ts'
import { isCreditKind } from './types.ts'

const num = (v: unknown) => Number(v ?? 0)
const lastDay = (ym: string) => `${ym}-${String(new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate()).padStart(2, '0')}`

/** Rentang tanggal yang dicakup statement: rekening = satu bulan penuh; kartu = dari transaksi pertama sampai terakhir. */
export function statementWindow(s: { period: string; pocket_kind: string }, txns: { txn_on: string }[]): { from: string; to: string } {
  if (isCreditKind(s.pocket_kind) && txns.length) {
    const d = txns.map((t) => t.txn_on).sort()
    return { from: d[0], to: d[d.length - 1] }
  }
  return { from: `${s.period}-01`, to: lastDay(s.period) }
}

export async function pocketMovements(sb: SupabaseClient, owner: string, pocketId: string, from: string, to: string): Promise<Movement[]> {
  const fromYm = from.slice(0, 7), toYm = to.slice(0, 7)
  const [exp, pay, trOut, trIn, dp, inc, cards, cb] = await Promise.all([
    sb.from('expenses').select('id,spent_on,amount,note,transfer_id').eq('owner_id', owner).eq('pocket_id', pocketId).gte('spent_on', from).lte('spent_on', to),
    sb.from('bill_payments').select('id,paid_on,amount,bills(name)').eq('owner_id', owner).eq('pocket_id', pocketId).gte('paid_on', from).lte('paid_on', to),
    sb.from('pocket_transfers').select('id,moved_on,amount,fee,note').eq('owner_id', owner).eq('from_pocket', pocketId).gte('moved_on', from).lte('moved_on', to),
    sb.from('pocket_transfers').select('id,moved_on,amount,note').eq('owner_id', owner).eq('to_pocket', pocketId).gte('moved_on', from).lte('moved_on', to),
    sb.from('debt_payments').select('id,paid_on,amount,direction,note').eq('owner_id', owner).eq('pocket_id', pocketId).gte('paid_on', from).lte('paid_on', to),
    sb.from('income_items').select('id,ym,kind,label,amount').eq('owner_id', owner).eq('pocket_id', pocketId).gte('ym', fromYm).lte('ym', toYm),
    sb.from('bills').select('id,kind,principal,card_pocket_id').eq('owner_id', owner).eq('card_pocket_id', pocketId),
    sb.from('pocket_cashbacks').select('id,received_on,amount,note').eq('owner_id', owner).eq('pocket_id', pocketId).gte('received_on', from).lte('received_on', to),
  ])
  const out: Movement[] = []
  // Catatan biaya admin otomatis dari Pindah dana (transfer_id) dihitung lewat pindah dana itu sendiri
  for (const r of exp.data ?? []) if (!r.transfer_id) out.push({ id: r.id as string, src: 'catatan', date: r.spent_on as string, ym: (r.spent_on as string).slice(0, 7), direction: 'out', amount: num(r.amount), label: (r.note as string) || 'Pengeluaran' })
  for (const r of pay.data ?? []) out.push({ id: r.id as string, src: 'tagihan', date: r.paid_on as string, ym: (r.paid_on as string).slice(0, 7), direction: 'out', amount: num(r.amount), label: `Bayar ${(r as { bills?: { name?: string } | null }).bills?.name ?? 'tagihan'}` })
  for (const r of trOut.data ?? []) {
    out.push({ id: `${r.id}`, src: 'pindah', date: r.moved_on as string, ym: (r.moved_on as string).slice(0, 7), direction: 'out', amount: num(r.amount), label: (r.note as string) || 'Pindah dana keluar' })
    if (num(r.fee) > 0) out.push({ id: `${r.id}-fee`, src: 'pindah', date: r.moved_on as string, ym: (r.moved_on as string).slice(0, 7), direction: 'out', amount: num(r.fee), label: 'Biaya admin pindah dana' })
  }
  for (const r of trIn.data ?? []) out.push({ id: `${r.id}`, src: 'pindah', date: r.moved_on as string, ym: (r.moved_on as string).slice(0, 7), direction: 'in', amount: num(r.amount), label: (r.note as string) || 'Pindah dana masuk' })
  for (const r of dp.data ?? []) out.push({ id: r.id as string, src: 'hutang', date: r.paid_on as string, ym: (r.paid_on as string).slice(0, 7), direction: r.direction === 'them_to_me' ? 'in' : 'out', amount: num(r.amount), label: (r.note as string) || 'Pelunasan hutang' })
  for (const r of cb.data ?? []) out.push({ id: r.id as string, src: 'cashback', date: r.received_on as string, ym: (r.received_on as string).slice(0, 7), direction: 'in', amount: num(r.amount), label: (r.note as string) || 'Cashback' })
  for (const r of inc.data ?? []) out.push({ id: r.id as string, src: 'pemasukan', date: null, ym: r.ym as string, direction: r.kind === 'masuk' ? 'in' : 'out', amount: num(r.amount), label: r.label as string })
  if ((cards.data ?? []).length) {
    const ids = (cards.data ?? []).map((b) => b.id as string)
    const { data: cp } = await sb.from('bill_payments').select('bill_id,ym,paid_on,amount').eq('owner_id', owner).in('bill_id', ids)
    const rows = cardRestores((cp ?? []).map((r) => ({ ...r, amount: num(r.amount) })) as never, (cards.data ?? []).map((b) => ({ id: b.id as string, kind: b.kind as string, principal: num(b.principal), card_pocket_id: b.card_pocket_id as string })))
    rows.filter((r) => r.paid_on >= from && r.paid_on <= to).forEach((r, i) => out.push({ id: `kartu-${i}`, src: 'kartu', date: r.paid_on, ym: r.paid_on.slice(0, 7), direction: 'in', amount: r.amount, label: 'Bayar tagihan kartu' }))
  }
  return out.filter((m) => m.amount > 0)
}

export async function reconcileStatement(sb: SupabaseClient, owner: string, s: { pocket_id: string | null; period: string; pocket_kind: string }, txns: RecTxn[]): Promise<(RecResult & { from: string; to: string }) | null> {
  if (!s.pocket_id) return null
  const { from, to } = statementWindow(s, txns)
  const moves = await pocketMovements(sb, owner, s.pocket_id, from, to)
  return { ...reconcile(txns, moves, isCreditKind(s.pocket_kind) ? 5 : 3), from, to }
}
