import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { isYm, pocketBalances, ymOfDate } from './calc.ts'
import { queryPockets } from './pockets.ts'
import { ensureRecurring } from './recurring.ts'
import { supabaseServer } from './supabase/server.ts'
import * as demo from './demo.ts'
import type { Bill, BillMonth, BillPayment, BudgetItem, Expense, Goal, GoalDeposit, IncomeItem, MonthData, PocketAdjustment, NeedItem, NeedPurchase, PocketView, Recurring, Split, Transfer, DebtEntry, DebtPayment, DebtPerson, Statement, StatementTxn } from './types.ts'

export const DEMO = process.env.DEMO_MODE === '1'

export type Ctx = {
  userId: string
  email: string
  nama: string
  ym: string
  today: { ym: string; day: number; iso: string }
}

const num = (v: unknown) => Number(v ?? 0)

export const getCtx = cache(async (): Promise<Ctx> => {
  const store = await cookies()
  const today = ymOfDate(new Date())
  const cm = store.get('ym')?.value
  const ym = cm && isYm(cm) ? cm : today.ym

  if (DEMO) return { userId: 'demo', email: 'demo@example.com', nama: 'Raihan', ym, today }

  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/masuk')

  // pastikan profil ada
  const { data: prof } = await sb.from('profiles').select('id, nama').eq('id', user.id).maybeSingle()
  let nama = (prof?.nama as string | undefined) ?? ''
  if (!prof) {
    nama = (user.user_metadata?.nama as string | undefined) || (user.email ?? '').split('@')[0]
    await sb.from('profiles').upsert({ id: user.id, nama })
  }
  return { userId: user.id, email: user.email ?? '', nama: nama || 'Saya', ym, today }
})

export async function loadMonth(ctx: Ctx): Promise<MonthData> {
  const { ym } = ctx
  if (DEMO) {
    return {
      ym,
      income: ym >= '2026-10' ? demo.demoIncome(ym) : [],
      budget: ym >= '2026-10' ? demo.demoBudget(ym) : [],
      expenses: ym === '2026-10' ? demo.demoExpenses(ym).map((e) => ({ ...e, credit: e.pocket_id === 'p5' })) : [],
      bills: demo.demoBills,
      billMonths: demo.demoBillMonths,
      payments: demo.demoPayments.filter((p) => p.ym === ym),
    }
  }
  const sb = await supabaseServer()
  const o = ctx.userId
  await ensureRecurring(sb, o, ym, ctx.today.iso, ctx.email)
  const [inc, bud, exp, bills, bms, pays, creditP] = await Promise.all([
    sb.from('income_items').select('*').eq('owner_id', o).eq('ym', ym).order('sort').order('label'),
    sb.from('budget_items').select('*').eq('owner_id', o).eq('ym', ym).order('sort').order('label'),
    sb.from('expenses').select('*').eq('owner_id', o).eq('ym', ym).order('spent_on', { ascending: false }).order('created_at', { ascending: false }),
    sb.from('bills').select('*').eq('owner_id', o).order('due_day'),
    sb.from('bill_months').select('*').eq('owner_id', o).eq('ym', ym),
    sb.from('bill_payments').select('*').eq('owner_id', o).eq('ym', ym).order('paid_on').order('created_at'),
    sb.from('pockets').select('id').eq('owner_id', o).in('kind', ['kredit', 'paylater']),
  ])
  const credit = new Set((creditP.data ?? []).map((x) => x.id as string))
  // Kartu kredit membawa sisa tagihan antarbulan, jadi butuh status bulan-bulan sebelumnya juga.
  const cardIds = (bills.data ?? []).filter((b) => b.kind === 'kartu').map((b) => b.id as string)
  const older = cardIds.length ? (await sb.from('bill_months').select('*').eq('owner_id', o).in('bill_id', cardIds).lt('ym', ym)).data ?? [] : []
  return {
    ym,
    income: (inc.data ?? []).map((r) => ({ ...r, amount: num(r.amount) })) as IncomeItem[],
    budget: (bud.data ?? []).map((r) => ({ ...r, amount: num(r.amount) })) as BudgetItem[],
    expenses: (exp.data ?? []).map((r) => ({ ...r, amount: num(r.amount), credit: !!r.pocket_id && credit.has(r.pocket_id as string) })) as Expense[],
    bills: (bills.data ?? []).map((r) => ({ ...r, amount: num(r.amount), min_payment: num(r.min_payment ?? 0) })) as Bill[],
    billMonths: [...(bms.data ?? []), ...older].map((r) => ({ ...r, amount_override: r.amount_override == null ? null : num(r.amount_override), paid_amount: num(r.paid_amount ?? 0) })) as BillMonth[],
    payments: (pays.data ?? []).map((r) => ({ ...r, amount: num(r.amount) })) as BillPayment[],
  }
}

