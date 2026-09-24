import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { getMerchantByCode } from "@/lib/api";
import { StorePageBody } from "@/components/store-body";

export const Route = createFileRoute("/s/$code")({ component: StoreByCode });

function StoreByCode() {
  const { code } = Route.useParams();
  const query = useQuery({
    queryKey: ["merchant-code", code],
    queryFn: () => getMerchantByCode({ data: { code } }),
  });

  if (query.isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-40 rounded-2xl" />
      </AppShell>
    );
  }

  if (!query.data) {
    return (
      <AppShell>
        <h1 className="font-display text-2xl">找不到店家</h1>
        <p className="mt-2 text-sm text-muted-foreground">编码 {code} 尚未录入。</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary">
          回首页
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <StorePageBody merchant={query.data.merchant} deals={query.data.deals} />
    </AppShell>
  );
}
