import { TileTitle } from '@/components/TileTitle'
import { Sheet, UserRound } from 'lucide-react'
import { getCtx } from '@/lib/data'
import { updateName } from '@/lib/actions'
import { LogoutButton } from '@/components/LogoutButton'
import { PageHead } from '@/components/PageHead'
import { SheetSync } from '@/components/SheetSync'
import { sheetsEnabled } from '@/lib/sheets'
import { QuickForm, Submit } from '@/components/Fields'

export const metadata = { title: 'Pengaturan' }

export default async function Pengaturan() {
  const ctx = await getCtx()
  return (
    <>
      <PageHead ctx={ctx} title="Pengaturan" month={false} />
      <div className="bento">
        <section className="tile s6" style={{ ['--i' as string]: 0 }} aria-labelledby="h-akun">
          <div className="tile-head"><TileTitle id="h-akun" icon={UserRound}>Akun</TileTitle></div>
          <QuickForm action={updateName} className="stack" resetOnDone={false}>
            <label className="field"><span>Nama tampilan</span><input className="input" name="nama" defaultValue={ctx.nama} required maxLength={40} /></label>
            <p className="hint">Masuk sebagai <span className="mono">{ctx.email}</span></p>
            <div className="cluster"><Submit className="btn small">Simpan nama</Submit></div>
          </QuickForm>
          <div style={{ marginTop: 'var(--space-5)' }}><LogoutButton /></div>
        </section>

        <section className="tile s6" style={{ ['--i' as string]: 1 }} aria-labelledby="h-sheet">
          <div className="tile-head"><TileTitle id="h-sheet" icon={Sheet}>Google Sheet untuk audit</TileTitle></div>
          <SheetSync enabled={sheetsEnabled()} sheetUrl={process.env.NEXT_PUBLIC_SHEET_URL} />
        </section>
      </div>
    </>
  )
}
