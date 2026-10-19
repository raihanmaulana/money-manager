'use client'
import { Children, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

/** Menampilkan `limit` item pertama; sisanya lewat tombol "Lihat lebih banyak". */
export function ShowMore({ children, limit = 4, className = 'rows', noun = 'item' }: { children: ReactNode; limit?: number; className?: string; noun?: string }) {
  const items = Children.toArray(children)
  const [all, setAll] = useState(false)
  const hidden = items.length - limit
  const list = all || hidden <= 0 ? items : items.slice(0, limit)
  return (
    <>
      <ul className={className}>{list}</ul>
      {hidden > 0 ? (
        <button type="button" className="btn small ghost more-btn" onClick={() => setAll(!all)} aria-expanded={all}>
          {all ? <><ChevronUp aria-hidden size={16} /> Lihat lebih sedikit</> : <><ChevronDown aria-hidden size={16} /> Lihat {hidden} {noun} lainnya</>}
        </button>
      ) : null}
    </>
  )
}

/** Bagian yang bisa dilipat (mis. formulir tambahan) supaya halaman tidak terlalu panjang. */
export function Fold({ summary, children, defaultOpen = false }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="fold" open={defaultOpen}>
      <summary className="btn ghost full fold-sum">{summary}</summary>
      <div className="fold-body">{children}</div>
    </details>
  )
}
