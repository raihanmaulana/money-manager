-- Arus — List Kebutuhan: daftar barang wajib beli tiap bulan, dengan perkiraan harga dan penanda sudah dibeli.
-- Hanya MENAMBAH tabel baru. Tidak mengubah data yang sudah ada. Aman dijalankan ulang.

-- 1) Barang kebutuhan (berulang tiap bulan). Kategori = kelompok (mis. Kucing).
create table if not exists public.need_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'Umum',
  name text not null,
  est_price bigint not null default 0 check (est_price >= 0),
  qty numeric not null default 1 check (qty > 0),
  remind_day int check (remind_day is null or remind_day between 1 and 31),
  budget_label text not null default '',
  pocket_id uuid references public.pockets(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists need_items_idx on public.need_items(owner_id);

-- 2) Pembelian per bulan. Dibuat saat barang ditandai "sudah dibeli" dan terhubung ke satu catatan pengeluaran.
--    Kalau catatannya dihapus, barang otomatis kembali jadi "belum dibeli".
create table if not exists public.need_purchases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.need_items(id) on delete cascade,
  ym text not null check (ym ~ '^\d{4}-\d{2}$'),
  qty numeric not null check (qty > 0),
  unit_price bigint not null check (unit_price >= 0),
  total bigint not null check (total >= 0),
  est_total bigint not null default 0,
  bought_on date not null default current_date,
  expense_id uuid references public.expenses(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (item_id, ym)
);
create index if not exists need_purchases_idx on public.need_purchases(owner_id, ym);

alter table public.need_items enable row level security;
alter table public.need_purchases enable row level security;
do $$
declare t text;
begin
  foreach t in array array['need_items','need_purchases'] loop
    execute format('drop policy if exists "%1$s_owner" on public.%1$s', t);
    execute format('create policy "%1$s_owner" on public.%1$s for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;
