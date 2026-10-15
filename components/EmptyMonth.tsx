import { CalendarPlus, CalendarDays } from 'lucide-react'
import { seedMonth } from '@/lib/actions'
import { prevMonthHasData, type Ctx } from '@/lib/data'
import { ymAdd, ymLabel } from '@/lib/calc'
import { Submit } from './Fields'

export async function EmptyMonth({ ctx }: { ctx: Ctx }) {
  const prev = ymAdd(ctx.ym, -1)
  const hasPrev = await prevMonthHasData(ctx, prev)
  return (
    <section className="tile s12 plain" style={{ ['--i' as string]: 0 }}>
      <div className="empty">
        <span className="empty-ic" aria-hidden><CalendarDays size={20} /></span>
        <h2>{ymLabel(ctx.ym)} belum ada rencana</h2>
            <p>
              {hasPrev
                ? `Mulai dari angka ${ymLabel(prev)} lalu ubah seperlunya. Setiap bulan punya anggaran, catatan, dan tagihannya sendiri, jadi perubahan tidak memengaruhi bulan lain.`
                : 'Mulai dengan satu pemasukan. Potongan, kategori anggaran, dan lainnya bisa ditambahkan sesuai kebutuhan.'}
            </p>
            <div className="actions">
              {hasPrev ? (
                <form action={seedMonth}>
                  <input type="hidden" name="ym" value={ctx.ym} /><input type="hidden" name="mode" value="prev" />
                  <Submit className="btn"><CalendarPlus aria-hidden /> Salin dari {ymLabel(prev)}</Submit>
                </form>
              ) : null}
              <form action={seedMonth}>
                <input type="hidden" name="ym" value={ctx.ym} /><input type="hidden" name="mode" value="default" />
                <Submit className={hasPrev ? 'btn ghost' : 'btn'}>Mulai dengan gaji</Submit>
              </form>
            </div>
      </div>
    </section>
  )
}
