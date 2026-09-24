import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { parseCategory, type CategoryId } from "@/lib/categories";

export type DealKind = "product" | "service";

export type Merchant = {
  id: number;
  name: string;
  phone: string;
  category: CategoryId;
  address: string;
  city: string;
  discount_label: string;
  discount_pct: number;
  description: string;
  wholesale: boolean;
  code: string;
  tng_phone: string;
  created_at: string;
};

export type Deal = {
  id: number;
  merchant_id: number;
  title: string;
  original_price: string;
  member_price: string;
  unit: string;
  kind: DealKind;
  image: string;
  created_at: string;
};

export type DealWithMerchant = Deal & {
  merchant_name: string;
  merchant_code: string;
  merchant_category: string;
  discount_label: string;
  wholesale: boolean;
};

export type OrderItem = {
  id: number;
  order_id: number;
  deal_id: number | null;
  title: string;
  unit: string;
  qty: number;
  unit_price: string;
  image: string;
};

export type Order = {
  id: number;
  code: string;
  member_id: string;
  merchant_id: number;
  merchant_name: string;
  amount: string;
  method: string;
  status: string;
  tng_phone: string;
  created_at: string;
  items: OrderItem[];
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let body = "";
  for (let i = 0; i < 6; i += 1) body += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return `ST${body}`;
}

function asIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value ?? "");
}

function mapMerchant(row: Record<string, unknown>): Merchant {
  return {
    id: Number(row.id),
    name: String(row.name),
    phone: String(row.phone),
    category: row.category as CategoryId,
    address: String(row.address),
    city: String(row.city),
    discount_label: String(row.discount_label),
    discount_pct: Number(row.discount_pct),
    description: String(row.description ?? ""),
    wholesale: Boolean(row.wholesale),
    code: String(row.code),
    tng_phone: String(row.tng_phone || row.phone || ""),
    created_at: asIso(row.created_at),
  };
}

function mapDeal(row: Record<string, unknown>): Deal {
  return {
    id: Number(row.id),
    merchant_id: Number(row.merchant_id),
    title: String(row.title),
    original_price: String(row.original_price),
    member_price: String(row.member_price),
    unit: String(row.unit),
    kind: row.kind === "service" ? "service" : "product",
    image: typeof row.image === "string" ? row.image : "",
    created_at: asIso(row.created_at),
  };
}

const ADMIN_PASSWORD = "880219146177";

function assertAdmin(password: string) {
  if (password !== ADMIN_PASSWORD) {
    throw new Error("密码错误");
  }
}

const passwordField = z.object({ password: z.string().min(1) });

const merchantInput = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(6).max(24),
  category: z.enum(["food", "service", "shop", "electronics", "daily"]),
  address: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(40).default("吉隆坡"),
  discount_label: z.string().trim().min(1).max(40),
  discount_pct: z.coerce.number().int().min(0).max(90),
  description: z.string().trim().max(280).optional().default(""),
  wholesale: z.boolean().optional(),
  tng_phone: z.string().trim().max(24).optional().default(""),
});

