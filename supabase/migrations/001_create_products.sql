create table products (
    id uuid primary key default gen_random_uuid(),

    product_code text unique not null,

    name text not null,

    brand text not null,

    manufacturer_id uuid,

    product_hash text not null,

    status text not null default 'active',

    created_at timestamptz not null default now()
);

alter table products enable row level security;

create policy "Anyone can view products"
on products
for select
to anon, authenticated
using (true);

create policy "Anyone can create products"
on products
for insert
to anon, authenticated
with check (true);