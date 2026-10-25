-- Arus — skema database (jalankan sekali di Supabase → SQL Editor)
-- Semua data dikunci per pemilik (owner_id) dan per bulan (ym = 'YYYY-MM').

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null default '',
  created_at timestamptz not null default now()
);

-- Pasangan / pemantau: pemilik memberi akses BACA ke email tertentu.
create table if not exists public.viewers (
  owner_id uuid not null references auth.users(id) on delete cascade,
  viewer_email text not null,
  primary key (owner_id, viewer_email)
);

-- Pemasukan & potongan per bulan.
create table if not exists public.income_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ym text not null check (ym ~ '^\d{4}-\d{2}$'),
  label text not null,
  kind text not null check (kind in ('masuk','potong')),
  amount bigint not null default 0 check (amount >= 0),
  sort int not null default 0
);

-- Pos anggaran per bulan: kebutuhan, gaya hidup, tabungan, investasi.
create table if not exists public.budget_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ym text not null check (ym ~ '^\d{4}-\d{2}$'),
  grp text not null check (grp in ('kebutuhan','gaya_hidup','tabungan','investasi')),
  label text not null,
  amount bigint not null default 0 check (amount >= 0),
  sort int not null default 0
);

-- Catatan pengeluaran harian.
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  ym text not null check (ym ~ '^\d{4}-\d{2}$'),
  spent_on date not null,
  budget_item_id uuid references public.budget_items(id) on delete set null,
  note text not null default '',
  amount bigint not null check (amount > 0),
  created_at timestamptz not null default now()
);

-- Tagihan / cicilan / hutang: definisi berulang (mulai–sampai).
create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('tagihan','cicilan','hutang','kartu')),
  amount bigint not null default 0 check (amount >= 0),
  due_day int not null default 1 check (due_day between 1 and 31),
  start_ym text not null check (start_ym ~ '^\d{4}-\d{2}$'),
  end_ym text check (end_ym is null or end_ym ~ '^\d{4}-\d{2}$'),
  note text not null default '',
  min_payment bigint not null default 0,
  created_at timestamptz not null default now()
);

