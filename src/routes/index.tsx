import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, PageTitle } from "@/components/app-shell";
import { DealRow } from "@/components/deal-row";
import { MemberCard } from "@/components/member-card";
import { StoreCard } from "@/components/store-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { listDeals, listMerchants, type Merchant } from "@/lib/api";
import { CATEGORIES } from "@/lib/categories";
import { useMember } from "@/lib/member-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Home });

function filterMerchants(list: Merchant[] | undefined, q: string) {
  if (!list) return [];
  const n = q.trim().toLowerCase();
  if (!n) return list;
  return list.filter((m) =>
    `${m.name} ${m.phone} ${m.tng_phone} ${m.address} ${m.city} ${m.code}`.toLowerCase().includes(n),
  );
}

function Home() {
  const { member, ready } = useMember();
  const [q, setQ] = useState("");
  const merchants = useQuery({
    queryKey: ["merchants"],
    queryFn: () => listMerchants({ data: {} }),
  });
  const deals = useQuery({
    queryKey: ["deals", "featured"],
    queryFn: () => listDeals({ data: { limit: 8 } }),
  });
  const visible = useMemo(() => filterMerchants(merchants.data, q), [merchants.data, q]);

  return (
    <AppShell>
      <PageTitle
        kicker="MyApp"
        title="会员折扣"
        action={
          <Badge variant="muted" className="mb-1">
            已是会员
          </Badge>
        }
      />

      {ready && member ? (
        <MemberCard member={member} />
      ) : (
        <Skeleton className="h-36 w-full rounded-2xl" />
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-medium">分类优惠</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.id}
              to="/deals/$category"
              params={{ category: cat.id }}
              className={cn(
                "relative overflow-hidden rounded-xl active:scale-[0.96]",
                "transition-transform duration-150",
                i === 4 ? "col-span-2 h-28" : "h-32",
              )}
            >
              <img src={cat.image} alt="" className="absolute inset-0 size-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-sm font-medium">{cat.label}</p>
                <p className="text-xs text-foreground/70">{cat.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-medium">精选会员价</h2>
          <Link to="/deals" className="text-xs text-muted-foreground">
            全部
          </Link>
        </div>
        <div className="space-y-2">
          {deals.isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))
            : deals.data?.map((deal) => <DealRow key={deal.id} deal={deal} />)}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-medium">合作店家</h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            {merchants.data?.length ?? "—"} 家
          </p>
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索店名、电话"
          className="mb-3"
        />
        <div className="space-y-2">
          {merchants.isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-2xl" />
              ))
            : visible.map((m) => <StoreCard key={m.id} merchant={m} />)}
          {!merchants.isLoading && q && visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">找不到这家店。</p>
          ) : null}
        </div>
      </section>
    </AppShell>
  );
}
