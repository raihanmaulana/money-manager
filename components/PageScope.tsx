'use client'
import type { CSSProperties, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { hueFor } from './nav-items'

/** Pembungkus aplikasi: memberi tiap halaman warna dasarnya sendiri lewat variabel --pg (hue OKLCH). */
export function PageScope({ children, className = '' }: { children: ReactNode; className?: string }) {
  const path = usePathname()
  return <div className={`page-scope ${className}`} style={{ ['--pg' as string]: hueFor(path) } as CSSProperties}>{children}</div>
}
