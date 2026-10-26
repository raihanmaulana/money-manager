import Link from 'next/link'
import { Archive, FileText, LockOpen, Plus, BellRing } from 'lucide-react'
import { getCtx, loadPockets, loadStatements } from '@/lib/data'
import { rp, ymAdd, ymLabel } from '@/lib/calc'
import { isCreditKind } from '@/lib/types'
import { deleteStatement, removeStatementFile } from '@/lib/estatement-actions'
import { PageHead } from '@/components/PageHead'
import { TileTitle } from '@/components/TileTitle'
import { ActionButton } from '@/components/Fields'
import { ConfirmButton } from '@/components/ConfirmButton'
import { PocketAvatar } from '@/components/PocketAvatar'
import { StatementForm } from '@/components/StatementForm'
import { StatementEditor } from '@/components/StatementEditor'
import { StatementFileButton } from '@/components/StatementFileButton'
import { UnlockTool } from '@/components/UnlockTool'
import { LinkBusy } from '@/components/LinkBusy'

export const metadata = { title: 'E-Statement' }
const QUOTA = 1_073_741_824 // kuota gratis Storage Supabase (1 GB)
const size = (b: number) => (b >= 1_048_576 ? `${(b / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

export default async function EStatement() {
  const ctx = await getCtx()
  const [{ pockets }, list] = await Promise.all([loadPockets(ctx), loadStatements(ctx)])
  const used = list.reduce((t, s) => t + s.file_size, 0)
  const withFile = list.filter((s) => s.file_path).length
  const pct = Math.min(100, (used / QUOTA) * 100)
  const prev = ymAdd(ctx.today.ym, -1)
  const missing = pockets.filter((p) => ['bank', 'ewallet', 'kredit', 'paylater'].includes(p.kind) && !list.some((s) => s.pocket_id === p.id && s.period === prev))
  const periods = [...new Set(list.map((s) => s.period))]
  let i = 0

  return (
    <>
      <PageHead ctx={ctx} title="E-Statement" sub="Arsip statement bulanan tiap sumber dana, lengkap dengan ringkasannya." month={false} />
      <div className="bento">
        <section className="tile col blush s5" style={{ ['--i' as string]: i++ }} aria-labelledby="h-kap">
          <p className="kicker" id="h-kap">Kapasitas arsip PDF</p>
          <p className="big" style={{ fontSize: '2rem' }}>{size(used)}</p>
          <div className={`meter ${pct > 80 ? 'over' : ''}`} role="img" aria-label={`Terpakai ${pct.toFixed(1)} persen dari kuota`}><i style={{ width: `${Math.max(pct, used ? 1 : 0)}%` }} /></div>
          <p className="hint">{withFile} file dari {list.length} statement · kuota gratis Supabase ±1 GB. {pct > 80 ? 'Hampir penuh: hapus file asli bulan lama (ringkasannya tetap tersimpan).' : 'Hapus file asli kapan saja tanpa menghapus ringkasannya.'}</p>
        </section>

        <section className="tile s7" style={{ ['--i' as string]: i++ }} aria-labelledby="h-tambah">
          <div className="tile-head"><TileTitle id="h-tambah" icon={Plus}>Tambah statement</TileTitle></div>
          <StatementForm pockets={pockets.map((p) => ({ id: p.id, name: p.name, kind: p.kind }))} defaultPeriod={prev} today={ctx.today.iso} demo={process.env.DEMO_MODE === '1'} />
        </section>

        {missing.length ? (
          <section className="tile s12" style={{ ['--i' as string]: i++ }} aria-labelledby="h-ingat">
            <div className="tile-head"><TileTitle id="h-ingat" icon={BellRing}>Belum diunggah untuk {ymLabel(prev)}</TileTitle><span className="tile-note">{missing.length} sumber dana</span></div>
            <ul className="rows">
              {missing.map((p) => <li key={p.id}><PocketAvatar name={p.name} kind={p.kind} size={30} /><span className="grow name">{p.name}</span><span className="chip">{isCreditKind(p.kind) ? 'Tagihan' : 'Mutasi bulanan'}</span></li>)}
            </ul>
          </section>
        ) : null}

        <section className="tile s12" style={{ ['--i' as string]: i++ }} aria-labelledby="h-arsip">
          <div className="tile-head"><TileTitle id="h-arsip" icon={Archive}>Arsip</TileTitle><span className="tile-note">{list.length} statement</span></div>
          {list.length ? periods.map((per) => (
            <div key={per} className="stack" style={{ marginBottom: 'var(--space-4)' }}>
              <h3 className="label">{ymLabel(per)}</h3>
              <ul className="rows">
                {list.filter((s) => s.period === per).map((s) => (
                  <li key={s.id}>
                    <PocketAvatar name={s.pocket_name} kind={s.pocket_kind as never} size={34} />
                    <span className="grow">
                      <span className="name">{s.pocket_name}</span>
                      <span className="meta">
                        {isCreditKind(s.pocket_kind) ? `Tagihan ${rp(s.closing)}${s.due_on ? ` · jatuh tempo ${Number(s.due_on.slice(8))}/${s.due_on.slice(5, 7)}` : ''}` : `Masuk ${rp(s.total_in)} · keluar ${rp(s.total_out)}`}
                        {s.note ? ` · ${s.note}` : ''}
                      </span>
                      <span className="meta">{s.file_path ? `PDF ${size(s.file_size)}` : 'Tanpa file PDF'}</span>
                    </span>
                    <span className="amt">{rp(s.closing)}</span>
                    <span className="cluster">
                      <Link className="btn small ghost" href={`/dashboard/estatement/${s.id}`}><FileText aria-hidden size={16} /> Laporan<LinkBusy /></Link>
                      {s.file_path ? <StatementFileButton id={s.id} /> : null}
                      <StatementEditor s={s} today={ctx.today.iso} />
                      {s.file_path ? <ActionButton action={removeStatementFile} args={[s.id]} label={`Hapus file PDF ${s.pocket_name} ${s.period}, ringkasan tetap`} icon={false} text="Hapus PDF" className="btn small ghost" /> : null}
                      <ConfirmButton action={deleteStatement} args={[s.id]} trigger="Hapus" title={`Hapus statement ${s.pocket_name} ${ymLabel(s.period)}?`} message="Ringkasan dan file PDF-nya ikut terhapus." />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )) : <p className="hint">Belum ada statement. Tambahkan yang pertama dari form di atas.</p>}
        </section>

        <section className="tile s12" style={{ ['--i' as string]: i++ }} aria-labelledby="h-unlock">
          <div className="tile-head"><TileTitle id="h-unlock" icon={LockOpen}>Buka kunci PDF</TileTitle></div>
          <UnlockTool />
        </section>
      </div>
    </>
  )
}
