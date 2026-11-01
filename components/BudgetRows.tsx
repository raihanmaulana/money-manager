'use client'
import { useEffect, useState } from 'react'
import { GripVertical } from 'lucide-react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { ActionButton, InlineField } from './Fields'
import { useBusyTransition } from './Busy'
import { useToast } from './Toast'
import { deleteBudget, reorderBudget, updateBudget } from '@/lib/actions'
import type { BudgetItem } from '@/lib/types'

function Row({ b }: { b: BudgetItem }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: b.id })
  return (
    <li ref={setNodeRef} className={`row${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: transform ? `translate3d(0, ${Math.round(transform.y)}px, 0)` : undefined, transition, position: 'relative', zIndex: isDragging ? 5 : undefined }}>
      <button type="button" className="drag-handle" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={`Geser urutan ${b.label}`} title="Tahan dan geser untuk mengubah urutan">
        <GripVertical aria-hidden size={16} />
      </button>
      <span className="grow"><InlineField id={b.id} field="label" value={b.label} action={updateBudget} label="Nama kategori" /></span>
      <span style={{ width: '10.5rem', flex: 'none' }}><InlineField id={b.id} field="amount" value={b.amount} money action={updateBudget} label={`Jatah ${b.label}`} /></span>
      <ActionButton action={deleteBudget} args={[b.id]} label={`Hapus kategori ${b.label}`} />
    </li>
  )
}

/** Daftar kategori satu kelompok anggaran; urutannya bisa digeser dan dipakai di dropdown Catatan. */
export function BudgetRows({ items }: { items: BudgetItem[] }) {
  const [order, setOrder] = useState<string[] | null>(null)
  const [, start] = useBusyTransition(true)
  const toast = useToast()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  useEffect(() => { setOrder(null) }, [items])
  const rank = new Map((order ?? []).map((id, i) => [id, i]))
  const list = order ? [...items].sort((a, b) => (rank.get(a.id) ?? 1e6) - (rank.get(b.id) ?? 1e6)) : items
  const ids = list.map((b) => b.id)
  const onEnd = (ev: DragEndEvent) => {
    const from = ids.indexOf(String(ev.active.id)), to = ev.over ? ids.indexOf(String(ev.over.id)) : -1
    if (from < 0 || to < 0 || from === to) return
    const next = arrayMove(ids, from, to)
    setOrder(next)
    start(async () => {
      const r = await reorderBudget(next)
      if (typeof r === 'string') { setOrder(null); toast(r, 'warn') } else toast('Urutan tersimpan')
    })
  }
  if (!list.length) return <ul className="rows"><li><span className="hint">Belum ada kategori.</span></li></ul>
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="rows">{list.map((b) => <Row key={b.id} b={b} />)}</ul>
      </SortableContext>
    </DndContext>
  )
}
