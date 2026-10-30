-- Catatan pengeluaran: jam (opsional) dan urutan manual dalam satu hari. Aman dijalankan berulang.
alter table public.expenses add column if not exists spent_time time;
alter table public.expenses add column if not exists sort_pos int;