-- Penyesuaian per bulan: nominal beda, lewati bulan ini, status sudah bayar.
create table if not exists public.bill_months (
  bill_id uuid not null references public.bills(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  ym text not null check (ym ~ '^\d{4}-\d{2}$'),
  amount_override bigint check (amount_override is null or amount_override >= 0),
  skipped boolean not null default false,
  paid boolean not null default false,
  paid_at timestamptz,
  paid_amount bigint not null default 0,
  primary key (bill_id, ym)
);

-- Target tabungan (dana darurat, liburan, dll). Saldo = total setoran.
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target bigint not null default 0 check (target >= 0),
  is_emergency boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.goal_deposits (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  ym text not null check (ym ~ '^\d{4}-\d{2}$'),
  amount bigint not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists income_items_idx on public.income_items(owner_id, ym);
create index if not exists budget_items_idx on public.budget_items(owner_id, ym);
create index if not exists expenses_idx on public.expenses(owner_id, ym);
create index if not exists bills_idx on public.bills(owner_id);
create index if not exists goal_deposits_idx on public.goal_deposits(goal_id);

-- ---------- Row Level Security ----------
-- Fungsi bantu: apakah user yang login boleh MELIHAT data milik p_owner?
create or replace function public.can_view(p_owner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_owner = auth.uid()
      or exists (
        select 1 from public.viewers v
        where v.owner_id = p_owner
          and lower(v.viewer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      );
$$;

alter table public.profiles enable row level security;
alter table public.viewers enable row level security;
alter table public.income_items enable row level security;
alter table public.budget_items enable row level security;
alter table public.expenses enable row level security;
alter table public.bills enable row level security;
alter table public.bill_months enable row level security;
alter table public.goals enable row level security;
alter table public.goal_deposits enable row level security;

-- profiles: pemilik atau pemantau boleh baca; hanya pemilik menulis
create policy "profiles_read" on public.profiles for select using (public.can_view(id));
create policy "profiles_write" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- viewers: pemilik kelola daftar; pemantau boleh melihat baris yang menyebut emailnya
create policy "viewers_owner" on public.viewers for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "viewers_self_read" on public.viewers for select
  using (lower(viewer_email) = lower(coalesce(auth.jwt() ->> 'email', '')));

-- tabel data: baca = pemilik/pemantau, tulis = pemilik saja
do $$
declare t text;
begin
  foreach t in array array['income_items','budget_items','expenses','bills','bill_months','goals','goal_deposits'] loop
    execute format('create policy "%1$s_read" on public.%1$s for select using (public.can_view(owner_id))', t);
    execute format('create policy "%1$s_write" on public.%1$s for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

-- Pemantau perlu tahu nama pemilik untuk pilihan "lihat data siapa"
create or replace function public.owners_i_can_view()
returns table (owner_id uuid, nama text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nama from public.profiles p where public.can_view(p.id);
$$;

-- Fitur sumber dana (bank / e-wallet): jalankan juga supabase/tambah-sumber-dana.sql

-- Split bill (patungan) — lihat juga supabase/tambah-splitbill.sql
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

-- List Kebutuhan — lihat juga supabase/tambah-list-kebutuhan.sql
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

-- Pengingat Telegram — lihat juga supabase/tambah-telegram.sql
create table if not exists public.user_telegram (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  chat_id text not null,
  last_sent_on date,
  updated_at timestamptz not null default now()
);
alter table public.user_telegram enable row level security;
drop policy if exists "user_telegram_owner" on public.user_telegram;
create policy "user_telegram_owner" on public.user_telegram for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Kartu kredit sebagai sumber dana — lihat juga supabase/tambah-kartu-kredit-sumber-dana.sql
alter table public.pockets drop constraint if exists pockets_kind_check;
alter table public.pockets add constraint pockets_kind_check check (kind in ('bank','ewallet','tunai','lainnya','kredit'));
alter table public.pockets add column if not exists credit_limit bigint not null default 0;
alter table public.bills add column if not exists card_pocket_id uuid references public.pockets(id) on delete set null;

alter table public.pockets add column if not exists credit_since date;

alter table public.pockets drop constraint if exists pockets_kind_check;
alter table public.pockets add constraint pockets_kind_check check (kind in ('bank','ewallet','tunai','lainnya','kredit','paylater'));
alter table public.bills add column if not exists principal bigint not null default 0;
-- Arus — Hutang Split Bill: daftar hutang piutang dengan seseorang (mis. Kartika).
-- Hanya MENAMBAH tabel baru. Tidak mengubah data yang sudah ada. Aman dijalankan ulang.

-- Pilihan per pengguna (menu Hutang Split Bill diaktifkan dari Pengaturan)
create table if not exists public.user_prefs (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  debt_menu boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.debt_people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create unique index if not exists debt_people_name_idx on public.debt_people(owner_id, lower(name));

-- Satu baris kegiatan. paid_by: 'me' = saya yang bayar, 'them' = orang itu yang bayar.
-- amount = harga total, share = bagian yang ditagihkan ke pihak lain.
create table if not exists public.debt_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.debt_people(id) on delete cascade,
  paid_by text not null check (paid_by in ('me','them')),
  entry_on date not null default current_date,
  title text not null,
  amount bigint not null default 0 check (amount >= 0),
  share bigint not null default 0 check (share >= 0),
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists debt_entries_idx on public.debt_entries(owner_id, person_id, entry_on);

-- Pelunasan. direction: 'them_to_me' = dia bayar ke saya, 'me_to_them' = saya bayar ke dia.
create table if not exists public.debt_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  person_id uuid not null references public.debt_people(id) on delete cascade,
  direction text not null check (direction in ('them_to_me','me_to_them')),
  amount bigint not null check (amount > 0),
  paid_on date not null default current_date,
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists debt_payments_idx on public.debt_payments(owner_id, person_id, paid_on);

do $$
declare t text;
begin
  foreach t in array array['user_prefs','debt_people','debt_entries','debt_payments'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_owner" on public.%I', t, t);
    execute format('create policy "%s_owner" on public.%I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t, t);
  end loop;
end $$;

alter table public.bills drop constraint if exists bills_kind_check;
alter table public.bills add constraint bills_kind_check check (kind in ('tagihan','cicilan','hutang','kartu','paylater'));
