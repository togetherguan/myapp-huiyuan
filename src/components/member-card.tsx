import { Link } from "@tanstack/react-router";
import { formatJoined } from "@/lib/format";
import { memberQrValue, type Member } from "@/lib/member";
import { QrCode } from "@/components/qr-block";
import { cn } from "@/lib/utils";

export function MemberCard({
  member,
  variant = "compact",
}: {
  member: Member;
  variant?: "compact" | "full";
}) {
  const qr = memberQrValue(member.id);

  if (variant === "full") {
    return (
      <article className="overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-[var(--shadow-border)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] uppercase opacity-70">MyApp</p>
            <h2 className="font-display mt-1 text-3xl font-medium tracking-tight">会员</h2>
          </div>
          <span className="rounded-full bg-primary-foreground/12 px-3 py-1 text-xs font-medium">
            已激活
          </span>
        </div>
        <div className="mx-auto mt-6 aspect-square w-[70%] max-w-56 rounded-lg bg-primary-foreground p-3">
          <QrCode value={qr} invert title="会员二维码" />
        </div>
        <p className="mt-5 text-center font-mono text-lg tracking-[0.22em] tabular-nums">
          {member.id}
        </p>
        <p className="mt-1 text-center text-sm opacity-70">{member.displayName}</p>
        <p className="mt-4 text-center text-xs opacity-60">{formatJoined(member.joinedAt)}</p>
        <p className="mt-6 text-center text-sm opacity-80">出示此码，店家即可核销会员价</p>
      </article>
    );
  }

  return (
    <Link
      to="/card"
      className={cn(
        "block overflow-hidden rounded-2xl bg-primary p-4 text-primary-foreground",
        "shadow-[var(--shadow-border)] transition-[transform,box-shadow] duration-150",
        "hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96]",
      )}
    >
      <div className="flex items-stretch gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium tracking-[0.18em] uppercase opacity-70">MyApp</p>
          <h2 className="font-display mt-1 text-2xl font-medium tracking-tight">会员卡</h2>
          <p className="mt-3 font-mono text-sm tracking-[0.18em] tabular-nums">{member.id}</p>
          <p className="mt-1 text-xs opacity-70">{formatJoined(member.joinedAt)}</p>
          <p className="mt-4 text-xs opacity-80">点按出示给店家</p>
        </div>
        <div className="size-24 shrink-0 rounded-md bg-primary-foreground p-2">
          <QrCode value={qr} invert title="会员二维码" />
        </div>
      </div>
    </Link>
  );
}
