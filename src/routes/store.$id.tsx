import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { StorePageBody } from "@/components/store-body";
import { Skeleton } from "@/components/ui/skeleton";
import { getMerchant } from "@/lib/api";

export const Route = createFileRoute("/store/$id")({ component: StorePage });

function StorePage() {
  const { id } = Route.useParams();
  const query = useQuery({
    queryKey: ["merchant", id],
    queryFn: () => getMerchant({ data: { id: Number(id) } }),
  });

  if (query.isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="mt-4 h-8 w-48" />
        <Skeleton className="mt-3 h-24 rounded-xl" />
      </AppShell>
    );
  }

  const data = query.data;
  if (!data) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">找不到这家店。</p>
        <Link to="/deals" className="mt-3 inline-block text-sm text-primary">
          返回优惠
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <StorePageBody merchant={data.merchant} deals={data.deals} />
    </AppShell>
  );
}
