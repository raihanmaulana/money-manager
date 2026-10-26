import type { PItem } from './statement-parse.ts'

/** Baca teks PDF beserta posisinya (di browser, tidak dikirim ke server). Halaman yang gagal dibaca dilewati. */
export async function readPdfPages(file: File): Promise<PItem[][]> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), standardFontDataUrl: '/pdfjs/standard_fonts/', useSystemFonts: true }).promise
  const pages: PItem[][] = []
  for (let n = 1; n <= doc.numPages; n++) {
    try {
      const page = await doc.getPage(n)
      const vp = page.getViewport({ scale: 1 })
      const tc = await page.getTextContent()
      pages.push((tc.items as { str: string; transform: number[]; width: number }[])
        .filter((i) => typeof i.str === 'string' && i.str.trim())
        .map((i) => ({ s: i.str, x: i.transform[4], y: vp.height - i.transform[5], w: i.width })))
    } catch { pages.push([]) }
  }
  return pages
}
