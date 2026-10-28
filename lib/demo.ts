// Data contoh untuk DEMO_MODE=1 (hanya untuk melihat tampilan tanpa database).
import type { NeedItem, NeedPurchase, BillPayment, Recurring, Split, Bill, BillMonth, BudgetItem, Expense, Goal, GoalDeposit, IncomeItem, Pocket, Transfer } from './types.ts'

export const demoIncome = (ym: string): IncomeItem[] => [
  { id: 'i1', ym, label: 'Gaji kotor', kind: 'masuk', amount: 6_500_000, sort: 0, pocket_id: 'p1' },
  { id: 'i2', ym, label: 'Potongan PPh 21', kind: 'potong', amount: 65_000, sort: 1, pocket_id: 'p1' },
  { id: 'i3', ym, label: 'Potongan BPJS karyawan', kind: 'potong', amount: 195_000, sort: 2, pocket_id: 'p1' },
  { id: 'i4', ym, label: 'Uang bulanan dari orang tua', kind: 'masuk', amount: 1_500_000, sort: 3, pocket_id: 'p2' },
]
export const demoBudget = (ym: string): BudgetItem[] => [
  { id: 'b1', ym, grp: 'kebutuhan', label: 'Makan', amount: 1_600_000, sort: 0 },
  { id: 'b2', ym, grp: 'kebutuhan', label: 'Transport', amount: 600_000, sort: 1 },
  { id: 'b3', ym, grp: 'kebutuhan', label: 'Kos / kontribusi rumah', amount: 650_000, sort: 2 },
  { id: 'b4', ym, grp: 'gaya_hidup', label: 'Jajan dan hiburan', amount: 700_000, sort: 0 },
  { id: 'b5', ym, grp: 'gaya_hidup', label: 'Belanja', amount: 600_000, sort: 1 },
  { id: 'b6', ym, grp: 'tabungan', label: 'Dana darurat', amount: 1_000_000, sort: 0 },
  { id: 'b7', ym, grp: 'tabungan', label: 'Tujuan tertentu', amount: 500_000, sort: 1 },
  { id: 'b8', ym, grp: 'investasi', label: 'Reksa dana pasar uang', amount: 400_000, sort: 0 },
  { id: 'b9', ym, grp: 'investasi', label: 'Reksa dana indeks saham', amount: 400_000, sort: 1 },
  { id: 'b10', ym, grp: 'investasi', label: 'Emas', amount: 200_000, sort: 2 },
]
export const demoExpenses = (ym: string): Expense[] => [
  { id: 'e1', ym, spent_on: `${ym}-01`, budget_item_id: 'b1', note: 'Makan siang kantor', pocket_id: 'p2', amount: 35_000 },
  { id: 'e2', ym, spent_on: `${ym}-02`, budget_item_id: 'b2', note: 'Ojek online', pocket_id: 'p3', amount: 25_000 },
  { id: 'e3', ym, spent_on: `${ym}-04`, budget_item_id: 'b4', note: 'Kopi sore', pocket_id: 'p3', amount: 28_000 },
  { id: 'e4', ym, spent_on: `${ym}-07`, budget_item_id: 'b5', note: 'Skincare', pocket_id: 'p2', amount: 120_000 },
  { id: 'e5', ym, spent_on: `${ym}-08`, budget_item_id: 'b1', note: 'Makan malam bareng teman', pocket_id: 'p5', amount: 85_000 },
]
export const demoBills: Bill[] = [
  { id: 'l1', name: 'Wifi kos', kind: 'tagihan', amount: 150_000, due_day: 5, start_ym: '2026-10', end_ym: null, note: '' },
  { id: 'l2', name: 'Pulsa / paket data', kind: 'tagihan', amount: 100_000, due_day: 12, start_ym: '2026-10', end_ym: null, note: '' },
  { id: 'l3', name: 'Cicilan HP', kind: 'cicilan', amount: 450_000, due_day: 20, start_ym: '2026-08', end_ym: '2027-01', note: '' },
  { id: 'l5', name: 'Kartu kredit BCA', kind: 'kartu', amount: 1_850_000, due_day: 17, start_ym: '2026-10', end_ym: null, note: '', min_payment: 185_000, card_pocket_id: 'p5' },
  { id: 'l4', name: 'Pinjam ke teman', kind: 'hutang', amount: 200_000, due_day: 28, start_ym: '2026-10', end_ym: '2026-12', note: 'Untuk laptop' },
]
export const demoBillMonths: BillMonth[] = [
  { bill_id: 'l1', ym: '2026-10', amount_override: null, skipped: false, paid: true },
  { bill_id: 'l5', ym: '2026-10', amount_override: null, skipped: false, paid: false, paid_amount: 600_000 },
]
export const demoGoals: Goal[] = [
  { id: 'g1', name: 'Dana darurat', target: 15_000_000, is_emergency: true },
  { id: 'g2', name: 'Liburan', target: 3_000_000, is_emergency: false },
]
export const demoDeposits: GoalDeposit[] = [
  { id: 'd1', goal_id: 'g1', ym: '2026-10', amount: 1_000_000, note: '', pocket_id: 'p1' },
  { id: 'd2', goal_id: 'g2', ym: '2026-10', amount: 500_000, note: '', pocket_id: 'p1' },
]

