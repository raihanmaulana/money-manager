'use client'
import { createContext, useContext, type ReactNode } from 'react'
import { NAV } from './nav-items'

const Ctx = createContext({ debt: false })

/** Menu pilihan (mis. Hutang Split Bill) hanya muncul kalau diaktifkan di Pengaturan. */
export function NavPrefs({ debt, children }: { debt: boolean; children: ReactNode }) {
  return <Ctx.Provider value={{ debt }}>{children}</Ctx.Provider>
}

export function useNav() {
  const { debt } = useContext(Ctx)
  return NAV.filter((n) => !n.optional || (n.optional === 'debt' && debt))
}