export async function loadGoals(ctx: Ctx): Promise<{ goals: Goal[]; deposits: GoalDeposit[] }> {
  if (DEMO) return { goals: demo.demoGoals, deposits: demo.demoDeposits }
  const sb = await supabaseServer()
  const [g, d] = await Promise.all([
    sb.from('goals').select('*').eq('owner_id', ctx.userId).order('created_at'),
    sb.from('goal_deposits').select('*').eq('owner_id', ctx.userId).order('created_at', { ascending: false }),
  ])
  return {
    goals: (g.data ?? []).map((r) => ({ ...r, target: num(r.target) })) as Goal[],
    deposits: (d.data ?? []).map((r) => ({ ...r, amount: num(r.amount) })) as GoalDeposit[],
  }
}

/** Sumber dana beserta saldo (dihitung dari semua catatan yang memilih sumber itu) dan riwayat pindah dana. */
export async function loadPockets(ctx: Ctx): Promise<{ pockets: PocketView[]; transfers: Transfer[]; adjustments: PocketAdjustment[] }> {
  if (DEMO) {
    const transfers = demo.demoTransfers
    return { pockets: pocketBalances(demo.demoPockets, demo.demoIncome('2026-10'), demo.demoExpenses('2026-10'), demo.demoDeposits, transfers, ctx.today, demo.demoPayments, [], demo.demoPayments.filter((x) => x.bill_id === 'l5').map((x) => ({ paid_on: x.paid_on, amount: x.amount, card_pocket_id: 'p5' }))), transfers, adjustments: [] }
  }
  return queryPockets(await supabaseServer(), ctx.userId, ctx.today)
}

/** Daftar pengeluaran berulang . */
export async function loadRecurring(ctx: Ctx): Promise<Recurring[]> {
  if (DEMO) return demo.demoRecurring
  const sb = await supabaseServer()
  const { data } = await sb.from('recurring_expenses').select('*').eq('owner_id', ctx.userId).order('day').order('created_at')
  return (data ?? []).map((r) => ({ ...r, amount: num(r.amount), skipped_ym: r.skipped_ym ?? [] })) as Recurring[]
}

/** Daftar split bill (patungan) pada bulan yang dipilih. */
export async function loadSplits(ctx: Ctx): Promise<Split[]> {
  if (DEMO) return demo.demoSplits(ctx.ym)
  const sb = await supabaseServer()
  const { data } = await sb.from('split_bills').select('*').eq('owner_id', ctx.userId).eq('ym', ctx.ym).order('split_on', { ascending: false }).order('created_at', { ascending: false })
  return (data ?? []).map((r) => ({ ...r, amount: num(r.amount) })) as Split[]
}

/** List kebutuhan (barang berulang) dan pembelian bulan yang dipilih. */
export async function loadNeeds(ctx: Ctx): Promise<{ items: NeedItem[]; purchases: NeedPurchase[] }> {
  if (DEMO) return { items: demo.demoNeeds, purchases: demo.demoNeedPurchases(ctx.ym) }
  const sb = await supabaseServer()
  const [i, p] = await Promise.all([
    sb.from('need_items').select('*').eq('owner_id', ctx.userId).order('category').order('created_at'),
    sb.from('need_purchases').select('*').eq('owner_id', ctx.userId).eq('ym', ctx.ym),
  ])
  return {
    items: (i.data ?? []).map((r) => ({ ...r, est_price: num(r.est_price), qty: num(r.qty) })) as NeedItem[],
    purchases: (p.data ?? []).map((r) => ({ ...r, qty: num(r.qty), unit_price: num(r.unit_price), total: num(r.total), est_total: num(r.est_total) })) as NeedPurchase[],
  }
}

