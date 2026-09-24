import { Link, useRouterState } from "@tanstack/react-router";
import { CreditCard, Home, ScanLine, Tag, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/", label: "首页", icon: Home, match: (p: string) => p === "/" },
  { to: "/deals", label: "优惠", icon: Tag, match: (p: string) => p.startsWith("/deals") },
  { to: "/scan", label: "扫码", icon: ScanLine, match: (p: string) => p.startsWith("/scan") },
  { to: "/card", label: "会员卡", icon: CreditCard, match: (p: string) => p.startsWith("/card") },
  { to: "/me", label: "我的", icon: User, match: (p: string) => p.startsWith("/me") || p.startsWith("/admin") },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)]"
      aria-label="主导航"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
