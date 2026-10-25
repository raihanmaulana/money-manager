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

-- Pelunasan bisa masuk/keluar dari sumber dana (mengubah saldo, bukan pemasukan anggaran)
alter table public.debt_payments add column if not exists pocket_id uuid references public.pockets(id) on delete set null;
