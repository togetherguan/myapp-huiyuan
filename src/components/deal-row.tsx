import { Link } from "@tanstack/react-router";
import { formatRM, savingsPercent } from "@/lib/format";
import type { Deal, DealWithMerchant } from "@/lib/api";

export function DealRow({
  deal,
  merchantId,
  merchantName,
}: {
  deal: Deal | DealWithMerchant;
  merchantId?: number;
  merchantName?: string;
}) {
  const name = merchantName ?? ("merchant_name" in deal ? deal.merchant_name : undefined);
  const save = savingsPercent(deal.original_price, deal.member_price);
  const targetId = merchantId ?? deal.merchant_id;
  const body = (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-3 shadow-[var(--shadow-border)]">
      {deal.image ? (
        <img src={deal.image} alt="" className="size-16 shrink-0 rounded-lg object-cover" />
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{deal.title}</p>
        {name ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {deal.kind === "service" ? "服务 · " : "产品 · "}
            {name}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {formatRM(deal.original_price)} / {deal.unit}
        </p>
      </div>
      <div className="text-right">
        <p className="font-medium text-primary tabular-nums">{formatRM(deal.member_price)}</p>
        {save > 0 ? (
          <p className="text-xs text-muted-foreground tabular-nums">省 {save}%</p>
        ) : null}
      </div>
    </div>
  );

  if (targetId) {
    return (
      <Link
        to="/store/$id"
        params={{ id: String(targetId) }}
        className="block transition-transform duration-150 active:scale-[0.96]"
      >
        {body}
      </Link>
    );
  }
  return body;
}
