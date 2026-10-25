-- Jenis sumber dana PayLater + pokok per bulan untuk tagihan yang terhubung ke kartu / PayLater.
-- Aman dijalankan berulang. Jalankan juga tambah-kartu-kredit-sumber-dana.sql lebih dulu.
alter table public.pockets drop constraint if exists pockets_kind_check;
alter table public.pockets add constraint pockets_kind_check check (kind in ('bank','ewallet','tunai','lainnya','kredit','paylater'));
alter table public.bills add column if not exists principal bigint not null default 0;
