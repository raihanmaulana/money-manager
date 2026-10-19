-- Arus — Split bill (patungan): daftar nama + nominal yang harus dibayar orang lain.
-- Hanya MENAMBAH tabel baru. Tidak mengubah data yang sudah ada. Aman dijalankan ulang.
-- Bagian "bayaran" (pelunasan) nanti menyusul sebagai tabel terpisah yang menunjuk ke split_bills.id.

create table if not exists public.split_bills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ym text not null check (ym ~ '^\d{4}-\d{2}$'),
  split_on date not null default current_date,
  name text not null,
  amount bigint not null check (amount > 0),
  note text not null default '',
  expense_id uuid references public.expenses(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists split_bills_idx on public.split_bills(owner_id, ym);

alter table public.split_bills enable row level security;
drop policy if exists "split_bills_owner" on public.split_bills;
create policy "split_bills_owner" on public.split_bills for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
