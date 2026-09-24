insert into merchants (
  name, phone, category, address, city, discount_label, discount_pct,
  description, wholesale, code, tng_phone
)
select
  'Smart Gadget Guru Sdn Bhd',
  '0168300219',
  'electronics',
  '5 Jalan 17/42 Taman Kok Doh, Segambut, 51200 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur',
  'Kuala Lumpur',
  '会员 8 折',
  20,
  'Segambut 电子配件。出示会员码享会员价。',
  true,
  'ST75GRYK',
  '0168300219'
where not exists (select 1 from merchants where code = 'ST75GRYK');

update merchants
set phone = '0168300219',
    tng_phone = '0168300219',
    category = 'electronics',
    wholesale = true,
    address = '5 Jalan 17/42 Taman Kok Doh, Segambut, 51200 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur',
    city = 'Kuala Lumpur',
    discount_label = '会员 8 折',
    discount_pct = 20
where code = 'ST75GRYK';

insert into deals (merchant_id, title, original_price, member_price, unit, kind, image)
select m.id, 'Mini按摩枪', 19.90, 15.00, '件', 'product', '/images/smart-gadget-mini.jpg'
from merchants m
where m.code = 'ST75GRYK'
  and not exists (
    select 1 from deals d where d.merchant_id = m.id and d.title = 'Mini按摩枪'
  );

update deals d
set unit = '件',
    image = '/images/smart-gadget-mini.jpg',
    original_price = 19.90,
    member_price = 15.00,
    kind = 'product'
from merchants m
where d.merchant_id = m.id
  and m.code = 'ST75GRYK'
  and d.title = 'Mini按摩枪';
