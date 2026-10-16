'use client'
import { LoadingCard, useCreepingProgress } from '@/components/LoadingCard'

export default function Loading() {
  const [pct] = useCreepingProgress(true)
  return (
    <div className="page-loading" aria-label="Memuat halaman">
      <LoadingCard pct={pct} title="Memuat halaman" hint="Mengambil data terbaru Anda." />
      <div className="skel" style={{ height: '5.5rem' }} />
      <div className="skel" style={{ height: '12rem' }} />
    </div>
  )
}
