-- Arus — Sumber dana jenis "Kartu kredit" (limit + terpakai) dan tautan tagihan kartu ke kartunya.
-- Hanya MENAMBAH kolom/izin jenis baru. Tidak menghapus atau mengubah data yang sudah ada. Aman dijalankan ulang.
alter table public.pockets drop constraint if exists pockets_kind_check;
alter table public.pockets add constraint pockets_kind_check check (kind in ('bank','ewallet','tunai','lainnya','kredit'));
alter table public.pockets add column if not exists credit_limit bigint not null default 0;
alter table public.bills add column if not exists card_pocket_id uuid references public.pockets(id) on delete set null;

-- Pembayaran/pemakaian kartu hanya dihitung mulai tanggal ini (kosong = sejak kartu dibuat)
alter table public.pockets add column if not exists credit_since date;
