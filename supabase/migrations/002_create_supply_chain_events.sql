create table supply_chain_events (
    id uuid primary key default gen_random_uuid(),

    product_id uuid not null
        references products(id)
        on delete cascade,

    event_type text not null,

    location text,

    actor_name text,

    notes text,

    created_at timestamptz not null default now()
);

alter table supply_chain_events enable row level security;

create policy "Anyone can view supply chain events"
on supply_chain_events
for select
to anon, authenticated
using (true);

create policy "Anyone can create supply chain events"
on supply_chain_events
for insert
to anon, authenticated
with check (true);