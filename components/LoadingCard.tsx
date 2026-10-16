'use client'
import { useEffect, useState } from 'react'

/** Garis arus yang tergambar berulang, dengan titik yang berdenyut di ujungnya. */
export function LoaderMark() {
  return (
    <svg className="load-mark" viewBox="0 0 32 32" aria-hidden="true">
      <rect className="lm-bg" width="32" height="32" rx="8" />
      <path className="lm-line" pathLength="100" d="M7 21.5c3.2 0 3.6-7 7-7s3.8 5 7 5c1.6 0 2.7-1.2 4-3.5" />
      <circle className="lm-dot" cx="25" cy="16" r="2.6" />
    </svg>
  )
}

export function stageLabel(pct: number) {
  if (pct >= 100) return 'Selesai'
  if (pct >= 85) return 'Hampir selesai'
  if (pct >= 55) return 'Menyimpan perubahan'
  if (pct >= 25) return 'Memproses data'
  return 'Menyiapkan'
}

/** Kemajuan semu: merayap mendekati 92% dan baru 100% saat prosesnya benar-benar selesai. */
export function useCreepingProgress(active: boolean, start = 8) {
  const [pct, setPct] = useState(start)
  useEffect(() => {
    if (!active) return
    const t = setInterval(() => setPct((p) => Math.min(92, p + Math.max(0.35, (92 - p) * 0.06))), 90)
    return () => clearInterval(t)
  }, [active])
  return [pct, setPct] as const
}

export function LoadingCard({ pct, title, hint = 'Mohon tunggu sebentar.' }: { pct: number; title?: string; hint?: string }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)))
  return (
    <div className="load-card" role="status" aria-live="polite">
      <div className="load-head">
        <LoaderMark />
        <div className="load-text">
          <b>{title ?? stageLabel(p)}…</b>
          <span>{hint}</span>
        </div>
        <span className="load-pct mono" aria-hidden>{p}%</span>
      </div>
      <div className="load-track" role="progressbar" aria-label="Kemajuan" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p}>
        <i style={{ transform: `scaleX(${p / 100})` }} />
      </div>
    </div>
  )
}