export async function prevMonthHasData(ctx: Ctx, prev: string): Promise<boolean> {
  if (DEMO) return prev >= '2026-10'
  const sb = await supabaseServer()
  const { count } = await sb.from('income_items').select('id', { count: 'exact', head: true }).eq('owner_id', ctx.userId).eq('ym', prev)
  return !!count
}

export async function loadTelegram(ctx: Ctx): Promise<string | null> {
  if (DEMO) return null
  const sb = await supabaseServer()
  const { data } = await sb.from('user_telegram').select('chat_id').eq('owner_id', ctx.userId).maybeSingle()
  return (data?.chat_id as string | undefined) ?? null
}

// ── Hutang Split Bill ────────────────────────────────────────────────

/** Apakah menu Hutang Split Bill diaktifkan (Pengaturan). Tabel belum ada → dianggap mati. */
export async function loadDebtMenu(): Promise<boolean> {
  if (DEMO) return (await cookies()).get('arus.debt')?.value === '1'
  try {
    const sb = await supabaseServer()
    const { data: { user } } = await sb.auth.getUser()
    if (!user) return false
    const { data } = await sb.from('user_prefs').select('debt_menu').eq('owner_id', user.id).maybeSingle()
    return !!data?.debt_menu
  } catch { return false }
}

async function splitEntries(sb: Awaited<ReturnType<typeof supabaseServer>>, owner: string, name: string, personId: string): Promise<DebtEntry[]> {
  const { data } = await sb.from('split_bills').select('*').eq('owner_id', owner).order('split_on', { ascending: false })
  const mine = (data ?? []).filter((r) => String(r.name ?? '').trim().toLowerCase() === name.trim().toLowerCase())
  if (!mine.length) return []
  const ids = [...new Set(mine.map((r) => r.expense_id as string | null).filter(Boolean))] as string[]
  const ex = ids.length ? (await sb.from('expenses').select('id,amount,note').in('id', ids).eq('owner_id', owner)).data ?? [] : []
  const byId = new Map(ex.map((e) => [e.id as string, e]))
  return mine.map((r) => {
    const e = r.expense_id ? byId.get(r.expense_id as string) : undefined
    const share = num(r.amount)
    return { id: `sp-${r.id}`, person_id: personId, paid_by: 'me' as const, entry_on: r.split_on as string, title: ((e?.note as string) || (r.note as string) || 'Split bill') as string, amount: e ? Math.max(num(e.amount), share) : share, share, note: (r.note as string) ?? '', fromSplit: true }
  })
}

export type DebtRow = { person: DebtPerson; owedToMe: number; owedByMe: number; net: number; count: number }

export async function loadDebtPeople(ctx: Ctx): Promise<DebtRow[]> {
  const { debtSummary } = await import('./debt.ts')
  if (DEMO) {
    return demo.demoDebtPeople.map((p) => {
      const ent = demo.demoDebtEntries().filter((e) => e.person_id === p.id)
      const sp = p.name === 'Dimas' ? demo.demoSplits(ctx.ym).filter((s) => s.name === p.name).map((s) => ({ paid_by: 'me' as const, share: s.amount })) : []
      const s = debtSummary([...ent, ...sp], demo.demoDebtPayments().filter((x) => x.person_id === p.id))
      return { person: p, owedToMe: s.owedToMe, owedByMe: s.owedByMe, net: s.net, count: ent.length + sp.length }
    })
  }
  const sb = await supabaseServer()
  const [pe, en, pa, sp] = await Promise.all([
    sb.from('debt_people').select('id,name').eq('owner_id', ctx.userId).order('created_at'),
    sb.from('debt_entries').select('person_id,paid_by,share').eq('owner_id', ctx.userId),
    sb.from('debt_payments').select('person_id,direction,amount').eq('owner_id', ctx.userId),
    sb.from('split_bills').select('name,amount').eq('owner_id', ctx.userId),
  ])
  return ((pe.data ?? []) as DebtPerson[]).map((p) => {
    const ent = (en.data ?? []).filter((e) => e.person_id === p.id).map((e) => ({ paid_by: e.paid_by as 'me' | 'them', share: num(e.share) }))
    const auto = (sp.data ?? []).filter((r) => String(r.name ?? '').trim().toLowerCase() === p.name.trim().toLowerCase()).map((r) => ({ paid_by: 'me' as const, share: num(r.amount) }))
    const pay = (pa.data ?? []).filter((x) => x.person_id === p.id).map((x) => ({ direction: x.direction as 'them_to_me' | 'me_to_them', amount: num(x.amount) }))
    const s = debtSummary([...ent, ...auto], pay)
    return { person: p, owedToMe: s.owedToMe, owedByMe: s.owedByMe, net: s.net, count: ent.length + auto.length }
  })
}

