import { TileTitle } from '@/components/TileTitle'
import { Send, Sheet, UserRound } from 'lucide-react'
import { getCtx, loadTelegram } from '@/lib/data'
import { disconnectTelegram, saveTelegram, updateName } from '@/lib/actions'
import { LogoutButton } from '@/components/LogoutButton'
import { PageHead } from '@/components/PageHead'
import { SheetSync } from '@/components/SheetSync'
import { sheetsEnabled } from '@/lib/sheets'
import { telegramEnabled } from '@/lib/telegram'
import { ActionButton, QuickForm, Submit } from '@/components/Fields'

export const metadata = { title: 'Pengaturan' }

export default async function Pengaturan() {
  const ctx = await getCtx()
  const chat = await loadTelegram(ctx)
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
        <section className="tile s6" style={{ ['--i' as string]: 2 }} aria-labelledby="h-tg">
          <div className="tile-head"><TileTitle id="h-tg" icon={Send}>Pengingat Telegram</TileTitle>{chat ? <span className="chip ok">Terhubung</span> : null}</div>
          {!telegramEnabled() ? <p className="hint">Bot Telegram belum disiapkan di server. Isi <span className="mono">TELEGRAM_BOT_TOKEN</span> di Vercel dulu (lihat README).</p> : (
            <>
              <p className="hint" style={{ marginBottom: 'var(--space-3)' }}>Tiap pagi (08.00 WIB) bot mengirim daftar kebutuhan yang waktunya dibeli tapi belum dibeli. Cari bot kamu di Telegram, tekan <b>Start</b>, lalu isi Chat ID dari <span className="mono">@userinfobot</span>.</p>
              <QuickForm action={saveTelegram} className="stack" resetOnDone={false} toastText="Terhubung, cek Telegram">
                <label className="field"><span>Chat ID</span><input className="input mono" name="chat_id" inputMode="numeric" defaultValue={chat ?? ''} placeholder="mis. 123456789" required maxLength={24} /></label>
                <div className="cluster">
                  <Submit className="btn small">{chat ? 'Simpan dan kirim tes' : 'Hubungkan dan kirim tes'}</Submit>
                  {chat ? <ActionButton action={disconnectTelegram} args={[]} icon={false} text="Putuskan" label="Putuskan Telegram" className="btn small ghost" /> : null}
                </div>
              </QuickForm>
            </>
          )}
        </section>
      </div>
    </>
  )
}
