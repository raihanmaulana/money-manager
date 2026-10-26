'use client'
import { useEffect, useState } from 'react'
import { Download, LockOpen } from 'lucide-react'
import { isEncryptedPdf, unlockPdf } from '@/lib/pdf-unlock'
import { useBusyTransition } from './Busy'
import { PdfDrop } from './PdfDrop'

/** Buka kunci PDF di browser lalu unduh. Tidak ada yang dikirim ke server. */
export function UnlockTool() {
  const [file, setFile] = useState<File | null>(null)
  const [enc, setEnc] = useState<boolean | null>(null)
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState('')
  const [out, setOut] = useState<{ url: string; name: string } | null>(null)
  const [busy, start] = useBusyTransition(true)
  useEffect(() => () => { if (out) URL.revokeObjectURL(out.url) }, [out])

  const pick = async (f: File | null, error?: string) => {
    setMsg(error ?? ''); setPw(''); setOut(null); setFile(f); setEnc(null)
    if (f) setEnc(await isEncryptedPdf(f))
  }
  const run = () => start(async () => {
    if (!file) return
    setMsg('')
    const r = await unlockPdf(file, pw)
    if (!r.ok) return setMsg(r.reason === 'password' ? 'Password salah atau file rusak. Coba lagi.' : 'File tidak bisa dibuka kuncinya.')
    setOut({ url: URL.createObjectURL(r.file), name: r.file.name })
  })
  return (
    <div className="stack">
      <p className="hint">Buka kunci PDF statement yang diberi password, lalu unduh versi tanpa password. Semua diproses di browser Anda: file dan password tidak dikirim ke server. Untuk langsung mengarsipkan, lampirkan PDF terkunci di form statement di atas, nanti dibuka kuncinya di sana.</p>
      <PdfDrop file={file} onFile={pick} label="Pilih PDF terkunci" />
      {file && enc === false ? <p className="hint">PDF ini tidak memakai password, tidak perlu dibuka kuncinya.</p> : null}
      {file && enc ? (
        <div className="cluster">
          <input className="input" type="password" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password PDF" aria-label="Password PDF" style={{ maxWidth: '14rem' }} />
          <button type="button" className="btn small" onClick={run} disabled={busy} aria-busy={busy}><LockOpen aria-hidden size={16} /> {busy ? 'Membuka…' : 'Buka kunci'}</button>
        </div>
      ) : null}
      {msg ? <p className="form-msg err" role="alert">{msg}</p> : null}
      {out ? <div className="cluster"><a className="btn small" href={out.url} download={out.name}><Download aria-hidden size={16} /> Unduh {out.name}</a></div> : null}
    </div>
  )
}
