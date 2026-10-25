'use client'
import { useState } from 'react'
import { DatePicker } from './DatePicker'
import { MoneyInput } from './Fields'
import { rp } from '@/lib/calc'
import { shareOf, type ShareMode } from '@/lib/debt'

type Init = { paid_by?: 'me' | 'them'; entry_on?: string; title?: string; amount?: number; share?: number; note?: string }

/** Isian satu baris hutang: dibayar siapa, tanggal, kegiatan, harga, dan bagian yang ditagihkan. */
export function DebtEntryFields({ personName, today, init = {}, inModal = false }: { personName: string; today: string; init?: Init; inModal?: boolean }) {
  const [amount, setAmount] = useState(init.amount ?? 0)
  const startMode: ShareMode = init.amount == null ? 'bagi2'
    : init.share === init.amount ? 'penuh' : init.share === 0 ? 'gratis' : init.share === Math.round(init.amount / 2) ? 'bagi2' : 'sendiri'
  const [by, setBy] = useState<'me' | 'them'>(init.paid_by ?? 'me')
  const [mode, setMode] = useState<ShareMode>(startMode)
  const [custom, setCustom] = useState(init.share ?? 0)
  const share = shareOf(mode, amount, custom)
  return (
    <div className="form-grid">
      <input type="hidden" name="share" value={share} />
      <label className="field"><span>Dibayar oleh</span>
        <select className="select" name="paid_by" value={by} onChange={(e) => setBy(e.target.value as 'me' | 'them')}>
          <option value="me">Saya</option><option value="them">{personName}</option>
        </select>
      </label>
      <label className="field"><span>Tanggal</span><DatePicker name="entry_on" label="Tanggal" defaultValue={init.entry_on ?? today} inModal={inModal} /></label>
      <label className="field full"><span>Kegiatan atau barang</span><input className="input" name="title" required maxLength={80} defaultValue={init.title ?? ''} placeholder="mis. Jakarta Aquarium" /></label>
      <label className="field"><span>Harga</span><MoneyInput name="amount" label="Harga" required defaultValue={init.amount ?? 0} onValue={setAmount} /></label>
      <label className="field"><span>Bagian ditagih</span>
        <select className="select" value={mode} onChange={(e) => setMode(e.target.value as ShareMode)}>
          <option value="bagi2">Dibagi 2</option><option value="penuh">Penuh (seluruhnya)</option><option value="gratis">Gratis (tidak ditagih)</option><option value="sendiri">Nominal sendiri</option>
        </select>
      </label>
      {mode === 'sendiri' ? <label className="field full"><span>Nominal ditagih</span><MoneyInput name="share_custom" label="Nominal yang ditagihkan" defaultValue={init.share ?? 0} onValue={setCustom} /></label> : null}
      <p className="hint full" aria-live="polite">Ditagihkan ke {by === 'them' ? 'saya' : personName}: <b>{rp(Math.min(share, amount || share))}</b></p>
      <label className="field full"><span>Keterangan (opsional)</span><input className="input" name="note" maxLength={120} defaultValue={init.note ?? ''} /></label>
    </div>
  )
}
