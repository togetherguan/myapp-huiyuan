import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/app-shell";
import { DealRow } from "@/components/deal-row";
import { StoreCard } from "@/components/store-card";
import { Skeleton } from "@/components/ui/skeleton";
import { listDeals, listMerchants } from "@/lib/api";
import { CATEGORIES, isCategoryId, type CategoryId } from "@/lib/categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/deals/$category")({
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const valid = isCategoryId(category);
  const catId = valid ? (category as CategoryId) : null;
  const cat = catId ? CATEGORIES.find((c) => c.id === catId) : undefined;

  const merchants = useQuery({
    queryKey: ["merchants", catId],
    queryFn: () => listMerchants({ data: { category: catId! } }),
    enabled: Boolean(catId),
  });
  const deals = useQuery({
    queryKey: ["deals", catId],
    queryFn: () => listDeals({ data: { category: catId!, limit: 80 } }),
    enabled: Boolean(catId),
  });

  if (!cat) {
    return (
      <AppShell>
        <PageTitle title="找不到分类" />
        <Link to="/deals" className="text-sm text-primary">
          返回全部优惠
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTitle kicker={cat.wholesale ? "批发价" : "会员折扣"} title={cat.label} />
      <div className="relative mb-5 h-36 overflow-hidden rounded-2xl">
        <img src={cat.image} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <p className="absolute bottom-3 left-3 text-sm text-foreground/90">{cat.blurb}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link
          to="/deals"
          className="shrink-0 rounded-full bg-muted px-3 py-2 text-xs font-medium text-muted-foreground"
        >
          全部
        </Link>
        {CATEGORIES.map((item) => (
          <Link
            key={item.id}
            to="/deals/$category"
            params={{ category: item.id }}
            className={cn(
              "shrink-0 rounded-full px-3 py-2 text-xs font-medium",
              item.id === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <h2 className="mt-6 mb-3 text-sm font-medium">
        {cat.wholesale ? "批发会员价" : "本类优惠"}
      </h2>
      <div className="space-y-2">
        {deals.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
        ) : deals.data?.length ? (
          deals.data.map((deal) => <DealRow key={deal.id} deal={deal} />)
        ) : (
          <p className="text-sm text-muted-foreground">这个分类暂时没有商品。</p>
        )}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium">店家</h2>
      <div className="space-y-2">
        {merchants.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : merchants.data?.length ? (
          merchants.data.map((m) => <StoreCard key={m.id} merchant={m} />)
        ) : (
          <p className="text-sm text-muted-foreground">这个分类暂时没有店家。</p>
        )}
      </div>
    </AppShell>
  );
}
