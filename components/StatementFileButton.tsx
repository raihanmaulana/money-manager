'use client'
import { ExternalLink } from 'lucide-react'
import { statementFileUrl } from '@/lib/estatement-actions'
import { useBusyTransition } from './Busy'
import { useToast } from './Toast'

/** Buka PDF asli di tab baru lewat tautan sementara. */
export function StatementFileButton({ id, className = 'btn small ghost' }: { id: string; className?: string }) {
  const [pending, start] = useBusyTransition(true)
  const toast = useToast()
  return (
    <button type="button" className={className} aria-busy={pending} disabled={pending} onClick={() => start(async () => {
      const w = window.open('', '_blank')
      const r = await statementFileUrl(id)
      if (r.url && w) w.location.href = r.url
      else { w?.close(); toast(r.error ?? 'Gagal membuka file') }
    })}><ExternalLink aria-hidden size={16} /> Buka PDF</button>
  )
}
