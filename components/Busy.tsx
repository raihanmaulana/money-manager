'use client'
import { usePathname } from 'next/navigation'
import { LoadingCard } from './LoadingCard'
import { hueFor } from './nav-items'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from 'react'

type Ctl = { inc: (fast?: boolean) => void; dec: (fast?: boolean) => void }
const Busy = createContext<Ctl>({ inc() {}, dec() {} })

const SHOW_AFTER = 250 // ms: proses cepat tidak memunculkan popup (hindari berkedip)
const MIN_SHOW = 600 // ms: sekali muncul, tampil cukup lama agar tidak kelip

export function BusyProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)
  const [fast, setFast] = useState(0) // proses simpan/ubah/hapus: popup langsung muncul, tanpa menunggu
  const [visible, setVisible] = useState(false)
  const [pct, setPct] = useState(0)
  const path = usePathname()
  const shownAt = useRef(0)
  const inc = useCallback((f?: boolean) => { setCount((c) => c + 1); if (f) setFast((n) => n + 1) }, [])
  const dec = useCallback((f?: boolean) => { setCount((c) => Math.max(0, c - 1)); if (f) setFast((n) => Math.max(0, n - 1)) }, [])
  const ctl = useMemo(() => ({ inc, dec }), [inc, dec])

  useEffect(() => {
    if (count > 0 && !visible) {
      const t = setTimeout(() => { shownAt.current = Date.now(); setPct(14); setVisible(true) }, fast > 0 ? 0 : SHOW_AFTER)
      return () => clearTimeout(t)
    }
    if (count === 0 && visible) {
      setPct(100) // proses selesai: bar langsung penuh, lalu popup menutup
      const t = setTimeout(() => setVisible(false), Math.max(380, MIN_SHOW - (Date.now() - shownAt.current)))
      return () => clearTimeout(t)
    }
  }, [count, visible, fast])

  // Selama proses berjalan, bar merayap pelan mendekati 92% (tidak pernah "bohong" mencapai 100% sebelum selesai).
  useEffect(() => {
    if (!visible || count === 0) return
    const t = setInterval(() => setPct((p) => Math.min(92, p + Math.max(0.4, (92 - p) * 0.07))), 90)
    return () => clearInterval(t)
  }, [visible, count])

  return (
    <Busy.Provider value={ctl}>
      {children}
      {visible ? (
        <>
          <div className="busy-bar" aria-hidden="true"><i style={{ transform: `scaleX(${pct / 100})` }} /></div>
          <div className="busy page-scope" style={{ ['--pg' as string]: hueFor(path) } as React.CSSProperties}>
            <LoadingCard pct={pct} hint="Jangan tutup halaman ini." />
          </div>
        </>
      ) : null}
    </Busy.Provider>
  )
}

export const useBusy = () => useContext(Busy)

/** Pengganti useTransition: sambil berjalan, popup loading ikut muncul bila prosesnya lama. */
export function useBusyTransition(immediate = false) {
  const [pending, start] = useTransition()
  const { inc, dec } = useBusy()
  useEffect(() => {
    if (!pending) return
    inc(immediate)
    return () => dec(immediate)
  }, [pending, inc, dec, immediate])
  return [pending, start] as const
}

/** Tandai sibuk selama `active` true (untuk form: useFormStatus / useActionState). */
export function useBusyFlag(active: boolean, immediate = false) {
  const { inc, dec } = useBusy()
  useEffect(() => {
    if (!active) return
    inc(immediate)
    return () => dec(immediate)
  }, [active, inc, dec, immediate])
}
