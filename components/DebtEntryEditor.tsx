'use client'
import { Pencil } from 'lucide-react'
import { ModalForm } from './ModalForm'
import { DebtEntryFields } from './DebtEntryFields'
import { updateDebtEntry } from '@/lib/debt-actions'
import type { DebtEntry } from '@/lib/types'

export function DebtEntryEditor({ entry, personName, today }: { entry: DebtEntry; personName: string; today: string }) {
  return (
    <ModalForm trigger={<><Pencil aria-hidden size={18} /><span className="sr-only">Ubah baris</span></>} triggerClass="btn icon" title="Ubah baris" submitText="Simpan" action={updateDebtEntry}>
      <input type="hidden" name="id" value={entry.id} />
      <DebtEntryFields personName={personName} today={today} init={entry} inModal />
    </ModalForm>
  )
}
