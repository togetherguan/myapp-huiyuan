import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listMyOrders } from "@/lib/api";
import { formatJoined, formatRM, formatWhen } from "@/lib/format";
import { useMember } from "@/lib/member-context";

export const Route = createFileRoute("/me")({ component: MePage });

function MePage() {
  const { member, ready, updateName } = useMember();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const orders = useQuery({
    queryKey: ["orders", member?.id],
    queryFn: () => listMyOrders({ data: { member_id: member!.id } }),
    enabled: Boolean(ready && member?.id),
  });

  return (
    <AppShell>
      <PageTitle kicker="MyApp" title="我的会员" />

      <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
        <p className="text-xs text-muted-foreground">会员编号</p>
        <p className="mt-1 font-mono text-lg tracking-[0.16em] tabular-nums">
          {ready && member ? member.id : "—"}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {ready && member ? formatJoined(member.joinedAt) : ""}
        </p>
        <p className="mt-3 text-sm text-primary">打开即会员 · 无需注册</p>
      </section>

      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          updateName(name);
          setSaved(true);
        }}
      >
        <Label htmlFor="display-name">显示名称（选填）</Label>
        <Input
          id="display-name"
          value={name}
          placeholder={member?.displayName || "会员"}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
        />
        <Button type="submit" variant="secondary" className="w-full">
          {saved ? "已保存" : "保存名称"}
        </Button>
      </form>

      <section className="mt-8">
        <h2 className="text-sm font-medium">TNG 付款记录</h2>
        <div className="mt-3 space-y-2">
          {orders.data?.length
            ? orders.data.map((o) => (
                <Link
                  key={o.id}
                  to={o.status === "pending" ? "/pay/$id" : "/store/$id"}
                  params={{ id: String(o.merchant_id) }}
                  className="block rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-border)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{o.merchant_name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {o.code} · {formatWhen(o.created_at)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {o.items.map((i) => i.title).join("、")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm tabular-nums text-primary">{formatRM(o.amount)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {o.status === "confirmed"
                          ? "店家已收"
                          : o.status === "paid"
                            ? "已付款"
                            : "待付款"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            : (
              <p className="text-sm text-muted-foreground">还没有付款记录。在店家页加入产品后选 TNG 付款。</p>
            )}
        </div>
      </section>

      <Link
        to="/admin"
        className="mt-6 flex min-h-14 items-center justify-between rounded-2xl bg-card px-4 shadow-[var(--shadow-border)]"
      >
        <div>
          <p className="text-sm font-medium">商家后台</p>
          <p className="text-xs text-muted-foreground">密码进入。添加的店家、产品会保存，并可查看 TNG 收款</p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>

      <section className="mt-8">
        <h2 className="text-sm font-medium">如何使用</h2>
        <ol className="mt-3 space-y-3 text-sm text-muted-foreground">
          <li>1. 打开 App 即成为会员，获得专属二维码。</li>
          <li>2. 在店家页加入产品，或直接点「用 TNG 付款给店家」转账。</li>
          <li>3. 也可以出示会员卡，到店按会员价结账。</li>
          <li>4. 店家在后台添加的资料写入服务器，下次登录还在。</li>
        </ol>
      </section>
    </AppShell>
  );
}
