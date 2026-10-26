'use client'
import { useState } from 'react'
import { FileText, Upload, X } from 'lucide-react'

/** Kotak pilih atau seret file PDF. Mengembalikan File lewat onFile (null = dihapus). */
export function PdfDrop({ file, onFile, label = 'Pilih file PDF', maxMb = 10 }: { file: File | null; onFile: (f: File | null, error?: string) => void; label?: string; maxMb?: number }) {
  const [drag, setDrag] = useState(false)
  const take = (f?: File | null) => {
    if (!f) return onFile(null)
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') return onFile(null, 'File harus berformat PDF.')
    if (f.size > maxMb * 1024 * 1024) return onFile(null, `File terlalu besar (maksimal ${maxMb} MB).`)
    onFile(f)
  }
  return (
    <label className={`file-drop${drag ? ' over' : ''}${file ? ' has' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]) }}>
      <input className="file-input" type="file" accept="application/pdf,.pdf" aria-label={label} onChange={(e) => { take(e.target.files?.[0]); e.target.value = '' }} />
      {file ? <FileText aria-hidden size={26} /> : <Upload aria-hidden size={26} />}
      <span className="file-text">
        {file ? <><b>{file.name}</b><small>{(file.size / 1024).toFixed(file.size < 10240 ? 1 : 0)} KB · klik untuk mengganti</small></> : <><b>{label}</b><small>atau seret file .pdf ke sini (maksimal {maxMb} MB)</small></>}
      </span>
      {file ? <button type="button" className="btn icon" aria-label="Hapus file pilihan" onClick={(e) => { e.preventDefault(); onFile(null) }}><X aria-hidden size={18} /></button> : null}
    </label>
  )
}
