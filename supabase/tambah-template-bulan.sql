-- Template bulan baru: baris pemasukan/potongan dan kategori anggaran yang disalin saat memulai bulan baru.
-- Aman dijalankan berulang.
create table if not exists public.month_template (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (section in ('income','budget')),
  kind text check (kind in ('masuk','potong')),
  grp text check (grp in ('kebutuhan','gaya_hidup','tabungan','investasi')),
  label text not null,
  amount bigint not null default 0 check (amount >= 0),
  pocket_id uuid references public.pockets(id) on delete set null,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists month_template_owner_idx on public.month_template(owner_id, section, sort);
alter table public.month_template enable row level security;
drop policy if exists "month_template_owner" on public.month_template;
create policy "month_template_owner" on public.month_template for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
