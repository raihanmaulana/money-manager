'use client'
import { useLinkStatus } from 'next/link'
import { useBusyFlag } from './Busy'

/** Taruh di dalam <Link>: menampilkan loading seketika begitu tautan diklik, sampai halaman tujuan siap. */
export function LinkBusy() {
  const { pending } = useLinkStatus()
  useBusyFlag(pending, true)
  return null
}
