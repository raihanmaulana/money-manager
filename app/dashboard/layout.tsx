import Link from 'next/link'
import { getCtx } from '@/lib/data'
import { LogoutButton } from '@/components/LogoutButton'
import { RailNav, TabBar } from '@/components/Nav'
import { CommandPaletteTrigger } from '@/components/CommandPalette'
import { Mark } from '@/components/Mark'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getCtx()
  return (
    <div className="shell">
      <aside className="rail">
        <Link href="/dashboard" className="brand" aria-label="Arus, ke ringkasan">
          <Mark />
          <span><b>Arus</b><small>money manager</small></span>
        </Link>
        <CommandPaletteTrigger />
        <RailNav />
        <div className="rail-foot">
          <div className="who"><strong>{ctx.nama}</strong><span>{ctx.email}</span></div>
          <LogoutButton className="btn ghost small full" icon />
        </div>
      </aside>
      <div>
        <main className="main" id="isi">
          <div className="mobile-head">
            <Link href="/dashboard" className="brand" aria-label="Arus, ke ringkasan"><Mark /><span><b>Arus</b></span></Link>
            <CommandPaletteTrigger />
          </div>
          {children}
        </main>
      </div>
      <TabBar />
    </div>
  )
}
