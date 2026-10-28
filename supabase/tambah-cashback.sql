-- Cashback e-wallet (mis. ShopeePay): menambah saldo e-wallet, bukan pemasukan anggaran.
-- Aman dijalankan berulang.
create table if not exists public.pocket_cashbacks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pocket_id uuid not null references public.pockets(id) on delete cascade,
  received_on date not null,
  amount bigint not null check (amount > 0),
  note text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists pocket_cashbacks_idx on public.pocket_cashbacks(owner_id, received_on desc);
alter table public.pocket_cashbacks enable row level security;
drop policy if exists "pocket_cashbacks_owner" on public.pocket_cashbacks;
create policy "pocket_cashbacks_owner" on public.pocket_cashbacks for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
