import { Link } from "@tanstack/react-router";
import { CATEGORY_MAP, type CategoryId } from "@/lib/categories";
import type { Merchant } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function StoreCard({ merchant }: { merchant: Merchant }) {
  const cat = CATEGORY_MAP[merchant.category as CategoryId] ?? CATEGORY_MAP.shop;
  return (
    <Link
      to="/store/$id"
      params={{ id: String(merchant.id) }}
      className={cn(
        "flex gap-3 rounded-2xl bg-card p-2 shadow-[var(--shadow-border)]",
        "transition-[transform,box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]",
        "active:scale-[0.96]",
      )}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg">
        <img
          src={cat.image}
          alt=""
          className="size-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 py-1 pr-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-medium">{merchant.name}</h3>
          {merchant.wholesale ? (
            <Badge variant="default" className="shrink-0">
              批发
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 truncate text-sm text-primary">{merchant.discount_label}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {merchant.city} · {merchant.phone}
        </p>
      </div>
    </Link>
  );
}
