'use client'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { MonthSwitcher } from './MonthSwitcher'
import { NAV, isActive } from './nav-items'
import type { Ctx } from '@/lib/data'

export function PageHead({ ctx, title, sub, month = true, actions }: { ctx: Ctx; title: string; sub?: string; month?: boolean; actions?: ReactNode }) {
  const path = usePathname()
  const Icon = NAV.find((n) => isActive(path, n.href) && n.href !== '/dashboard')?.Icon ?? NAV[0].Icon
  return (
    <header className="topbar">
      <div className="head-main">
        <span className="head-ic" aria-hidden><Icon size={22} strokeWidth={1.9} /></span>
        <div className="head-text">
          <div className="title-row"><h1 className="page-title">{title}</h1>{actions}</div>
          {sub ? <p className="page-sub">{sub}</p> : null}
        </div>
      </div>
      {month ? <div className="cluster"><MonthSwitcher ym={ctx.ym} /></div> : null}
    </header>
  )
}
