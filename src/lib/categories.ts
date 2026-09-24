import {
  Cpu,
  ShoppingBag,
  Store,
  Utensils,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_IDS = [
  "food",
  "service",
  "shop",
  "electronics",
  "daily",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type CategoryMeta = {
  id: CategoryId;
  label: string;
  blurb: string;
  image: string;
  icon: LucideIcon;
  wholesale: boolean;
};

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "food",
    label: "美食折扣",
    blurb: "茶室、餐厅、夜市",
    image: "/images/cat-food.jpg",
    icon: Utensils,
    wholesale: false,
  },
  {
    id: "service",
    label: "服务折扣",
    blurb: "美容、汽修、诊所",
    image: "/images/cat-service.jpg",
    icon: ShoppingBag,
    wholesale: false,
  },
  {
    id: "shop",
    label: "店家折扣",
    blurb: "便利店、花店、零售",
    image: "/images/cat-shop.jpg",
    icon: Store,
    wholesale: false,
  },
  {
    id: "electronics",
    label: "电子批发",
    blurb: "配件、充电、数码",
    image: "/images/cat-electronics.jpg",
    icon: Cpu,
    wholesale: true,
  },
  {
    id: "daily",
    label: "生活用品批发",
    blurb: "纸巾、清洁、家居",
    image: "/images/cat-daily.jpg",
    icon: Warehouse,
    wholesale: true,
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryMeta>;

export function isCategoryId(value: string): value is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

export function parseCategory(raw: string): CategoryId {
  const v = raw.trim().toLowerCase();
  if (["美食", "食物", "food", "餐", "餐饮", "茶室"].some((k) => v.includes(k)))
    return "food";
  if (["服务", "service", "美容", "汽", "诊所"].some((k) => v.includes(k)))
    return "service";
  if (["电子", "数码", "electronics", "充电", "配件"].some((k) => v.includes(k)))
    return "electronics";
  if (["日用", "生活", "daily", "百货", "批发仓"].some((k) => v.includes(k)))
    return "daily";
  if (["店家", "商店", "shop", "便利", "花"].some((k) => v.includes(k)))
    return "shop";
  if ((CATEGORY_IDS as readonly string[]).includes(v)) return v as CategoryId;
  return "shop";
}
