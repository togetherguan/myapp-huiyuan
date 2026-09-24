alter table deals add column if not exists kind text not null default 'product';

update deals
set kind = 'service'
where merchant_id in (select id from merchants where category = 'service')
  and kind = 'product';
