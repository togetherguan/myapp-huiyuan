import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageTitle } from "@/components/app-shell";
import { DealRow } from "@/components/deal-row";
import { StoreCard } from "@/components/store-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listDeals, listMerchants, type Merchant } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/deals")({ component: DealsPage });

function filterMerchants(list: Merchant[] | undefined, q: string) {
  if (!list) return [];
  const n = q.trim().toLowerCase();
  if (!n) return list;
  return list.filter((m) =>
    `${m.name} ${m.phone} ${m.tng_phone} ${m.address} ${m.city} ${m.code}`.toLowerCase().includes(n),
  );
}

function DealsPage() {
  const [q, setQ] = useState("");
  const merchants = useQuery({
    queryKey: ["merchants"],
    queryFn: () => listMerchants({ data: {} }),
  });
  const deals = useQuery({
    queryKey: ["deals", "all"],
    queryFn: () => listDeals({ data: { limit: 80 } }),
  });
  const visible = useMemo(() => filterMerchants(merchants.data, q), [merchants.data, q]);
  const visibleDeals = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return deals.data ?? [];
    return (deals.data ?? []).filter((d) =>
      `${d.title} ${d.merchant_name}`.toLowerCase().includes(n),
    );
  }, [deals.data, q]);

  return (
    <AppShell>
      <PageTitle kicker="优惠" title="全部分类" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索店家或产品"
        className="mb-4"
      />
      <div className="flex gap-2 overflow-x-auto pb-2">
        <span className="rounded-full bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
          全部
        </span>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.id}
            to="/deals/$category"
            params={{ category: cat.id }}
            className="shrink-0 rounded-full bg-muted px-3 py-2 text-xs font-medium text-muted-foreground"
          >
            {cat.label}
          </Link>
        ))}
      </div>

      <h2 className="mt-6 mb-3 text-sm font-medium">会员价商品</h2>
      <div className="space-y-2">
        {deals.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
          : visibleDeals.map((deal) => <DealRow key={deal.id} deal={deal} />)}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium">店家</h2>
      <div className="space-y-2">
        {merchants.isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
          : visible.map((m) => <StoreCard key={m.id} merchant={m} />)}
        {!merchants.isLoading && q && visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">找不到这家店。</p>
        ) : null}
      </div>
    </AppShell>
  );
}
