import { Link } from "@tanstack/react-router";
import { MapPin, Minus, Phone, Plus, Wallet } from "lucide-react";
import type { Deal, Merchant } from "@/lib/api";
import { addToCart, cartTotal, setCartQty, useCart } from "@/lib/cart";
import { CATEGORY_MAP, type CategoryId } from "@/lib/categories";
import { formatPhoneTel, formatRM } from "@/lib/format";
import { storeQrValue } from "@/lib/scan";
import { QrPanel } from "@/components/qr-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function StorePageBody({
  merchant,
  deals,
}: {
  merchant: Merchant;
  deals: Deal[];
}) {
  const cat = CATEGORY_MAP[merchant.category as CategoryId] ?? CATEGORY_MAP.shop;
  const qrValue = storeQrValue(merchant.code);
  const cart = useCart().filter((i) => i.merchantId === merchant.id);
  const total = cartTotal(cart);
  const products = deals.filter((d) => d.kind !== "service");
  const services = deals.filter((d) => d.kind === "service");

  return (
    <>
      <div className="relative h-44 overflow-hidden rounded-2xl">
        <img src={cat.image} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-2">
          <div>
            <p className="text-xs text-foreground/70">{cat.label}</p>
            <h1 className="font-display text-3xl font-medium tracking-tight">{merchant.name}</h1>
          </div>
          {merchant.wholesale ? <Badge>批发</Badge> : null}
        </div>
      </div>

      <p className="mt-4 text-lg font-medium text-primary">{merchant.discount_label}</p>
      {merchant.description ? (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{merchant.description}</p>
      ) : null}

      <div className="mt-4 space-y-2 text-sm">
        <a
          href={formatPhoneTel(merchant.phone)}
          className="flex min-h-11 items-center gap-2 rounded-xl bg-card px-3 text-foreground shadow-[var(--shadow-border)]"
        >
          <Phone className="size-4 text-muted-foreground" />
          {merchant.phone}
        </a>
        <p className="flex min-h-11 items-center gap-2 rounded-xl bg-card px-3 shadow-[var(--shadow-border)]">
          <Wallet className="size-4 shrink-0 text-muted-foreground" />
          <span>TNG {merchant.tng_phone || merchant.phone}</span>
        </p>
        <p className="flex min-h-11 items-center gap-2 rounded-xl bg-card px-3 shadow-[var(--shadow-border)]">
          <MapPin className="size-4 shrink-0 text-muted-foreground" />
          <span>
            {merchant.address} · {merchant.city}
          </span>
        </p>
      </div>

      <OfferSection
        title={merchant.wholesale ? "批发产品" : "产品"}
        empty="尚未添加产品。"
        deals={products}
        merchant={merchant}
      />
      <OfferSection
        title="服务"
        empty="尚未添加服务。"
        deals={services}
        merchant={merchant}
      />

      <section className="mt-8 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
        <h2 className="text-sm font-medium">店家二维码</h2>
        <p className="mt-1 mb-4 text-xs text-muted-foreground">
          张贴于收银台。顾客扫描后即可查看会员价。
        </p>
        <QrPanel value={qrValue} caption={merchant.code} filename={`myapp-${merchant.code}`} />
      </section>

      <div className="h-16" />
      <div className="fixed inset-x-0 bottom-16 z-30 px-4 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-md">
          <Button asChild className="h-12 w-full shadow-lg">
            <Link to="/pay/$id" params={{ id: String(merchant.id) }}>
              {total > 0 ? `TNG 付款 ${formatRM(total)}` : "用 TNG 付款给店家"}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}

function OfferSection({
  title,
  empty,
  deals,
  merchant,
}: {
  title: string;
  empty: string;
  deals: Deal[];
  merchant: Merchant;
}) {
  const cart = useCart();
  return (
    <>
      <h2 className="mt-8 mb-3 text-sm font-medium">{title}</h2>
      <div className="space-y-2">
        {deals.length ? (
          deals.map((deal) => {
            const qty =
              cart.find((i) => i.dealId === deal.id && i.merchantId === merchant.id)?.qty ?? 0;
            return (
              <article
                key={deal.id}
                className="flex items-center gap-3 rounded-xl bg-card px-3 py-3 shadow-[var(--shadow-border)]"
              >
                {deal.image ? (
                  <img src={deal.image} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{deal.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRM(deal.original_price)} / {deal.unit}
                  </p>
                  <p className="mt-1 font-medium text-primary tabular-nums">
                    {formatRM(deal.member_price)}
                  </p>
                </div>
                {qty === 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      addToCart({
                        dealId: deal.id,
                        merchantId: merchant.id,
                        title: deal.title,
                        unit: deal.unit,
                        unitPrice: Number(deal.member_price),
                        image: deal.image,
                      })
                    }
                  >
                    加入
                  </Button>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="size-9"
                      onClick={() => setCartQty(merchant.id, deal.id, qty - 1)}
                    >
                      <Minus className="size-4" />
                    </Button>
                    <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="size-9"
                      onClick={() => setCartQty(merchant.id, deal.id, qty + 1)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground">{empty}</p>
        )}
      </div>
    </>
  );
}
