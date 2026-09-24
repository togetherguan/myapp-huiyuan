import { useSyncExternalStore } from "react";

export type CartItem = {
  dealId: number;
  merchantId: number;
  title: string;
  unit: string;
  unitPrice: number;
  image: string;
  qty: number;
};

const CART_KEY = "myapp-cart-v1";
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();

let cachedRaw = "";
let cached: CartItem[] = EMPTY;

function parse(raw: string): CartItem[] {
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    return Array.isArray(parsed) ? parsed.filter((i) => i.qty > 0) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function read(): CartItem[] {
  if (typeof window === "undefined") return cached;
  const raw = window.localStorage.getItem(CART_KEY) ?? "";
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  cached = raw ? parse(raw) : EMPTY;
  return cached;
}

function write(items: CartItem[]) {
  const next = items.filter((i) => i.qty > 0);
  const raw = JSON.stringify(next);
  window.localStorage.setItem(CART_KEY, raw);
  cachedRaw = raw;
  cached = next;
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getCart(): CartItem[] {
  return read();
}

export function cartForMerchant(merchantId: number): CartItem[] {
  return read().filter((i) => i.merchantId === merchantId);
}

export function cartQty(merchantId: number, dealId: number): number {
  return cartForMerchant(merchantId).find((i) => i.dealId === dealId)?.qty ?? 0;
}

export function cartTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
}

export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  const items = read();
  const idx = items.findIndex((i) => i.dealId === item.dealId && i.merchantId === item.merchantId);
  if (idx >= 0) {
    const next = items.slice();
    next[idx] = { ...next[idx]!, qty: next[idx]!.qty + qty };
    write(next);
    return;
  }
  write([...items, { ...item, qty }]);
}

export function setCartQty(merchantId: number, dealId: number, qty: number) {
  write(
    read().map((i) => (i.merchantId === merchantId && i.dealId === dealId ? { ...i, qty } : i)),
  );
}

export function clearMerchantCart(merchantId: number) {
  write(read().filter((i) => i.merchantId !== merchantId));
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
