import { Banknote, CalendarPlus, Plus } from 'lucide-react'
import { isCreditKind, type PocketView, type TemplateLine } from '@/lib/types'
import { rp } from '@/lib/calc'
import { addTemplateLine, deleteTemplateLine, saveMonthAsTemplate, updateTemplateLine } from '@/lib/template-actions'
import { ActionButton, InlineField, MoneyInput, QuickForm, Submit } from './Fields'
import { ConfirmButton } from './ConfirmButton'
import { PocketSelect } from './PocketSelect'
import { TileTitle } from './TileTitle'

const GRP_LABEL = { kebutuhan: 'Kebutuhan pokok', gaya_hidup: 'Gaya hidup', tabungan: 'Tabungan', investasi: 'Investasi' } as const

/** Pengaturan: template yang disalin saat memulai bulan baru (gaji sebagai uang masuk, potongan, dan jatah anggaran). */
export function TemplateTile({ lines, pockets, ym, ymText }: { lines: TemplateLine[]; pockets: PocketView[]; ym: string; ymText: string }) {
  const income = lines.filter((l) => l.section === 'income'), budget = lines.filter((l) => l.section === 'budget')
  const masuk = income.filter((l) => l.kind === 'masuk').reduce((s, l) => s + l.amount, 0)
  const potong = income.filter((l) => l.kind === 'potong').reduce((s, l) => s + l.amount, 0)
  const wallets = pockets.filter((p) => !isCreditKind(p.kind))
  const pk = (id: string | null) => pockets.find((p) => p.id === id)?.name
  return (
    <section className="tile s12" style={{ ['--i' as string]: 4 }} aria-labelledby="h-tpl">
      <div className="tile-head"><TileTitle id="h-tpl" icon={Banknote}>Template bulan baru</TileTitle>{income.length ? <span className="chip ok">Bersih {rp(masuk - potong)}</span> : null}</div>
      <p className="hint" style={{ marginBottom: 'var(--space-3)' }}>Isi gaji sebagai uang masuk, potongan tetap (BPJS, pajak), dan jatah anggaran. Saat sebuah bulan masih kosong, tombol <b>Mulai dari template</b> menyalin semuanya ke bulan itu, lalu bisa diubah seperlunya. Tanpa template, bulan baru dimulai dengan satu baris Gaji.</p>

      <h3 style={{ fontSize: "1rem", marginBottom: "var(--space-2)" }}>Pemasukan dan potongan</h3>
      <ul className="rows">
        {income.map((l) => (
          <li key={l.id} className="row wrap">
            <span className="grow" style={{ minWidth: '12rem' }}><InlineField id={l.id} field="label" value={l.label} action={updateTemplateLine} label="Nama pemasukan" />
              <span className="meta" style={{ paddingLeft: 8 }}>{l.kind === 'masuk' ? 'Uang masuk' : 'Potongan'}{pk(l.pocket_id) ? ` · ${pk(l.pocket_id)}` : ''}</span></span>
            <span style={{ width: '10.5rem', flex: 'none' }}><InlineField id={l.id} field="amount" value={l.amount} money action={updateTemplateLine} label={`Nominal ${l.label}`} /></span>
            <ActionButton action={deleteTemplateLine} args={[l.id]} label={`Hapus ${l.label} dari template`} />
          </li>
        ))}
        {!income.length ? <li><span className="hint">Belum ada. Tambahkan gaji kamu di bawah.</span></li> : null}
      </ul>
      <QuickForm action={addTemplateLine} className="form-grid three">
        <input type="hidden" name="section" value="income" />
        <label className="field"><span>Tambah</span><input className="input" name="label" placeholder="mis. Gaji" maxLength={80} required /></label>
        <label className="field"><span>Jenis</span><select className="select" name="kind"><option value="masuk">Uang masuk</option><option value="potong">Potongan</option></select></label>
        <label className="field"><span>Nominal</span><MoneyInput name="amount" label="Nominal" /></label>
        <PocketSelect pockets={wallets} label="Masuk ke / dipotong dari" full />
        <div className="full"><Submit className="btn small ghost"><Plus aria-hidden /> Tambah ke template</Submit></div>
      </QuickForm>

      <h3 style={{ fontSize: "1rem", margin: "var(--space-5) 0 var(--space-2)" }}>Jatah anggaran</h3>
      <ul className="rows">
        {budget.map((l) => (
          <li key={l.id} className="row wrap">
            <span className="grow" style={{ minWidth: '12rem' }}><InlineField id={l.id} field="label" value={l.label} action={updateTemplateLine} label="Nama kategori" />
              <span className="meta" style={{ paddingLeft: 8 }}>{l.grp ? GRP_LABEL[l.grp] : ''}</span></span>
            <span style={{ width: '10.5rem', flex: 'none' }}><InlineField id={l.id} field="amount" value={l.amount} money action={updateTemplateLine} label={`Jatah ${l.label}`} /></span>
            <ActionButton action={deleteTemplateLine} args={[l.id]} label={`Hapus ${l.label} dari template`} />
          </li>
        ))}
        {!budget.length ? <li><span className="hint">Belum ada kategori. Boleh dikosongkan, bisa diisi per bulan.</span></li> : null}
      </ul>
      <QuickForm action={addTemplateLine} className="form-grid three">
        <input type="hidden" name="section" value="budget" />
        <label className="field"><span>Tambah kategori</span><input className="input" name="label" placeholder="mis. Makan" maxLength={80} required /></label>
        <label className="field"><span>Kelompok</span>
          <select className="select" name="grp" defaultValue="kebutuhan">{(Object.keys(GRP_LABEL) as (keyof typeof GRP_LABEL)[]).map((g) => <option key={g} value={g}>{GRP_LABEL[g]}</option>)}</select></label>
        <label className="field"><span>Jatah</span><MoneyInput name="amount" label="Jatah" /></label>
        <div className="full"><Submit className="btn small ghost"><Plus aria-hidden /> Tambah ke template</Submit></div>
      </QuickForm>

      <div className="cluster" style={{ marginTop: 'var(--space-5)' }}>
        <ConfirmButton action={saveMonthAsTemplate} args={[ym]} title="Jadikan template?" message={`Template sekarang diganti dengan pemasukan dan anggaran ${ymText}.`} trigger={`Jadikan ${ymText} sebagai template`} confirmText="Ya, ganti template" className="btn small ghost" />
        <span className="hint"><CalendarPlus aria-hidden size={14} /> Cara cepat: rapikan satu bulan, lalu jadikan template.</span>
      </div>
    </section>
  )
}
