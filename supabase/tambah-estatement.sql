-- Arus — E-Statement: arsip statement bulanan per sumber dana (bank, e-wallet, kartu kredit).
-- Hanya MENAMBAH tabel dan bucket baru. Tidak mengubah data yang sudah ada. Aman dijalankan ulang.

create table if not exists public.statements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pocket_id uuid references public.pockets(id) on delete set null,
  pocket_name text not null default '',           -- salinan nama, supaya arsip tetap terbaca kalau sumber dana dihapus
  pocket_kind text not null default 'bank',
  period text not null check (period ~ '^\d{4}-\d{2}$'),
  opening bigint not null default 0,              -- saldo awal (kartu kredit: tagihan sebelumnya)
  total_in bigint not null default 0,             -- total masuk (kartu kredit: pembayaran diterima)
  total_out bigint not null default 0,            -- total keluar (kartu kredit: pembelanjaan)
  closing bigint not null default 0,              -- saldo akhir (kartu kredit: tagihan bulan ini)
  min_payment bigint not null default 0,          -- khusus kartu kredit
  due_on date,                                    -- khusus kartu kredit
  note text not null default '',
  file_path text,                                 -- lokasi di Storage; kosong = file asli tidak disimpan
  file_name text not null default '',
  file_size bigint not null default 0,
  created_at timestamptz not null default now()
);
create unique index if not exists statements_unique_idx
  on public.statements(owner_id, coalesce(pocket_id, '00000000-0000-0000-0000-000000000000'::uuid), period);
create index if not exists statements_period_idx on public.statements(owner_id, period desc);

alter table public.statements enable row level security;
drop policy if exists "statements_owner" on public.statements;
create policy "statements_owner" on public.statements for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Bucket privat untuk file PDF. Setiap pengguna hanya bisa mengakses folder bernama id miliknya.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('statements', 'statements', false, 15728640, array['application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 15728640, allowed_mime_types = array['application/pdf'];

drop policy if exists "statements_files_select" on storage.objects;
drop policy if exists "statements_files_insert" on storage.objects;
drop policy if exists "statements_files_update" on storage.objects;
drop policy if exists "statements_files_delete" on storage.objects;
create policy "statements_files_select" on storage.objects for select
  using (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "statements_files_insert" on storage.objects for insert
  with check (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "statements_files_update" on storage.objects for update
  using (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "statements_files_delete" on storage.objects for delete
  using (bucket_id = 'statements' and (storage.foldername(name))[1] = auth.uid()::text);

-- Rincian transaksi hasil baca otomatis PDF (teks kecil, ikut terhapus bila statement dihapus).
create table if not exists public.statement_txns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  statement_id uuid not null references public.statements(id) on delete cascade,
  txn_on date not null,
  kind text not null default '',
  description text not null default '',
  direction text not null check (direction in ('in','out')),
  amount bigint not null default 0,
  balance bigint,
  created_at timestamptz not null default now()
);
create index if not exists statement_txns_idx on public.statement_txns(statement_id, txn_on);
alter table public.statement_txns enable row level security;
drop policy if exists "statement_txns_owner" on public.statement_txns;
create policy "statement_txns_owner" on public.statement_txns for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
