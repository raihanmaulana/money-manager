import writeXlsxFile from 'write-excel-file/node'
import { NextResponse } from 'next/server'
import { getCtx } from '@/lib/data'

export const dynamic = 'force-dynamic'

/** Template Excel untuk impor hutang split bill. */
export async function GET(req: Request) {
  await getCtx() // harus masuk dulu
  const nama = (new URL(req.url).searchParams.get('nama') ?? 'Teman').trim().slice(0, 40) || 'Teman'
  const head = (v: string) => ({ value: v, fontWeight: 'bold' as const, backgroundColor: '#E6EEF9' })
  const sheet = [
    [head('Tanggal'), head('Kegiatan/Beli'), head('Harga'), head('Bagian ditagih'), head('Keterangan'), head('Dibayar oleh')],
    ['16 Juli 2026', 'Bakso Samrat', 100000, 'Penuh', '', 'Saya'],
    ['1 Agustus 2026', 'Jakarta Aquarium', 325706, 'Dibagi 2', '', 'Saya'],
    ['14 Oktober 2026', 'Warkop Bulungan', 67200, 30000, '', 'Saya'],
    ['18 Agustus 2026', 'Prodia', 150000, 'Penuh', '', nama],
    ['19 Agustus 2026', 'Pizza', 90000, 'Gratis', 'traktiran', nama],
  ]
  const buf = await writeXlsxFile(sheet as never, { columns: [{ width: 18 }, { width: 30 }, { width: 14 }, { width: 16 }, { width: 24 }, { width: 16 }] } as never).toBuffer()
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="template-hutang-split-bill.xlsx"`,
      'Cache-Control': 'no-store',
    },
  })
}
