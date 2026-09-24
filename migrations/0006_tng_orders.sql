alter table merchants add column if not exists tng_phone text not null default '';

update merchants
set tng_phone = phone
where tng_phone = '';

create table if not exists orders (
  id           serial primary key,
  code         text not null unique,
  member_id    text not null,
  merchant_id  integer not null references merchants(id) on delete cascade,
  amount       numeric(10,2) not null,
  method       text not null default 'tng',
  status       text not null default 'pending',
  tng_phone    text not null default '',
  created_at   timestamptz not null default now()
);

create index if not exists orders_member_id_idx on orders (member_id);
create index if not exists orders_merchant_id_idx on orders (merchant_id);
create index if not exists orders_code_idx on orders (code);

create table if not exists order_items (
  id          serial primary key,
  order_id    integer not null references orders(id) on delete cascade,
  deal_id     integer,
  title       text not null,
  unit        text not null default '件',
  qty         integer not null,
  unit_price  numeric(10,2) not null,
  image       text not null default ''
);

create index if not exists order_items_order_id_idx on order_items (order_id);
