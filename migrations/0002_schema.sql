create table if not exists merchants (
  id              serial primary key,
  name            text not null,
  phone           text not null,
  category        text not null,
  address         text not null,
  city            text not null default '吉隆坡',
  discount_label  text not null,
  discount_pct    integer not null default 10,
  description     text not null default '',
  wholesale       boolean not null default false,
  code            text not null unique,
  created_at      timestamptz not null default now()
);

create index if not exists merchants_category_idx on merchants (category);
create index if not exists merchants_code_idx on merchants (code);

create table if not exists deals (
  id              serial primary key,
  merchant_id     integer not null references merchants(id) on delete cascade,
  title           text not null,
  original_price  numeric(10,2) not null,
  member_price    numeric(10,2) not null,
  unit            text not null default '件',
  created_at      timestamptz not null default now()
);

create index if not exists deals_merchant_id_idx on deals (merchant_id);

insert into merchants (name, phone, category, address, city, discount_label, discount_pct, description, wholesale, code) values
  ('旺沙茶室', '012-334 8891', 'food', '旺沙玛朱 1 路 12 号', '吉隆坡', '会员全单 8 折', 20, '家常茶室，海南咖啡与咖椰吐司。出示会员码即按会员价结账。', false, 'STFOODA1'),
  ('金龙海南鸡饭', '016-228 4410', 'food', '蕉赖 11 路商店街', '蕉赖', '会员减 RM3', 15, '白切鸡、油鸡配三大酱。会员每份立减。', false, 'STFOODB1'),
  ('夜市沙爹阿华', '011-2334 5566', 'food', '安邦夜市 18 档', '安邦', '第二串半价', 25, '炭烤鸡肉与牛肉沙爹，花生酱现磨。', false, 'STFOODC1'),
  ('老街茶餐厅', '03-4142 7788', 'food', '茨厂街 28 号', '吉隆坡', '饮品买一送一', 20, '港式奶茶、干炒牛河。会员点饮品第二杯免费。', false, 'STFOODD1'),
  ('清新汽车美容', '012-667 3344', 'service', '旺沙玛朱 3 路车间', '吉隆坡', '会员洗车 RM15', 40, '外部冲洗 + 内饰吸尘。会员价固定 RM15。', false, 'STSERVA1'),
  ('丝域发廊', '017-889 2201', 'service', '蕉赖南区 8 巷', '蕉赖', '剪发 7 折', 30, '剪发、吹整、护理。会员剪发七折。', false, 'STSERVB1'),
  ('安康体检诊所', '03-4145 9000', 'service', '士拉央医疗大道', '士拉央', '体检套餐 85 折', 15, '基础体检与疫苗。出示会员码享套餐折扣。', false, 'STSERVC1'),
  ('邻里便利店', '011-5566 7788', 'shop', '旺沙玛朱公寓底商', '吉隆坡', '指定商品 9 折', 10, '日用零食饮料。货架黄标商品会员九折。', false, 'STSHOPA1'),
  ('花市鲜花', '012-990 1122', 'shop', '安邦花市 4 街', '安邦', '花束减 RM10', 12, '鲜切花与节庆花束。会员每束立减 RM10。', false, 'STSHOPB1'),
  ('数码港配件批发', '016-778 3344', 'electronics', '乐圣泉 3 楼 21 档', '吉隆坡', '会员批发价', 35, '手机壳、贴膜、充电配件。会员按批发价拿货。', true, 'STELECA1'),
  ('闪光灯充电专批', '012-445 6677', 'electronics', '茨厂街电子街', '吉隆坡', '充电线 RM2.50 起', 40, '快充线、插头、行动电源。起批 10 件。', true, 'STELECB1'),
  ('日用品批发仓', '013-220 8899', 'daily', '甲洞工业区 7 仓', '甲洞', '批发会员价', 30, '纸巾、洗洁精、垃圾袋整箱批发。', true, 'STDAYLA1'),
  ('家居百货行', '03-6274 1100', 'daily', '万挠批发城 B 区', '万挠', '会员批发 7 折', 30, '收纳、清洁工具、厨房用品。会员七折批发。', true, 'STDAYLB1');

insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '咖椰牛油吐司', 8.50, 6.80, '份' from merchants where code = 'STFOODA1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '拉茶', 3.50, 2.80, '杯' from merchants where code = 'STFOODA1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '椰浆饭套餐', 12.00, 9.60, '份' from merchants where code = 'STFOODA1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '白切鸡饭', 14.00, 11.00, '份' from merchants where code = 'STFOODB1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '油鸡腿饭', 16.00, 13.00, '份' from merchants where code = 'STFOODB1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '鸡肉沙爹', 1.20, 0.90, '串' from merchants where code = 'STFOODC1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '牛肉沙爹', 1.50, 1.10, '串' from merchants where code = 'STFOODC1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '干炒牛河', 16.90, 13.50, '份' from merchants where code = 'STFOODD1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '港式奶茶', 6.50, 0.00, '杯' from merchants where code = 'STFOODD1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '普通洗车', 25.00, 15.00, '次' from merchants where code = 'STSERVA1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '精致打蜡', 80.00, 55.00, '次' from merchants where code = 'STSERVA1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '剪发吹整', 50.00, 35.00, '次' from merchants where code = 'STSERVB1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '护理套餐', 120.00, 84.00, '次' from merchants where code = 'STSERVB1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '基础体检', 180.00, 153.00, '份' from merchants where code = 'STSERVC1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '矿泉水 1.5L', 2.50, 2.20, '瓶' from merchants where code = 'STSHOPA1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '混合鲜花束', 45.00, 35.00, '束' from merchants where code = 'STSHOPB1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '透明手机壳 起批 20', 8.00, 3.00, '个' from merchants where code = 'STELECA1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '钢化贴膜 起批 20', 6.00, 2.20, '片' from merchants where code = 'STELECA1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, 'TPE 快充线 起批 10', 9.90, 2.50, '条' from merchants where code = 'STELECB1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '20W 插头 起批 10', 18.00, 7.90, '个' from merchants where code = 'STELECB1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '抽纸 10 包装', 16.90, 11.50, '提' from merchants where code = 'STDAYLA1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '洗洁精 4L', 19.90, 13.90, '桶' from merchants where code = 'STDAYLA1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '收纳箱 3 件套', 39.90, 27.90, '套' from merchants where code = 'STDAYLB1';
insert into deals (merchant_id, title, original_price, member_price, unit)
select id, '扫把畚箕套装', 22.00, 15.40, '套' from merchants where code = 'STDAYLB1';