export const listMerchants = createServerFn({ method: "GET" })
  .validator(
    z.object({
      category: z.enum(["food", "service", "shop", "electronics", "daily"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = data.category
      ? await sql.query<Record<string, unknown>>(
          "select * from merchants where category = $1 order by id desc",
          [data.category],
        )
      : await sql.query<Record<string, unknown>>(
          "select * from merchants order by id desc",
        );
    return rows.map(mapMerchant);
  });

export const listDeals = createServerFn({ method: "GET" })
  .validator(
    z.object({
      category: z.enum(["food", "service", "shop", "electronics", "daily"]).optional(),
      limit: z.coerce.number().int().min(1).max(80).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const limit = data.limit ?? 40;
    const rows = data.category
      ? await sql.query<Record<string, unknown>>(
          `select d.id, d.merchant_id, d.title, d.original_price, d.member_price, d.unit, d.kind, d.image, d.created_at,
                  m.name as merchant_name, m.code as merchant_code, m.category as merchant_category,
                  m.discount_label, m.wholesale
           from deals d
           join merchants m on m.id = d.merchant_id
           where m.category = $1
           order by d.id desc
           limit $2`,
          [data.category, limit],
        )
      : await sql.query<Record<string, unknown>>(
          `select d.id, d.merchant_id, d.title, d.original_price, d.member_price, d.unit, d.kind, d.image, d.created_at,
                  m.name as merchant_name, m.code as merchant_code, m.category as merchant_category,
                  m.discount_label, m.wholesale
           from deals d
           join merchants m on m.id = d.merchant_id
           order by d.id desc
           limit $1`,
          [limit],
        );
    return rows.map((row) => ({
      ...mapDeal(row),
      merchant_name: String(row.merchant_name),
      merchant_code: String(row.merchant_code),
      merchant_category: String(row.merchant_category),
      discount_label: String(row.discount_label),
      wholesale: Boolean(row.wholesale),
    })) satisfies DealWithMerchant[];
  });

export const getMerchant = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.coerce.number().int().positive() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from merchants where id = $1",
      [data.id],
    );
    const row = rows[0];
    if (!row) return null;
    const deals = await sql.query<Record<string, unknown>>(
      "select * from deals where merchant_id = $1 order by id asc",
      [data.id],
    );
    return { merchant: mapMerchant(row), deals: deals.map(mapDeal) };
  });

export const getMerchantByCode = createServerFn({ method: "GET" })
  .validator(z.object({ code: z.string().trim().min(1).max(16) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      "select * from merchants where upper(code) = upper($1)",
      [data.code],
    );
    const row = rows[0];
    if (!row) return null;
    const deals = await sql.query<Record<string, unknown>>(
      "select * from deals where merchant_id = $1 order by id asc",
      [row.id],
    );
    return { merchant: mapMerchant(row), deals: deals.map(mapDeal) };
  });

export const getStats = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const merchants = await sql.query<{ n: number }>("select count(*)::int as n from merchants");
  const deals = await sql.query<{ n: number }>("select count(*)::int as n from deals");
  return { merchants: merchants[0]?.n ?? 0, deals: deals[0]?.n ?? 0 };
});

export const verifyAdmin = createServerFn({ method: "POST" })
  .validator(passwordField)
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    return { ok: true as const };
  });

async function insertMerchant(
  data: z.infer<typeof merchantInput>,
): Promise<Merchant> {
  const sql = await getSql();
  const wholesale =
    data.wholesale ?? (data.category === "electronics" || data.category === "daily");
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const code = randomCode();
    try {
      const rows = await sql.query<Record<string, unknown>>(
        `insert into merchants
          (name, phone, category, address, city, discount_label, discount_pct, description, wholesale, code, tng_phone)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         returning *`,
        [
          data.name,
          data.phone,
          data.category,
          data.address,
          data.city || "吉隆坡",
          data.discount_label,
          data.discount_pct,
          data.description ?? "",
          wholesale,
          code,
          data.tng_phone?.trim() || data.phone,
        ],
      );
      return mapMerchant(rows[0]!);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.toLowerCase().includes("unique") && attempt < 5) continue;
      throw err;
    }
  }
  throw new Error("无法生成店家编码，请再试一次");
}

export const createMerchant = createServerFn({ method: "POST" })
  .validator(merchantInput.extend(passwordField.shape))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const { password: _password, ...rest } = data;
    return insertMerchant(rest);
  });

