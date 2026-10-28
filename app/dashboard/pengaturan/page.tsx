import { TileTitle } from '@/components/TileTitle'
import { HandCoins, Send, Sheet, UserRound } from 'lucide-react'
import { getCtx, loadDebtMenu, loadPockets, loadTelegram, loadTemplate } from '@/lib/data'
import { ymLabel } from '@/lib/calc'
import { TemplateTile } from '@/components/TemplateTile'
import { disableTelegramCapture, disconnectTelegram, enableTelegramCapture, saveTelegram, updateName } from '@/lib/actions'
import { LogoutButton } from '@/components/LogoutButton'
import { PageHead } from '@/components/PageHead'
import { SheetSync } from '@/components/SheetSync'
import { sheetsEnabled } from '@/lib/sheets'
import { captureActive, telegramEnabled } from '@/lib/telegram'
import { ActionButton, QuickForm, Submit } from '@/components/Fields'
import { DebtMenuToggle } from '@/components/DebtMenuToggle'

export const metadata = { title: 'Pengaturan' }
const DEMO_ON = process.env.DEMO_MODE === '1'

export default async function Pengaturan() {
  const ctx = await getCtx()
  const [chat, debtOn, tpl, { pockets }] = await Promise.all([loadTelegram(ctx), loadDebtMenu(), loadTemplate(ctx), loadPockets(ctx)])
  const capture = chat && !DEMO_ON ? await captureActive().catch(() => false) : false
  return (
    <>
      <PageHead ctx={ctx} title="Pengaturan" month={false} />
      <div className="bento">
        <TemplateTile lines={tpl} pockets={pockets} ym={ctx.ym} ymText={ymLabel(ctx.ym)} />
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
        <section className="tile s6" style={{ ['--i' as string]: 3 }} aria-labelledby="h-debt">
          <div className="tile-head"><TileTitle id="h-debt" icon={HandCoins}>Hutang Split Bill</TileTitle>{debtOn ? <span className="chip ok">Aktif</span> : null}</div>
          <p className="hint" style={{ marginBottom: 'var(--space-3)' }}>Buku hutang piutang dengan teman atau pasangan: siapa bayar apa, selisihnya, pelunasan, impor Excel, dan PDF untuk dikirim. Kalau diaktifkan, menunya muncul di sidebar.</p>
          <DebtMenuToggle on={debtOn} />
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
              {chat ? (
                <div className="stack" style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: 'var(--rule-w) solid var(--color-rule)' }}>
                  <div className="cluster"><b>Catat lewat chat</b>{capture ? <span className="chip ok">Aktif</span> : null}</div>
                  <p className="hint">Kirim pesan ke bot seperti <span className="mono">Makan siang 20 ribu</span> atau <span className="mono">Kopi 25k gopay kemarin</span>, dan langsung tercatat sebagai pengeluaran. Setiap balasan punya tombol Batalkan. Butuh <span className="mono">SUPABASE_SERVICE_ROLE_KEY</span> di Vercel (sama seperti pengingat pagi).</p>
                  {capture ? (
                    <ActionButton action={disableTelegramCapture} args={[]} icon={false} text="Matikan pencatatan chat" label="Matikan pencatatan lewat chat" className="btn small ghost" />
                  ) : (
                    <QuickForm action={enableTelegramCapture} className="cluster" resetOnDone={false} toastText="Aktif, coba kirim pesan ke bot">
                      <Submit className="btn small" pendingText="Mengaktifkan…">Aktifkan pencatatan lewat chat</Submit>
                    </QuickForm>
                  )}
                </div>
              ) : null}
            </>
          )}
        </section>
      </div>
    </>
  )
}
