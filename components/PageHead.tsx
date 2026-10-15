import type { ReactNode } from 'react'
import { MonthSwitcher } from './MonthSwitcher'
import type { Ctx } from '@/lib/data'

export function PageHead({ ctx, title, sub, month = true, actions }: { ctx: Ctx; title: string; sub?: string; month?: boolean; actions?: ReactNode }) {
  return (
    <header className="topbar">
      <div>
        <div className="title-row"><h1 className="page-title">{title}</h1>{actions}</div>
        {sub ? <p className="page-sub">{sub}</p> : null}
      </div>
      <div className="cluster">
        {month ? <MonthSwitcher ym={ctx.ym} /> : null}
      </div>
    </header>
  )
}
