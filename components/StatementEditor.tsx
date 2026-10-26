'use client'
import { Pencil } from 'lucide-react'
import { ModalForm } from './ModalForm'
import { StatementFields } from './StatementFields'
import { updateStatement } from '@/lib/estatement-actions'
import type { Statement } from '@/lib/types'

export function StatementEditor({ s, today }: { s: Statement; today: string }) {
  return (
    <ModalForm trigger={<><Pencil aria-hidden size={18} /><span className="sr-only">Ubah angka statement</span></>} triggerClass="btn icon" title={`Ubah ${s.pocket_name} ${s.period}`} submitText="Simpan" action={updateStatement}>
      <input type="hidden" name="id" value={s.id} />
      <StatementFields kind={s.pocket_kind} init={s} today={today} inModal />
    </ModalForm>
  )
}
