import { Home, NotebookPen, Receipt, PieChart, PiggyBank, TrendingUp, Settings, Landmark, FileText, Download, type LucideIcon } from 'lucide-react'

export type NavItem = { href: string; label: string; Icon: LucideIcon; hint?: string }

export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Ringkasan', Icon: Home, hint: 'Sisa jatah, tagihan, peringatan' },
  { href: '/dashboard/catatan', label: 'Catatan', Icon: NotebookPen, hint: 'Pengeluaran harian dan berulang' },
  { href: '/dashboard/tagihan', label: 'Tagihan', Icon: Receipt, hint: 'Tagihan, cicilan, hutang, kartu kredit' },
  { href: '/dashboard/anggaran', label: 'Anggaran', Icon: PieChart, hint: 'Pemasukan dan kategori per bulan' },
  { href: '/dashboard/tabungan', label: 'Tabungan', Icon: PiggyBank, hint: 'Target dan dana darurat' },
  { href: '/dashboard/sumber-dana', label: 'Sumber dana', Icon: Landmark, hint: 'Bank, e-wallet, tunai' },
  { href: '/dashboard/investasi', label: 'Investasi', Icon: TrendingUp, hint: 'Simulasi sederhana' },
  { href: '/dashboard/laporan', label: 'Laporan', Icon: FileText, hint: 'Ringkasan siap cetak' },
  { href: '/dashboard/pengaturan', label: 'Pengaturan', Icon: Settings, hint: 'Akun dan sinkron Google Sheet' },
]

export const ACTIONS: (NavItem & { download?: boolean })[] = [
  { href: '/dashboard/catatan', label: 'Catat pengeluaran', Icon: NotebookPen },
  { href: '/dashboard/ekspor', label: 'Unduh catatan (CSV)', Icon: Download, download: true },
  { href: '/dashboard/ekspor?jenis=tagihan', label: 'Unduh tagihan (CSV)', Icon: Download, download: true },
]

export const isActive = (path: string, href: string) => (href === '/dashboard' ? path === '/dashboard' : path === href || path.startsWith(href + '/'))
