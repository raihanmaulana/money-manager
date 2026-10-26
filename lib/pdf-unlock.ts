/** Buka kunci PDF sepenuhnya di browser (QPDF WASM). Isi file dan password tidak dikirim ke server. */

/** Apakah PDF ini dienkripsi (kemungkinan perlu password). */
export async function isEncryptedPdf(file: File): Promise<boolean> {
  const buf = new Uint8Array(await file.arrayBuffer())
  const text = new TextDecoder('latin1').decode(buf)
  return text.includes('/Encrypt')
}

export type UnlockResult = { ok: true; file: File } | { ok: false; reason: 'password' | 'error' }

export async function unlockPdf(file: File, password: string): Promise<UnlockResult> {
  try {
    const createModule = (await import('@neslinesli93/qpdf-wasm')).default as (o: Record<string, unknown>) => Promise<any>
    let err = ''
    const qpdf = await createModule({ locateFile: () => '/wasm/qpdf.wasm', noInitialRun: true, print: () => {}, printErr: (t: string) => { err += t + '\n' } })
    qpdf.FS.writeFile('/in.pdf', new Uint8Array(await file.arrayBuffer()))
    let code = 0
    try { code = qpdf.callMain([`--password=${password}`, '--decrypt', '/in.pdf', '/out.pdf']) ?? 0 } catch (e: any) { code = typeof e?.status === 'number' ? e.status : 2 }
    // QPDF memberi kode 2 untuk password salah (juga untuk file rusak); file ini sudah terdeteksi terenkripsi sebelum dibuka
    if (code !== 0 && code !== 3) return { ok: false, reason: code === 2 || /password/i.test(err) ? 'password' : 'error' }
    const out = qpdf.FS.readFile('/out.pdf') as Uint8Array
    const name = file.name.replace(/\.pdf$/i, '') + '-terbuka.pdf'
    return { ok: true, file: new File([out as BlobPart], name, { type: 'application/pdf' }) }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
