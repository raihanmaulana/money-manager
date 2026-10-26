export type Grp = 'kebutuhan' | 'gaya_hidup' | 'tabungan' | 'investasi'
export type BillKind = 'tagihan' | 'cicilan' | 'hutang' | 'kartu' | 'paylater'

export type IncomeItem = { id: string; ym: string; label: string; kind: 'masuk' | 'potong'; amount: number; sort: number; pocket_id?: string | null }
export type BudgetItem = { id: string; ym: string; grp: Grp; label: string; amount: number; sort: number }
export type Expense = { id: string; ym: string; spent_on: string; budget_item_id: string | null; note: string; amount: number; pocket_id?: string | null; transfer_id?: string | null; recurring_id?: string | null; credit?: boolean }
export type Bill = { id: string; name: string; kind: BillKind; amount: number; due_day: number; start_ym: string; end_ym: string | null; note: string; min_payment?: number; card_pocket_id?: string | null; principal?: number }
export type BillMonth = { bill_id: string; ym: string; amount_override: number | null; skipped: boolean; paid: boolean; paid_amount?: number }
export type Goal = { id: string; name: string; target: number; is_emergency: boolean }
export type GoalDeposit = { id: string; goal_id: string; ym: string; amount: number; note: string; pocket_id?: string | null }

export type PocketKind = 'bank' | 'ewallet' | 'tunai' | 'lainnya' | 'kredit' | 'paylater'
/** Sumber dana berlimit (kartu kredit, PayLater): tidak masuk saldo/anggaran, saldo = −terpakai. */
export const isCreditKind = (k?: string | null) => k === 'kredit' || k === 'paylater'
/** Untuk kartu kredit: opening_balance = pemakaian awal (terpakai), credit_limit = limit; saldo = −terpakai. */
export type Pocket = { id: string; name: string; kind: PocketKind; opening_balance: number; sort: number; credit_limit?: number; credit_since?: string | null }
export type Transfer = { id: string; from_pocket: string; to_pocket: string; amount: number; fee?: number; moved_on: string; note: string }
export type BillPayment = { id: string; bill_id: string; ym: string; amount: number; pocket_id: string | null; paid_on: string }
export type PocketAdjustment = { id: string; pocket_id: string; amount: number; note: string; adjusted_on: string }
export type Recurring = { id: string; note: string; amount: number; category_label: string; pocket_id: string | null; day: number; start_ym: string; end_ym: string | null; skipped_ym: string[] }
export type Split = { id: string; expense_id?: string | null; ym: string; split_on: string; name: string; amount: number; note: string }
export type NeedItem = { id: string; category: string; name: string; est_price: number; qty: number; remind_day: number | null; budget_label: string; pocket_id: string | null }
export type NeedPurchase = { id: string; item_id: string; ym: string; qty: number; unit_price: number; total: number; est_total: number; bought_on: string; expense_id: string | null }
export type PocketView = Pocket & { saldo: number }

export type MonthData = {
  ym: string
  income: IncomeItem[]
  budget: BudgetItem[]
  expenses: Expense[]
  bills: Bill[]
  billMonths: BillMonth[]
  payments: BillPayment[]
}

/** Hutang Split Bill: buku hutang piutang dengan satu orang. */
export type DebtPerson = { id: string; name: string }
export type DebtEntry = {
  id: string; person_id: string; paid_by: 'me' | 'them'; entry_on: string; title: string
  amount: number; share: number; note: string
  /** true = berasal dari split bill di Catatan (hanya baca di sini) */
  fromSplit?: boolean
}
export type DebtPayment = { id: string; person_id: string; direction: 'them_to_me' | 'me_to_them'; amount: number; paid_on: string; note: string; pocket_id?: string | null }

/** E-Statement: ringkasan statement bulanan per sumber dana (file PDF asli opsional di Storage). */
export type Statement = {
  id: string; pocket_id: string | null; pocket_name: string; pocket_kind: string; period: string
  opening: number; total_in: number; total_out: number; closing: number
  min_payment: number; due_on: string | null; note: string
  file_path: string | null; file_name: string; file_size: number
}
