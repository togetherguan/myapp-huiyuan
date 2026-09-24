import type { ReactNode } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { WelcomeOverlay } from "@/components/welcome-overlay";
import { useMember } from "@/lib/member-context";
import { cn } from "@/lib/utils";

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { member, ready, showWelcome, dismissWelcome } = useMember();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className={cn("mx-auto min-h-dvh", wide ? "max-w-2xl" : "max-w-md")}>
        <main className="px-4 pt-5 pb-24">{children}</main>
        <BottomNav />
      </div>
      {ready && showWelcome && member ? (
        <WelcomeOverlay member={member} onContinue={dismissWelcome} />
      ) : null}
    </div>
  );
}

export function PageTitle({
  kicker,
  title,
  action,
}: {
  kicker?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        {kicker ? (
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-display mt-1 text-3xl font-medium tracking-tight">{title}</h1>
      </div>
      {action}
    </div>
  );
}
