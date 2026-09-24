import { QrCode } from "@/components/qr-block";
import { Button } from "@/components/ui/button";
import { memberQrValue, type Member } from "@/lib/member";

export function WelcomeOverlay({
  member,
  onContinue,
}: {
  member: Member;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-6">
      <div className="stagger-in w-full max-w-sm text-center">
        <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground uppercase">
          MyApp
        </p>
        <h1 className="font-display mt-3 text-4xl font-medium tracking-tight">你已成为会员</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          打开即可享用餐饮、服务、店家折扣，以及电子产品和生活用品批发价。
        </p>
        <div className="mx-auto mt-8 w-full rounded-2xl bg-primary p-5 text-primary-foreground">
          <div className="mx-auto aspect-square w-40 rounded-lg bg-primary-foreground p-2.5">
            <QrCode value={memberQrValue(member.id)} invert title="会员二维码" />
          </div>
          <p className="mt-4 font-mono text-sm tracking-[0.2em] tabular-nums">{member.id}</p>
        </div>
        <Button className="mt-8 h-12 w-full" onClick={onContinue}>
          开始使用
        </Button>
      </div>
    </div>
  );
}
