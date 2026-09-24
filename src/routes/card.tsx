import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageTitle } from "@/components/app-shell";
import { MemberCard } from "@/components/member-card";
import { QrPanel } from "@/components/qr-block";
import { Skeleton } from "@/components/ui/skeleton";
import { memberQrValue } from "@/lib/member";
import { useMember } from "@/lib/member-context";

export const Route = createFileRoute("/card")({ component: CardPage });

function CardPage() {
  const { member, ready } = useMember();

  return (
    <AppShell>
      <PageTitle kicker="出示给店家" title="会员卡" />
      {!ready || !member ? (
        <Skeleton className="h-80 rounded-2xl" />
      ) : (
        <>
          <MemberCard member={member} variant="full" />
          <section className="mt-6 rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <h2 className="text-sm font-medium">下载会员码</h2>
            <p className="mt-1 mb-4 text-xs text-muted-foreground">
              可存到相册，离线也能出示。
            </p>
            <QrPanel
              value={memberQrValue(member.id)}
              caption={member.id}
              filename={`myapp-member-${member.id}`}
            />
          </section>
        </>
      )}
    </AppShell>
  );
}
