'use client'
import { Printer } from 'lucide-react'

/** Cap waktu pembuatan (WIB) untuk nama file: "2026-11-03 18.16". */
const stamp = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 16).replace('T', ' ').replace(':', '.')

/** Cetak / simpan PDF. Nama file PDF mengikuti judul halaman, jadi judul diganti sementara dengan nama + waktu dibuat agar tidak menimpa file lama. */
export function PrintButton({ name = 'Laporan Arus' }: { name?: string }) {
  const print = () => {
    const old = document.title
    document.title = `${name} (dibuat ${stamp()})`
    const back = () => { document.title = old; window.removeEventListener('afterprint', back) }
    window.addEventListener('afterprint', back)
    window.print()
    setTimeout(back, 60_000)
  }
  return <button type="button" className="btn small no-print" onClick={print}><Printer aria-hidden size={16} /> Cetak / simpan PDF</button>
}
