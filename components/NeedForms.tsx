'use client'
import { useState } from 'react'
import { Check, Pencil } from 'lucide-react'
import { CategoryCombo } from './CategoryCombo'
import { ModalForm } from './ModalForm'
import { MoneyInput } from './Fields'
import { DatePicker } from './DatePicker'
import { PocketSelect } from './PocketSelect'
import { buyNeed, updateNeed } from '@/lib/actions'
import { rp } from '@/lib/calc'
import type { NeedItem, Pocket } from '@/lib/types'

const qtyText = (n: number) => String(n).replace('.', ',')

/** Isian satu barang kebutuhan; dipakai untuk tambah (item kosong) dan ubah. */
export function NeedFields({ item, categories, labels, pockets }: { item?: NeedItem; categories: string[]; labels: string[]; pockets: Pocket[] }) {
  return (
    <>
      <label className="field"><span>Kategori</span>
        <CategoryCombo name="category" options={categories} defaultValue={item?.category ?? ''} placeholder="mis. Kucing" />
      </label>
      <label className="field"><span>Barang</span><input className="input" name="name" required maxLength={80} placeholder="mis. Makanan kucing" defaultValue={item?.name ?? ''} /></label>
      <label className="field"><span>Perkiraan harga (satuan)</span><MoneyInput name="est_price" label="Perkiraan harga satuan" defaultValue={item?.est_price ?? 0} /></label>
      <label className="field"><span>Jumlah</span><input className="input" name="qty" inputMode="decimal" defaultValue={qtyText(item?.qty ?? 1)} required /></label>
      <label className="field"><span>Ingatkan tiap tanggal</span><input className="input" type="number" name="remind_day" min={1} max={31} defaultValue={item?.remind_day ?? ''} placeholder="opsional" /></label>
      <label className="field"><span>Kategori anggaran</span>
        <select className="select" name="budget_label" defaultValue={item?.budget_label ?? ''}>
          <option value="">Tanpa kategori</option>
          {labels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>
      <PocketSelect pockets={pockets} full defaultValue={item?.pocket_id ?? ''} />
      {item ? <input type="hidden" name="id" value={item.id} /> : null}
    </>
  )
}

export function NeedEdit({ item, categories, labels, pockets }: { item: NeedItem; categories: string[]; labels: string[]; pockets: Pocket[] }) {
  return (
    <ModalForm trigger={<Pencil aria-hidden size={18} />} triggerClass="btn icon" title="Ubah barang" action={async (fd) => { await updateNeed(fd) }} submitText="Simpan perubahan">
      <NeedFields item={item} categories={categories} labels={labels} pockets={pockets} />
    </ModalForm>
  )
}

function BuyFields({ item, ym, date, min, max, labels, pockets }: { item: NeedItem; ym: string; date: string; min: string; max: string; labels: string[]; pockets: Pocket[] }) {
  const [price, setPrice] = useState(item.est_price)
  const [qty, setQty] = useState(String(item.qty))
  const q = Number(qty.replace(',', '.')) || 0
  const total = Math.round(price * q)
  const est = Math.round(item.est_price * item.qty)
  const diff = total - est
  return (
    <>
      <input type="hidden" name="item_id" value={item.id} />
      <input type="hidden" name="ym" value={ym} />
      <label className="field"><span>Harga asli (satuan)</span><MoneyInput name="unit_price" label="Harga asli satuan" defaultValue={item.est_price} onValue={setPrice} required /></label>
      <label className="field"><span>Jumlah</span><input className="input" name="qty" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} required /></label>
      <p className="buy-total full" aria-live="polite">
        Total <b>{rp(total)}</b>
        {est > 0 && total > 0 ? <span className={diff > 0 ? 'neg' : diff < 0 ? 'pos' : ''}> · {diff === 0 ? 'sesuai perkiraan' : diff > 0 ? `lebih ${rp(diff)} dari perkiraan` : `hemat ${rp(-diff)} dari perkiraan`}</span> : null}
      </p>
      <label className="field"><span>Tanggal beli</span><DatePicker name="spent_on" label="Tanggal beli" defaultValue={date} min={min} max={max} inModal /></label>
      <label className="field"><span>Kategori anggaran</span>
        <select className="select" name="budget_label" defaultValue={item.budget_label}>
          <option value="">Tanpa kategori</option>
          {labels.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>
      <PocketSelect pockets={pockets} full defaultValue={item.pocket_id ?? ''} />
    </>
  )
}

/** Tombol "Sudah dibeli": popup harga asli, jumlah, tanggal, sumber dana. Menyimpan satu catatan pengeluaran. */
export function NeedBuy(props: { item: NeedItem; ym: string; date: string; min: string; max: string; labels: string[]; pockets: Pocket[] }) {
  return (
    <ModalForm trigger={<><Check aria-hidden size={16} /> Sudah dibeli</>} triggerClass="btn small" title={`Beli: ${props.item.name}`}
      intro="Harga asli dicatat sebagai pengeluaran, jadi anggaran dan saldo sumber dana ikut terhitung." action={buyNeed} submitText="Simpan pembelian">
      <BuyFields {...props} />
    </ModalForm>
  )
}
