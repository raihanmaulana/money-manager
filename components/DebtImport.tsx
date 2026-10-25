'use client'
import { useRef, useState } from 'react'
import { Download, FileUp } from 'lucide-react'
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
  const toast = useToast()

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
    setRows(null); setErrors([]); if (file.current) file.current.value = ''
  })

  const me = rows?.filter((r) => r.paid_by === 'me') ?? []
  const them = rows?.filter((r) => r.paid_by === 'them') ?? []
  return (
    <div className="stack">
      <p className="hint">Isi template lalu unggah. Kolom: Tanggal, Kegiatan, Harga, Bagian ditagih (angka, Penuh, Dibagi 2, atau Gratis), Keterangan, dan Dibayar oleh (Saya atau {personName}). Baris yang sama persis dengan yang sudah ada dilewati.</p>
      <div className="cluster">
        <a className="btn small ghost" href={`/dashboard/hutang/template?nama=${encodeURIComponent(personName)}`} download><Download aria-hidden size={16} /> Unduh template</a>
        <input ref={file} className="input" type="file" accept=".xlsx" aria-label="File Excel hutang" onChange={() => { setRows(null); setErrors([]); setMsg('') }} style={{ maxWidth: '18rem' }} />
        <button type="button" className="btn small" onClick={read} disabled={reading} aria-busy={reading}><FileUp aria-hidden size={16} /> {reading ? 'Membaca…' : 'Baca file'}</button>
      </div>
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