export const updateMerchant = createServerFn({ method: "POST" })
  .validator(merchantInput.extend({ id: z.coerce.number().int().positive() }).extend(passwordField.shape))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const sql = await getSql();
    const wholesale =
      data.wholesale ?? (data.category === "electronics" || data.category === "daily");
    const rows = await sql.query<Record<string, unknown>>(
      `update merchants set
         name = $1, phone = $2, category = $3, address = $4, city = $5,
         discount_label = $6, discount_pct = $7, description = $8, wholesale = $9, tng_phone = $10
       where id = $11
       returning *`,
      [
        data.name,
        data.phone,
        data.category,
        data.address,
        data.city || "吉隆坡",
        data.discount_label,
        data.discount_pct,
        data.description ?? "",
        wholesale,
        data.tng_phone?.trim() || data.phone,
        data.id,
      ],
    );
    if (!rows[0]) throw new Error("店家不存在");
    return mapMerchant(rows[0]);
  });

export const deleteMerchant = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.coerce.number().int().positive() }).extend(passwordField.shape))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const sql = await getSql();
    await sql.query("delete from merchants where id = $1", [data.id]);
    return { ok: true };
  });

export const createDeal = createServerFn({ method: "POST" })
  .validator(
    z.object({
      merchant_id: z.coerce.number().int().positive(),
      title: z.string().trim().min(1).max(80),
      original_price: z.coerce.number().min(0).max(999999),
      member_price: z.coerce.number().min(0).max(999999),
      unit: z.string().trim().min(1).max(12).default("件"),
      kind: z.enum(["product", "service"]).default("product"),
      image: z
        .string()
        .max(400_000)
        .optional()
        .default("")
        .refine((value) => !value || value.startsWith("data:image/"), "请上传有效图片"),
    }).extend(passwordField.shape),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `insert into deals (merchant_id, title, original_price, member_price, unit, kind, image)
       values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [
        data.merchant_id,
        data.title,
        data.original_price,
        data.member_price,
        data.unit || (data.kind === "service" ? "次" : "件"),
        data.kind,
        data.image ?? "",
      ],
    );
    return mapDeal(rows[0]!);
  });

export const deleteDeal = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.coerce.number().int().positive() }).extend(passwordField.shape))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const sql = await getSql();
    await sql.query("delete from deals where id = $1", [data.id]);
    return { ok: true };
  });

export const importMerchants = createServerFn({ method: "POST" })
  .validator(z.object({ text: z.string().min(1).max(12000) }).extend(passwordField.shape))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const lines = data.text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));
    const created: Merchant[] = [];
    const errors: string[] = [];

    for (const [index, line] of lines.entries()) {
      const parts = line.split(/[,，\t]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) continue;
      try {
        let name: string;
        let phone: string;
        let category: CategoryId;
        let address = "待补充地址";
        let discount_label = "会员优惠";
        let discount_pct = 10;

        if (parts.length === 1) {
          phone = parts[0]!;
          name = `待完善 · ${phone}`;
          category = "shop";
        } else {
          name = parts[0]!;
          phone = parts[1] ?? "";
          category = parseCategory(parts[2] ?? "shop");
          if (parts[3]) address = parts[3];
          if (parts[4]) discount_label = parts[4];
          if (parts[5] && /^\d+$/.test(parts[5])) discount_pct = Number(parts[5]);
        }

        if (phone.length < 6) {
          errors.push(`第 ${index + 1} 行：电话太短`);
          continue;
        }

        const merchant = await insertMerchant({
          name,
          phone,
          category,
          address,
          city: "吉隆坡",
          discount_label,
          discount_pct,
          description: "",
          tng_phone: phone,
          wholesale: category === "electronics" || category === "daily",
        });
        created.push(merchant);
      } catch (err) {
        errors.push(
          `第 ${index + 1} 行：${err instanceof Error ? err.message : "无法导入"}`,
        );
      }
    }

    return { created, errors };
  });

const ORDER_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomOrderCode(): string {
  let body = "";
  for (let i = 0; i < 6; i += 1) body += ORDER_CHARS[Math.floor(Math.random() * ORDER_CHARS.length)];
  return `TN${body}`;
}

function mapOrderItem(row: Record<string, unknown>): OrderItem {
  return {
    id: Number(row.id),
    order_id: Number(row.order_id),
    deal_id: row.deal_id == null ? null : Number(row.deal_id),
    title: String(row.title),
    unit: String(row.unit),
    qty: Number(row.qty),
    unit_price: String(row.unit_price),
    image: String(row.image ?? ""),
  };
}

function mapOrder(row: Record<string, unknown>, items: OrderItem[]): Order {
  return {
    id: Number(row.id),
    code: String(row.code),
    member_id: String(row.member_id),
    merchant_id: Number(row.merchant_id),
    merchant_name: String(row.merchant_name ?? ""),
    amount: String(row.amount),
    method: String(row.method ?? "tng"),
    status: String(row.status),
    tng_phone: String(row.tng_phone ?? ""),
    created_at: asIso(row.created_at),
    items,
  };
}

async function loadOrderItems(orderId: unknown): Promise<OrderItem[]> {
  const sql = await getSql();
  const items = await sql.query<Record<string, unknown>>(
    "select * from order_items where order_id = $1 order by id asc",
    [orderId],
  );
  return items.map(mapOrderItem);
}

export const createOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      member_id: z.string().trim().min(6).max(20),
      merchant_id: z.coerce.number().int().positive(),
      items: z
        .array(
          z.object({
            deal_id: z.coerce.number().int().positive().optional(),
            title: z.string().trim().min(1).max(80),
            unit: z.string().trim().min(1).max(12),
            qty: z.coerce.number().int().min(1).max(99),
            unit_price: z.coerce.number().min(0).max(999999),
            image: z.string().max(400_000).optional().default(""),
          }),
        )
        .min(1)
        .max(40),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const merchants = await sql.query<Record<string, unknown>>(
      "select * from merchants where id = $1",
      [data.merchant_id],
    );
    const merchant = merchants[0];
    if (!merchant) throw new Error("店家不存在");

    const amount = data.items.reduce((sum, item) => sum + item.unit_price * item.qty, 0);
    const tngPhone = String(merchant.tng_phone || merchant.phone || "");

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = randomOrderCode();
      try {
        const rows = await sql.query<Record<string, unknown>>(
          `insert into orders (code, member_id, merchant_id, amount, method, status, tng_phone)
           values ($1,$2,$3,$4,'tng','pending',$5)
           returning *`,
          [code, data.member_id, data.merchant_id, amount, tngPhone],
        );
        const order = rows[0]!;
        for (const item of data.items) {
          await sql.query(
            `insert into order_items (order_id, deal_id, title, unit, qty, unit_price, image)
             values ($1,$2,$3,$4,$5,$6,$7)`,
            [
              order.id,
              item.deal_id ?? null,
              item.title,
              item.unit,
              item.qty,
              item.unit_price,
              item.image ?? "",
            ],
          );
        }
        const items = await sql.query<Record<string, unknown>>(
          "select * from order_items where order_id = $1 order by id asc",
          [order.id],
        );
        return {
          id: Number(order.id),
          code: String(order.code),
          member_id: String(order.member_id),
          merchant_id: Number(order.merchant_id),
          merchant_name: String(merchant.name),
          amount: String(order.amount),
          method: "tng",
          status: "pending",
          tng_phone: tngPhone,
          created_at: asIso(order.created_at),
          items: items.map(mapOrderItem),
        } satisfies Order;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes("unique") && attempt < 5) continue;
        throw err;
      }
    }
    throw new Error("无法建立付款单，请再试一次");
  });

export const getOrder = createServerFn({ method: "GET" })
  .validator(z.object({ code: z.string().trim().min(4).max(16) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `select o.*, m.name as merchant_name
       from orders o
       join merchants m on m.id = o.merchant_id
       where upper(o.code) = upper($1)`,
      [data.code],
    );
    const row = rows[0];
    if (!row) return null;
    const items = await sql.query<Record<string, unknown>>(
      "select * from order_items where order_id = $1 order by id asc",
      [row.id],
    );
    return {
      id: Number(row.id),
      code: String(row.code),
      member_id: String(row.member_id),
      merchant_id: Number(row.merchant_id),
      merchant_name: String(row.merchant_name),
      amount: String(row.amount),
      method: String(row.method),
      status: String(row.status),
      tng_phone: String(row.tng_phone),
      created_at: asIso(row.created_at),
      items: items.map(mapOrderItem),
    } satisfies Order;
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .validator(z.object({ member_id: z.string().trim().min(6).max(20) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `select o.*, m.name as merchant_name
       from orders o
       join merchants m on m.id = o.merchant_id
       where o.member_id = $1 and o.status <> 'cancelled'
       order by o.id desc
       limit 30`,
      [data.member_id],
    );
    const result: Order[] = [];
    for (const row of rows) {
      const items = await sql.query<Record<string, unknown>>(
        "select * from order_items where order_id = $1 order by id asc",
        [row.id],
      );
      result.push({
        id: Number(row.id),
        code: String(row.code),
        member_id: String(row.member_id),
        merchant_id: Number(row.merchant_id),
        merchant_name: String(row.merchant_name),
        amount: String(row.amount),
        method: String(row.method),
        status: String(row.status),
        tng_phone: String(row.tng_phone),
        created_at: asIso(row.created_at),
        items: items.map(mapOrderItem),
      });
    }
    return result;
  });

export const markOrderPaid = createServerFn({ method: "POST" })
  .validator(
    z.object({
      code: z.string().trim().min(4).max(16),
      member_id: z.string().trim().min(6).max(20),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `update orders set status = 'paid'
       where upper(code) = upper($1) and member_id = $2
       returning *`,
      [data.code, data.member_id],
    );
    if (!rows[0]) throw new Error("找不到这笔付款");
    return { ok: true as const, status: "paid" as const };
  });

export const getPendingOrder = createServerFn({ method: "GET" })
  .validator(
    z.object({
      member_id: z.string().trim().min(6).max(20),
      merchant_id: z.coerce.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `select o.*, m.name as merchant_name
       from orders o
       join merchants m on m.id = o.merchant_id
       where o.member_id = $1 and o.merchant_id = $2 and o.status = 'pending'
       order by o.id desc
       limit 1`,
      [data.member_id, data.merchant_id],
    );
    const row = rows[0];
    if (!row) return null;
    return mapOrder(row, await loadOrderItems(row.id));
  });

export const cancelOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({
      code: z.string().trim().min(4).max(16),
      member_id: z.string().trim().min(6).max(20),
    }),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `update orders set status = 'cancelled'
       where upper(code) = upper($1) and member_id = $2 and status = 'pending'
       returning *`,
      [data.code, data.member_id],
    );
    if (!rows[0]) throw new Error("找不到这笔待付款");
    return { ok: true as const };
  });

export const listAdminOrders = createServerFn({ method: "POST" })
  .validator(passwordField)
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `select o.*, m.name as merchant_name
       from orders o
       join merchants m on m.id = o.merchant_id
       where o.status <> 'cancelled'
       order by o.id desc
       limit 50`,
    );
    const result: Order[] = [];
    for (const row of rows) {
      const items = await loadOrderItems(row.id);
      result.push(
        mapOrder(
          row,
          items.map((item) => ({ ...item, image: "" })),
        ),
      );
    }
    return result;
  });

export const confirmOrder = createServerFn({ method: "POST" })
  .validator(
    z.object({ code: z.string().trim().min(4).max(16) }).extend(passwordField.shape),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const sql = await getSql();
    const rows = await sql.query<Record<string, unknown>>(
      `update orders set status = 'confirmed'
       where upper(code) = upper($1) and status in ('paid', 'pending')
       returning *`,
      [data.code],
    );
    if (!rows[0]) throw new Error("找不到这笔付款");
    return { ok: true as const, status: "confirmed" as const };
  });
