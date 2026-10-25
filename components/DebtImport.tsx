'use client'
import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, FileUp, Upload, X } from 'lucide-react'
import { parseDebtUpload, importDebtRows } from '@/lib/debt-actions'
import { rp } from '@/lib/calc'
import type { DebtImportRow } from '@/lib/debt'
import { useBusyTransition } from './Busy'
import { useToast } from './Toast'

const tgl = (iso: string) => `${Number(iso.slice(8))}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`

/** Unduh template Excel, unggah file isian, lihat pratinjau, lalu simpan. */
export function DebtImport({ personId, personName }: { personId: string; personName: string }) {
  const [rows, setRows] = useState<DebtImportRow[] | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [msg, setMsg] = useState('')
  const [reading, readStart] = useBusyTransition(true)
  const [saving, saveStart] = useBusyTransition(true)
  const file = useRef<HTMLInputElement>(null)
  const [picked, setPicked] = useState<{ name: string; size: number } | null>(null)
  const [drag, setDrag] = useState(false)
  const toast = useToast()

  const reset = () => { setRows(null); setErrors([]); setMsg('') }
  const clearFile = () => { if (file.current) file.current.value = ''; setPicked(null) }
  const take = (f?: File | null) => { reset(); setPicked(f ? { name: f.name, size: f.size } : null) }
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files?.[0]
    if (!f || !file.current) return
    const dt = new DataTransfer(); dt.items.add(f); file.current.files = dt.files; take(f)
  }
  const read = () => readStart(async () => {
    setMsg(''); setRows(null); setErrors([])
    const f = file.current?.files?.[0]
    if (!f) return setMsg('Pilih file Excel (.xlsx) dulu.')
    const fd = new FormData(); fd.set('file', f); fd.set('person', personName)
    const r = await parseDebtUpload(fd)
    if (r.error) return setMsg(r.error)
    setRows(r.rows); setErrors(r.errors)
    if (!r.rows.length) setMsg('Tidak ada baris yang valid. Cek pesan di bawah.')
  })
  const save = () => saveStart(async () => {
    if (!rows?.length) return
    const r = await importDebtRows(personId, rows)
    if (r.error) return setMsg(r.error)
    toast(`${r.added} baris ditambahkan${r.skipped ? `, ${r.skipped} dilewati (sudah ada)` : ''}`)
    setRows(null); setErrors([]); clearFile()
  })

  const me = rows?.filter((r) => r.paid_by === 'me') ?? []
  const them = rows?.filter((r) => r.paid_by === 'them') ?? []
  return (
    <div className="stack">
      <p className="hint">Isi template lalu unggah. Kolom: Tanggal, Kegiatan, Harga, Bagian ditagih (angka, Penuh, Dibagi 2, atau Gratis), Keterangan, dan Dibayar oleh (Saya atau {personName}). Baris yang sama persis dengan yang sudah ada dilewati.</p>
      <div className="cluster">
        <a className="btn small ghost" href={`/dashboard/hutang/template?nama=${encodeURIComponent(personName)}`} download><Download aria-hidden size={16} /> Unduh template</a>
        <button type="button" className="btn small" onClick={read} disabled={reading || !picked} aria-busy={reading}><FileUp aria-hidden size={16} /> {reading ? 'Membaca…' : 'Baca file'}</button>
      </div>
      <label className={`file-drop${drag ? ' over' : ''}${picked ? ' has' : ''}`} onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={onDrop}>
        <input ref={file} className="file-input" type="file" accept=".xlsx" aria-label="File Excel hutang" onChange={(e) => take(e.target.files?.[0])} />
        {picked ? <FileSpreadsheet aria-hidden size={26} /> : <Upload aria-hidden size={26} />}
        <span className="file-text">
          {picked ? <><b>{picked.name}</b><small>{(picked.size / 1024).toFixed(picked.size < 10240 ? 1 : 0)} KB · klik untuk mengganti</small></> : <><b>Pilih file Excel</b><small>atau seret file .xlsx ke sini</small></>}
        </span>
        {picked ? <button type="button" className="btn icon" aria-label="Hapus file pilihan" onClick={(e) => { e.preventDefault(); clearFile(); reset() }}><X aria-hidden size={18} /></button> : null}
      </label>
      {msg ? <p className="form-msg err" role="alert">{msg}</p> : null}
      {rows?.length ? (
        <div className="stack">
          <p><b>{rows.length} baris siap disimpan</b> · {me.length} dibayar saya, {them.length} dibayar {personName}</p>
          <div className="table-wrap">
            <table className="report-table">
              <thead><tr><th>Tanggal</th><th>Kegiatan</th><th className="r">Harga</th><th className="r">Ditagih</th><th>Oleh</th></tr></thead>
              <tbody>{rows.slice(0, 12).map((r, i) => <tr key={i}><td className="nowrap">{tgl(r.entry_on)}</td><td>{r.title}</td><td className="r">{rp(r.amount)}</td><td className="r">{rp(r.share)}</td><td>{r.paid_by === 'me' ? 'Saya' : personName}</td></tr>)}</tbody>
            </table>
          </div>
          {rows.length > 12 ? <p className="hint">… dan {rows.length - 12} baris lagi.</p> : null}
          <div className="cluster"><button type="button" className="btn small" onClick={save} disabled={saving} aria-busy={saving}>{saving ? 'Menyimpan…' : `Simpan ${rows.length} baris`}</button></div>
        </div>
      ) : null}
      {errors.length ? <ul className="hint" aria-label="Baris yang dilewati">{errors.slice(0, 10).map((e, i) => <li key={i} className="form-msg err">{e}</li>)}{errors.length > 10 ? <li>… dan {errors.length - 10} lainnya.</li> : null}</ul> : null}
    </div>
  )
}
