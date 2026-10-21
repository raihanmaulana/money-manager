import { Home, NotebookPen, Receipt, PieChart, PiggyBank, TrendingUp, Settings, Landmark, ListTodo, FileText, Download, type LucideIcon } from 'lucide-react'

export type NavItem = { href: string; label: string; Icon: LucideIcon; hint?: string; hue?: number }

export const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Ringkasan', Icon: Home, hue: 256, hint: 'Sisa jatah, tagihan, peringatan' },
  { href: '/dashboard/catatan', label: 'Catatan', Icon: NotebookPen, hue: 200, hint: 'Pengeluaran harian dan berulang' },
  { href: '/dashboard/tagihan', label: 'Tagihan', Icon: Receipt, hue: 55, hint: 'Tagihan, cicilan, hutang, kartu kredit' },
  { href: '/dashboard/anggaran', label: 'Anggaran', Icon: PieChart, hue: 290, hint: 'Pemasukan dan kategori per bulan' },
  { href: '/dashboard/kebutuhan', label: 'Kebutuhan', Icon: ListTodo, hue: 95, hint: 'Barang wajib beli tiap bulan' },
  { href: '/dashboard/tabungan', label: 'Tabungan', Icon: PiggyBank, hue: 150, hint: 'Target dan dana darurat' },
  { href: '/dashboard/sumber-dana', label: 'Sumber dana', Icon: Landmark, hue: 228, hint: 'Bank, e-wallet, tunai' },
  { href: '/dashboard/investasi', label: 'Investasi', Icon: TrendingUp, hue: 12, hint: 'Simulasi sederhana' },
  { href: '/dashboard/laporan', label: 'Laporan', Icon: FileText, hue: 258, hint: 'Ringkasan siap cetak' },
  { href: '/dashboard/pengaturan', label: 'Pengaturan', Icon: Settings, hue: 258, hint: 'Akun dan sinkron Google Sheet' },
]

export const ACTIONS: (NavItem & { download?: boolean })[] = [
  { href: '/dashboard/kebutuhan', label: 'Buka list kebutuhan', Icon: ListTodo },
  { href: '/dashboard/catatan', label: 'Catat pengeluaran', Icon: NotebookPen },
  { href: '/dashboard/ekspor', label: 'Unduh catatan (CSV)', Icon: Download, download: true },
  { href: '/dashboard/ekspor?jenis=tagihan', label: 'Unduh tagihan (CSV)', Icon: Download, download: true },
]

export const isActive = (path: string, href: string) => (href === '/dashboard' ? path === '/dashboard' : path === href || path.startsWith(href + '/'))

/** Warna halaman (hue OKLCH) menurut alamat; dipakai untuk memberi tiap menu identitasnya sendiri. */
export const hueFor = (path: string) => (NAV.find((n) => isActive(path, n.href) && n.href !== '/dashboard')?.hue ?? 256)