export const demoPockets: Pocket[] = [
  { id: 'p1', name: 'BCA', kind: 'bank', opening_balance: 800_000, sort: 0 },
  { id: 'p2', name: 'GoPay', kind: 'ewallet', opening_balance: 50_000, sort: 1 },
  { id: 'p3', name: 'ShopeePay', kind: 'ewallet', opening_balance: 0, sort: 2 },
  { id: 'p4', name: 'Dompet tunai', kind: 'tunai', opening_balance: 150_000, sort: 3 },
  { id: 'p5', name: 'BRI CC', kind: 'kredit', opening_balance: 1_200_000, sort: 4, credit_limit: 5_000_000 },
]
export const demoTransfers: Transfer[] = [
  { id: 't1', from_pocket: 'p1', to_pocket: 'p3', amount: 300_000, fee: 2_500, moved_on: '2026-10-03', note: 'Isi saldo untuk jajan' },
]

export const demoPayments: BillPayment[] = [
  { id: 'bp1', bill_id: 'l5', ym: '2026-10', amount: 600_000, pocket_id: 'p1', paid_on: '2026-10-05' },
]
export const demoRecurring: Recurring[] = [
  { id: 'r1', note: 'Uang kos', amount: 900_000, category_label: 'Kos / kontribusi rumah', pocket_id: 'p1', day: 1, start_ym: '2026-10', end_ym: null, skipped_ym: [] },
]

export const demoSplits = (ym: string): Split[] => [
  { id: 'sp1', expense_id: 'e5', ym, split_on: `${ym}-08`, name: 'Dimas', amount: 85000, note: 'Makan malam bareng teman' },
  { id: 'sp2', expense_id: 'e5', ym, split_on: `${ym}-08`, name: 'Sari', amount: 85000, note: 'Makan malam bareng teman' },
  { id: 'sp3', ym, split_on: `${ym}-08`, name: 'Bagas', amount: 120000, note: 'Patungan tiket nonton' },
]

export const demoNeeds: NeedItem[] = [
  { id: 'n1', category: 'Kucing', name: 'Makanan kucing', est_price: 85_000, qty: 2, remind_day: 5, budget_label: 'Belanja', pocket_id: 'p2' },
  { id: 'n2', category: 'Kucing', name: 'Pasir tofu', est_price: 45_000, qty: 1, remind_day: 10, budget_label: 'Belanja', pocket_id: 'p2' },
  { id: 'n3', category: 'Dapur', name: 'Beras 5 kg', est_price: 70_000, qty: 1, remind_day: 3, budget_label: 'Makan', pocket_id: 'p3' },
  { id: 'n4', category: 'Dapur', name: 'Minyak goreng', est_price: 38_000, qty: 1, remind_day: 28, budget_label: 'Makan', pocket_id: 'p3' },
  { id: 'n5', category: 'Mandi', name: 'Sabun cair', est_price: 32_000, qty: 1, remind_day: null, budget_label: 'Belanja', pocket_id: 'p2' },
]
export const demoNeedPurchases = (ym: string): NeedPurchase[] => [
  { id: 'np1', item_id: 'n1', ym, qty: 2, unit_price: 80_000, total: 160_000, est_total: 170_000, bought_on: `${ym}-04`, expense_id: null },
  { id: 'np2', item_id: 'n3', ym, qty: 1, unit_price: 74_000, total: 74_000, est_total: 70_000, bought_on: `${ym}-03`, expense_id: null },
]

