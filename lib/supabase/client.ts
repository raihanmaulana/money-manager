import { createBrowserClient } from '@supabase/ssr'

/** Klien Supabase untuk browser (dipakai mengunggah file langsung ke Storage dengan sesi pengguna). */
export function supabaseBrowser() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
