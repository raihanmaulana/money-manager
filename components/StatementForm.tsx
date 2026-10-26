'use client'
import { useState } from 'react'
import { LockOpen, Plus, ScanText } from 'lucide-react'
import { saveStatement } from '@/lib/estatement-actions'
import { isEncryptedPdf, unlockPdf } from '@/lib/pdf-unlock'
import { readPdfPages } from '@/lib/pdf-read'
import { parseStatementPages, type ParsedStatement } from '@/lib/statement-parse'
import { rp } from '@/lib/calc'
import { isCreditKind } from '@/lib/types'
import { supabaseBrowser } from '@/lib/supabase/client'
import { useBusyTransition } from './Busy'
import { useToast } from './Toast'
import { PdfDrop } from './PdfDrop'
import { StatementFields } from './StatementFields'
import { ThemedSelect } from './ThemedSelect'

type P = { id: string; name: string; kind: string }

/** Tambah statement: pilih sumber dana dan periode, isi ringkasan, lampirkan PDF (bisa dibuka kuncinya dulu). */
export function StatementForm({ pockets, defaultPeriod, today, demo }: { pockets: P[]; defaultPeriod: string; today: string; demo: boolean }) {
  const [pocket, setPocket] = useState(pockets[0]?.id ?? '')
  const [file, setFile] = useState<File | null>(null)
  const [locked, setLocked] = useState(false)
  const [pw, setPw] = useState('')
  const [keep, setKeep] = useState(true)
  const [msg, setMsg] = useState('')
  const [round, setRound] = useState(0)
  const [period, setPeriod] = useState(defaultPeriod)
  const [parsed, setParsed] = useState<ParsedStatement | null>(null)
  const [useTxns, setUseTxns] = useState(true)
  const [fk, setFk] = useState(0)
  const [reading, startRead] = useBusyTransition(true)
  const [saving, startSave] = useBusyTransition(true)
  const [unlocking, startUnlock] = useBusyTransition(true)
  const toast = useToast()
  const kind = pockets.find((p) => p.id === pocket)?.kind ?? 'bank'

  /** Baca isi PDF di browser; kalau formatnya dikenali, isi form otomatis (tetap bisa diubah sebelum disimpan). */
  const analyze = (f: File) => startRead(async () => {
    setParsed(null)
    try {
      const r = parseStatementPages(await readPdfPages(f))
      if ('error' in r) return setMsg(`${r.error} Isi ringkasannya manual.`)
      const credit = r.type === 'kartu'
      const guess = pockets.find((p) => new RegExp(r.bank, "i").test(p.name) && isCreditKind(p.kind) === credit)
      if (guess) setPocket(guess.id)
      setPeriod(r.period); setParsed(r); setUseTxns(true); setFk((n) => n + 1)
      setMsg(guess ? '' : `Sumber dana ${r.bank} ${credit ? 'kartu kredit' : 'rekening'} tidak ditemukan otomatis. Pilih sumber dananya.`)
    } catch { setMsg('PDF tidak bisa dibaca otomatis. Isi ringkasannya manual.') }
  })

  const pick = async (f: File | null, error?: string) => {
    setMsg(error ?? ''); setPw(''); setFile(f); setLocked(false); setParsed(null)
    if (!f) return
    const enc = await isEncryptedPdf(f)
    setLocked(enc)
    if (!enc) analyze(f)
  }
  const unlock = () => startUnlock(async () => {
    if (!file) return
    setMsg('')
    const r = await unlockPdf(file, pw)
    if (!r.ok) return setMsg(r.reason === 'password' ? 'Password salah atau file rusak. Coba lagi.' : 'File tidak bisa dibuka kuncinya.')
    setFile(r.file); setLocked(false); setPw(''); toast('PDF terbuka'); analyze(r.file)
  })

  const submit = (fd: FormData) => startSave(async () => {
    setMsg('')
    if (!pocket) return setMsg('Pilih sumber dana dulu.')
    if (file && locked) return setMsg('PDF ini masih terkunci. Masukkan password lalu tekan "Buka kunci", atau hapus file-nya.')
    fd.set('pocket_id', pocket)
    if (parsed && useTxns && parsed.txns.length) fd.set('txns', JSON.stringify(parsed.txns))
    if (file && keep && !demo) {
      const sb = supabaseBrowser()
      const { data: { user } } = await sb.auth.getUser()
      if (!user) return setMsg('Sesi habis. Muat ulang halaman lalu masuk lagi.')
      const path = `${user.id}/${crypto.randomUUID()}.pdf`
      const up = await sb.storage.from('statements').upload(path, file, { contentType: 'application/pdf', upsert: false })
      if (up.error) return setMsg(/bucket not found/i.test(up.error.message) ? 'Penyimpanan belum disiapkan. Jalankan supabase/tambah-estatement.sql dulu.' : `Gagal mengunggah file: ${up.error.message}`)
      fd.set('file_path', path); fd.set('file_name', file.name); fd.set('file_size', String(file.size))
    }
    const r = await saveStatement(fd)
    if (typeof r === 'string') return setMsg(r)
    toast('Statement tersimpan')
    setFile(null); setLocked(false); setPw(''); setParsed(null); setPeriod(defaultPeriod); setRound((n) => n + 1)
  })

  if (!pockets.length) return <p className="hint">Tambah sumber dana dulu di menu Sumber dana, lalu kembali ke sini.</p>
  return (
    <form action={submit} className="stack" key={round}>
      <div className="form-grid">
        <div className="field"><span>Sumber dana</span>
          <ThemedSelect label="Sumber dana" value={pocket} onChange={setPocket} options={pockets.map((p) => ({ value: p.id, label: p.name }))} />
        </div>
        <label className="field"><span>Periode</span><input className="input" type="month" name="period" value={period} onChange={(e) => setPeriod(e.target.value)} required pattern="\d{4}-\d{2}" /></label>
      </div>
      <StatementFields key={`${kind}-${fk}`} kind={kind} today={today} init={parsed ? { opening: parsed.opening, total_in: parsed.total_in, total_out: parsed.total_out, closing: parsed.closing, min_payment: parsed.min_payment, due_on: parsed.due_on, note: parsed.note } : {}} />
      <PdfDrop file={file} onFile={pick} label="Pilih PDF e-statement" />
      {file && locked ? (
        <div className="cluster" role="group" aria-label="Buka kunci PDF">
          <input className="input" type="password" autoComplete="off" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password PDF" aria-label="Password PDF" style={{ maxWidth: '14rem' }} />
          <button type="button" className="btn small" onClick={unlock} disabled={unlocking} aria-busy={unlocking}><LockOpen aria-hidden size={16} /> {unlocking ? 'Membuka…' : 'Buka kunci'}</button>
          <span className="hint">Diproses di browser Anda. Password tidak dikirim atau disimpan.</span>
        </div>
      ) : null}
      {reading ? <p className="hint" role="status"><ScanText aria-hidden size={16} /> Membaca isi PDF…</p> : null}
      {parsed ? (
        <div className="stack" role="status">
          <p className={parsed.warnings.length ? 'form-msg err' : 'hint'}>
            <ScanText aria-hidden size={16} /> Terbaca otomatis: {parsed.label}{parsed.account ? ` (${parsed.account})` : ''}, {parsed.txns.length} transaksi. {parsed.warnings.length ? 'Ada yang tidak cocok, cek angka di atas:' : 'Semua hitungan cocok dengan PDF.'}
          </p>
          {parsed.warnings.length ? <ul className="hint">{parsed.warnings.map((w) => <li key={w}>{w}</li>)}</ul> : null}
          {parsed.txns.length ? (
            <>
              <label className="cluster"><input type="checkbox" className="check" checked={useTxns} onChange={(e) => setUseTxns(e.target.checked)} /> <span>Simpan rincian transaksi ({parsed.txns.length})</span></label>
              <details><summary className="hint">Lihat transaksi yang terbaca</summary>
                <ul className="hint">{parsed.txns.slice(0, 12).map((t, i) => <li key={i}>{t.txn_on} · {t.kind} · {t.description.slice(0, 40)} · {t.direction === 'in' ? '+' : '−'}{rp(t.amount)}</li>)}{parsed.txns.length > 12 ? <li>…dan {parsed.txns.length - 12} lainnya</li> : null}</ul>
              </details>
            </>
          ) : null}
        </div>
      ) : null}
      {file ? (
        <label className="cluster"><input type="checkbox" className="check" checked={keep} onChange={(e) => setKeep(e.target.checked)} /> <span>Simpan file PDF asli di aplikasi</span></label>
      ) : <p className="hint">PDF bersifat opsional. Tanpa PDF, hanya ringkasannya yang disimpan.</p>}
      {msg ? <p className="form-msg err" role="alert">{msg}</p> : null}
      <div className="cluster"><button type="submit" className="btn" disabled={saving} aria-busy={saving}><Plus aria-hidden size={18} /> {saving ? 'Menyimpan…' : 'Simpan statement'}</button></div>
    </form>
  )
}
