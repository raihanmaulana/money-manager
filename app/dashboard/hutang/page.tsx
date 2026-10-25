import Link from 'next/link'
import { HandCoins, UserPlus, ChevronRight } from 'lucide-react'
import { getCtx, loadDebtPeople } from '@/lib/data'
import { rp } from '@/lib/calc'
import { debtSentence } from '@/lib/debt'
import { addDebtPerson } from '@/lib/debt-actions'
import { PageHead } from '@/components/PageHead'
import { TileTitle } from '@/components/TileTitle'
import { QuickForm, Submit } from '@/components/Fields'

export const metadata = { title: 'Hutang Split Bill' }

export default async function Hutang() {
  const ctx = await getCtx()
  const people = await loadDebtPeople(ctx)
  let i = 0
  return (
    <>
      <PageHead ctx={ctx} title="Hutang Split Bill" sub="Siapa bayar apa, selisihnya, dan siapa yang harus melunasi." month={false} />
      <div className="bento">
        {people.map(({ person, owedToMe, owedByMe, net, count }) => {
          const s = debtSentence(net, person.name)
          return (
            <Link key={person.id} href={`/dashboard/hutang/${person.id}`} className="tile s4 debt-card" style={{ ['--i' as string]: i++ }} aria-label={`Buka hutang dengan ${person.name}`}>
              <div className="tile-head"><TileTitle id={`d-${person.id}`} icon={HandCoins}>{person.name}</TileTitle><ChevronRight aria-hidden size={18} /></div>
              <p className="kicker">{s.who}</p>
              <p className={`big ${s.tone === 'neg' ? 'minus' : ''}`} style={{ fontSize: '2rem' }}>{s.amount ? rp(s.amount) : 'Lunas'}</p>
              <p className="hint">{count} baris · ditagih ke dia {rp(owedToMe)} · ditagih ke saya {rp(owedByMe)}</p>
            </Link>
          )
        })}
        <section className={`tile s4 ${people.length ? 'plain' : ''}`} style={{ ['--i' as string]: i++ }} aria-labelledby="h-baru">
          <div className="tile-head"><TileTitle id="h-baru" icon={UserPlus}>Tambah orang</TileTitle></div>
          <QuickForm action={addDebtPerson} className="stack">
            <label className="field"><span>Nama</span><input className="input" name="name" required maxLength={40} placeholder="mis. Kartika" /></label>
            <p className="hint">Split bill di Catatan dengan nama yang sama otomatis ikut masuk ke daftar orang ini.</p>
            <Submit className="btn ghost"><UserPlus aria-hidden /> Tambah</Submit>
          </QuickForm>
        </section>
      </div>
    </>
  )
}
