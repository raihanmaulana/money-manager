import Link from 'next/link'
import { PiggyBank, TrendingUp, Settings, LogOut, Landmark, FileText, HandCoins } from 'lucide-react'
import { getCtx, loadDebtMenu } from '@/lib/data'
import { LogoutButton } from '@/components/LogoutButton'
import { PageHead } from '@/components/PageHead'

export default async function Lainnya() {
  const [ctx, debt] = await Promise.all([getCtx(), loadDebtMenu()])
  const links = [
    { href: '/dashboard/tabungan', label: 'Tabungan & dana darurat', Icon: PiggyBank },
    { href: '/dashboard/sumber-dana', label: 'Sumber dana (bank, e-wallet)', Icon: Landmark },
    ...(debt ? [{ href: '/dashboard/hutang', label: 'Hutang Split Bill', Icon: HandCoins }] : []),
    { href: '/dashboard/investasi', label: 'Simulasi investasi', Icon: TrendingUp },
    { href: '/dashboard/laporan', label: 'Laporan bulanan', Icon: FileText },
    { href: '/dashboard/pengaturan', label: 'Pengaturan', Icon: Settings },
  ]
  return (
    <>
      <PageHead ctx={ctx} title="Menu" month={false} />
      <div className="bento">
        <section className="tile s12" style={{ ['--i' as string]: 0 }}>
          <ul className="rows">
            {links.map(({ href, label, Icon }) => (
              <li key={href}><Icon aria-hidden size={20} /><Link href={href} className="grow name" style={{ textDecoration: 'none' }}>{label}</Link></li>
            ))}
            <li><LogOut aria-hidden size={20} />
              <span className="grow"><LogoutButton /></span>
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}
