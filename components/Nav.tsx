'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid } from 'lucide-react'
import { NAV, isActive } from './nav-items'

const MORE = ['/dashboard/lainnya', '/dashboard/tabungan', '/dashboard/sumber-dana', '/dashboard/investasi', '/dashboard/laporan', '/dashboard/pengaturan']

export function RailNav() {
  const path = usePathname()
  return (
    <div>
      <p className="label rail-label" id="nav-label">Menu</p>
      <nav className="nav" aria-labelledby="nav-label">
        {NAV.map(({ href, label, Icon, hue }) => (
          <Link key={href} href={href} style={{ ['--h' as string]: hue }} aria-current={isActive(path, href) ? 'page' : undefined}>
            <Icon aria-hidden strokeWidth={2} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  )
}

export function TabBar() {
  const path = usePathname()
  const main = NAV.slice(0, 4)
  return (
    <nav className="tabbar" aria-label="Menu utama">
      {main.map(({ href, label, Icon, hue }) => (
        <Link key={href} href={href} style={{ ['--h' as string]: hue }} aria-current={isActive(path, href) ? 'page' : undefined}>
          <Icon aria-hidden strokeWidth={2} />
          {label}
        </Link>
      ))}
      <Link href="/dashboard/lainnya" aria-current={MORE.some((m) => isActive(path, m)) ? 'page' : undefined}>
        <LayoutGrid aria-hidden strokeWidth={2} />
        Menu
      </Link>
    </nav>
  )
}
