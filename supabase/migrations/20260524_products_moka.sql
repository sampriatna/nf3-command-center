-- Migration: Create products table with Moka POS integration
-- Run this in Supabase SQL Editor

create table if not exists public.products (
    id              bigserial primary key,
    moka_item_id    text unique,            -- ID item dari Moka POS (null = produk manual)
  name            text        not null,
    sku             text        not null default '',
    category        text        not null default 'Produk Jadi',
    unit            text        not null default 'pcs',
    business_unit   text        not null default 'NF',  -- 'NF' | 'F&B' | 'General'
  price_sell      bigint      not null default 0,
    current_stock   integer     not null default 0,
    min_stock       integer     not null default 0,
    location        text        not null default '',
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
  );

-- Auto-update updated_at on row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

-- Index untuk performa query
create index if not exists products_business_unit_idx on public.products(business_unit);
create index if not exists products_moka_item_id_idx   on public.products(moka_item_id);

-- Row Level Security: semua authenticated user bisa baca/tulis
alter table public.products enable row level security;

create policy "Allow all for authenticated" on public.products
  for all using (true) with check (true);

-- Setelah tabel ada, jalankan sync dari Settings > Integrasi > Moka POS
-- atau dari halaman Produk > tombol "Sync Moka"