export const demoDebtPeople = [{ id: 'd1', name: 'Kartika' }, { id: 'd2', name: 'Dimas' }]
export const demoDebtEntries = (): import('./types.ts').DebtEntry[] => [
  { id: 'de1', person_id: 'd1', paid_by: 'me', entry_on: '2026-07-16', title: 'Bakso Samrat (Minjem)', amount: 100_000, share: 100_000, note: '' },
  { id: 'de2', person_id: 'd1', paid_by: 'me', entry_on: '2026-07-23', title: 'Pinjam', amount: 1_000_000, share: 1_000_000, note: '' },
  { id: 'de3', person_id: 'd1', paid_by: 'me', entry_on: '2026-08-01', title: 'Jakarta Aquarium', amount: 325_706, share: 162_853, note: '' },
  { id: 'de4', person_id: 'd1', paid_by: 'me', entry_on: '2026-08-01', title: 'Marilyn Hotel Serpong', amount: 294_306, share: 147_153, note: '' },
  { id: 'de5', person_id: 'd1', paid_by: 'me', entry_on: '2026-08-18', title: 'Warnet', amount: 154_700, share: 77_350, note: '' },
  { id: 'de6', person_id: 'd1', paid_by: 'me', entry_on: '2026-10-14', title: 'Warkop Bulungan', amount: 67_200, share: 30_000, note: '' },
  { id: 'de7', person_id: 'd1', paid_by: 'them', entry_on: '2026-08-18', title: 'Prodia', amount: 150_000, share: 150_000, note: '' },
  { id: 'de8', person_id: 'd1', paid_by: 'them', entry_on: '2026-08-19', title: 'Pizza', amount: 90_000, share: 0, note: 'Gratis' },
  { id: 'de9', person_id: 'd1', paid_by: 'them', entry_on: '2026-09-01', title: 'Bayar Hutang 500', amount: 500_000, share: 500_000, note: '' },
]
export const demoDebtPayments = (): import('./types.ts').DebtPayment[] => [
  { id: 'dp1', person_id: 'd1', direction: 'them_to_me', amount: 200_000, paid_on: '2026-10-10', note: 'Transfer' },
]

export const demoStatements = (): import('./types.ts').Statement[] => [
  { id: 'st1', pocket_id: 'p1', pocket_name: 'BCA', pocket_kind: 'bank', period: '2026-09', opening: 3_100_000, total_in: 7_150_000, total_out: 5_420_000, closing: 4_830_000, min_payment: 0, due_on: null, note: '', file_path: 'demo/st1.pdf', file_name: 'BCA-2026-09.pdf', file_size: 218_000 },
  { id: 'st2', pocket_id: 'p5', pocket_name: 'BRI CC', pocket_kind: 'kredit', period: '2026-09', opening: 1_000_000, total_in: 1_000_000, total_out: 2_001_271, closing: 2_001_271, min_payment: 200_000, due_on: '2026-10-06', note: 'Termasuk cicilan Credit to Cash', file_path: null, file_name: '', file_size: 0 },
  { id: 'st3', pocket_id: 'p1', pocket_name: 'BCA', pocket_kind: 'bank', period: '2026-08', opening: 2_500_000, total_in: 6_900_000, total_out: 6_300_000, closing: 3_100_000, min_payment: 0, due_on: null, note: '', file_path: 'demo/st3.pdf', file_name: 'BCA-2026-08.pdf', file_size: 196_000 },
]

export const demoStatementTxns = (id: string): import('./types.ts').StatementTxn[] => id !== 'st1' ? [] : [
  { id: 't1', txn_on: '2026-09-02', kind: 'Transfer masuk', description: 'Gaji September', direction: 'in', amount: 7_150_000, balance: 10_250_000 },
  { id: 't2', txn_on: '2026-09-05', kind: 'QRIS', description: 'Warung makan', direction: 'out', amount: 45_000, balance: 10_205_000 },
  { id: 't3', txn_on: '2026-09-10', kind: 'Transfer keluar', description: 'Bayar kos', direction: 'out', amount: 1_500_000, balance: 8_705_000 },
]

export const demoTemplate = (): import('./types.ts').TemplateLine[] => [
  { id: 'tp1', section: 'income', kind: 'masuk', grp: null, label: 'Gaji', amount: 6_500_000, pocket_id: 'p1', sort: 0 },
  { id: 'tp2', section: 'income', kind: 'potong', grp: null, label: 'BPJS', amount: 150_000, pocket_id: null, sort: 1 },
  { id: 'tp3', section: 'budget', kind: null, grp: 'kebutuhan', label: 'Makan', amount: 1_500_000, pocket_id: null, sort: 0 },
  { id: 'tp4', section: 'budget', kind: null, grp: 'tabungan', label: 'Dana darurat', amount: 500_000, pocket_id: null, sort: 1 },
]

export const demoReconcile = (s: import('./types.ts').Statement, txns: import('./types.ts').StatementTxn[]) => {
  if (!txns.length) return null
  const [a, b, c] = txns
  return {
    from: `${s.period}-01`, to: `${s.period}-30`,
    matched: [{ txn: b, move: { id: 'm1', src: 'catatan' as const, date: b.txn_on, ym: s.period, direction: 'out' as const, amount: b.amount, label: 'Makan siang' } },
              { txn: a, move: { id: 'm2', src: 'pemasukan' as const, date: null, ym: s.period, direction: 'in' as const, amount: a.amount, label: 'Gaji' } }],
    bankOnly: [c],
    appOnly: [{ id: 'm3', src: 'catatan' as const, date: `${s.period}-14`, ym: s.period, direction: 'out' as const, amount: 75_000, label: 'Parkir (salah catat?)' }],
  }
}

export const demoCashbacks = (): import('./types.ts').Cashback[] => [
  { id: 'cb1', pocket_id: 'p2', received_on: '2026-10-12', amount: 4_500, note: 'Cashback belanja' },
]