export async function loadDebtPerson(ctx: Ctx, id: string): Promise<{ person: DebtPerson; entries: DebtEntry[]; payments: DebtPayment[] } | null> {
  if (DEMO) {
    const person = demo.demoDebtPeople.find((p) => p.id === id)
    if (!person) return null
    const auto: DebtEntry[] = person.name === 'Dimas'
      ? demo.demoSplits(ctx.ym).filter((s) => s.name === 'Dimas').map((s) => ({ id: `sp-${s.id}`, person_id: id, paid_by: 'me' as const, entry_on: s.split_on, title: 'Makan malam bareng teman', amount: 170_000, share: s.amount, note: s.note, fromSplit: true })) : []
    return { person, entries: [...demo.demoDebtEntries().filter((e) => e.person_id === id), ...auto], payments: demo.demoDebtPayments().filter((x) => x.person_id === id) }
  }
  const sb = await supabaseServer()
  const { data: person } = await sb.from('debt_people').select('id,name').eq('id', id).eq('owner_id', ctx.userId).maybeSingle()
  if (!person) return null
  const [en, pa, auto] = await Promise.all([
    sb.from('debt_entries').select('*').eq('person_id', id).eq('owner_id', ctx.userId).order('entry_on').order('created_at'),
    sb.from('debt_payments').select('*').eq('person_id', id).eq('owner_id', ctx.userId).order('paid_on').order('created_at'),
    splitEntries(sb, ctx.userId, person.name as string, id),
  ])
  const entries = [...((en.data ?? []).map((r) => ({ ...r, amount: num(r.amount), share: num(r.share) })) as DebtEntry[]), ...auto].sort((a, b) => a.entry_on.localeCompare(b.entry_on))
  return { person: person as DebtPerson, entries, payments: (pa.data ?? []).map((r) => ({ ...r, amount: num(r.amount) })) as DebtPayment[] }
}

// ── E-Statement ──────────────────────────────────────────────────────

export async function loadStatements(ctx: Ctx): Promise<Statement[]> {
  if (DEMO) return demo.demoStatements()
  try {
    const sb = await supabaseServer()
    const { data } = await sb.from('statements').select('*').eq('owner_id', ctx.userId).order('period', { ascending: false }).order('created_at', { ascending: false })
    return (data ?? []).map((r) => ({ ...r, opening: num(r.opening), total_in: num(r.total_in), total_out: num(r.total_out), closing: num(r.closing), min_payment: num(r.min_payment), file_size: num(r.file_size) })) as Statement[]
  } catch { return [] }
}

export async function loadStatementTxns(ctx: Ctx, statementId: string): Promise<StatementTxn[]> {
  if (DEMO) return demo.demoStatementTxns(statementId)
  try {
    const sb = await supabaseServer()
    const { data } = await sb.from('statement_txns').select('id,txn_on,kind,description,direction,amount,balance').eq('owner_id', ctx.userId).eq('statement_id', statementId).order('txn_on').order('created_at')
    return (data ?? []).map((r) => ({ ...r, amount: num(r.amount), balance: r.balance == null ? null : num(r.balance) })) as StatementTxn[]
  } catch { return [] }
}

/** Saldo semua sumber dana pada akhir bulan tertentu (untuk mencocokkan dengan saldo akhir statement). */
export async function loadPocketsAt(ctx: Ctx, ym: string): Promise<PocketView[]> {
  const last = new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7), 0)).getUTCDate()
  const at = { ym, iso: `${ym}-${String(last).padStart(2, '0')}` }
  if (DEMO) return (await loadPockets({ ...ctx, ym, today: { ...ctx.today, ym, iso: at.iso } })).pockets
  const sb = await supabaseServer()
  return (await queryPockets(sb, ctx.userId, at)).pockets
}
