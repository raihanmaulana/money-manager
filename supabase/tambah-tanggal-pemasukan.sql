-- Tanggal masuk uang (mis. gajian tgl 25): saldo sumber dana baru bertambah/berkurang setelah tanggal itu tiba.
-- Kosong = dihitung sejak awal bulan (perilaku lama). Aman dijalankan berulang.
alter table public.income_items add column if not exists pay_day int check (pay_day between 1 and 31);
alter table public.month_template add column if not exists pay_day int check (pay_day between 1 and 31);
