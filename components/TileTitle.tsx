import type { LucideIcon } from 'lucide-react'

/** Judul kartu dengan lencana ikon, supaya tiap kartu mudah dibedakan sekilas. */
export function TileTitle({ id, icon: Icon, lead, children }: { id?: string; icon: LucideIcon; lead?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="tile-title" id={id}>
      {lead ?? <span className="badge" aria-hidden><Icon size={18} strokeWidth={2.3} /></span>}
      <span>{children}</span>
    </h2>
  )
}
