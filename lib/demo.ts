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
  { id: 'e5', ym, spent_on: `${ym}-08`, budget_item_id: 'b1', note: 'Makan malam bareng teman', pocket_id: 'p3', amount: 85_000 },
]
export const demoBills: Bill[] = [
  { id: 'l1', name: 'Wifi kos', kind: 'tagihan', amount: 150_000, due_day: 5, start_ym: '2026-10', end_ym: null, note: '' },
  { id: 'l2', name: 'Pulsa / paket data', kind: 'tagihan', amount: 100_000, due_day: 12, start_ym: '2026-10', end_ym: null, note: '' },
  { id: 'l3', name: 'Cicilan HP', kind: 'cicilan', amount: 450_000, due_day: 20, start_ym: '2026-08', end_ym: '2027-01', note: '' },
  { id: 'l5', name: 'Kartu kredit BCA', kind: 'kartu', amount: 1_850_000, due_day: 17, start_ym: '2026-10', end_ym: null, note: '', min_payment: 185_000 },
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
