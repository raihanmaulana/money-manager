-- Arus — Pengingat Telegram: menyimpan chat ID Telegram tiap pengguna.
-- Hanya MENAMBAH tabel baru. Aman dijalankan ulang.
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
