import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageTitle } from "@/components/app-shell";
import { QrCode } from "@/components/qr-block";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelOrder,
  createOrder,
  getMerchant,
  getPendingOrder,
  markOrderPaid,
  type Order,
} from "@/lib/api";
import { cartTotal, clearMerchantCart, useCart } from "@/lib/cart";
import { formatRM } from "@/lib/format";
import { useMember } from "@/lib/member-context";
import { TNG_DOWNLOAD, tngAppUrl, tngDigits, tngPayText } from "@/lib/tng";

export const Route = createFileRoute("/pay/$id")({ component: PayPage });

function paidKey(merchantId: number) {
  return `myapp-tng-paid-${merchantId}`;
}

function readPaid(merchantId: number): { code: string; amount: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(paidKey(merchantId));
    return raw ? (JSON.parse(raw) as { code: string; amount: number }) : null;
  } catch {
    return null;
  }
}

function writePaid(merchantId: number, value: { code: string; amount: number } | null) {
  if (value) window.localStorage.setItem(paidKey(merchantId), JSON.stringify(value));
  else window.localStorage.removeItem(paidKey(merchantId));
}

function PayPage() {
  const { id } = Route.useParams();
  const merchantId = Number(id);
  const queryClient = useQueryClient();
  const { member, ready } = useMember();
  const cart = useCart().filter((i) => i.merchantId === merchantId);
  const total = cartTotal(cart);
  const [customAmount, setCustomAmount] = useState("");
  const [justPaid, setJustPaid] = useState<{ code: string; amount: number } | null>(() =>
    Number.isFinite(merchantId) ? readPaid(merchantId) : null,
  );
  const [created, setCreated] = useState<Order | null>(null);
  const pendingLive = useRef<Order | null>(null);

  const merchantQ = useQuery({
    queryKey: ["merchant", merchantId],
    queryFn: () => getMerchant({ data: { id: merchantId } }),
    enabled: Number.isFinite(merchantId),
  });

  const pendingQ = useQuery({
    queryKey: ["pending-order", merchantId, member?.id],
    queryFn: () =>
      getPendingOrder({ data: { member_id: member!.id, merchant_id: merchantId } }),
    enabled: Boolean(ready && member?.id && Number.isFinite(merchantId)),
  });

  const merchant = merchantQ.data?.merchant;
  const tngPhone = merchant ? tngDigits(merchant.tng_phone || merchant.phone) : "";
  const pending = justPaid ? null : (pendingQ.data ?? created);
  pendingLive.current = pending;

  function rememberPaid(value: { code: string; amount: number }) {
    writePaid(merchantId, value);
    setJustPaid(value);
    setCreated(null);
  }

  function forgetPaid() {
    writePaid(merchantId, null);
    setJustPaid(null);
  }

  async function refreshPay() {
    await queryClient.invalidateQueries({ queryKey: ["pending-order", merchantId] });
    await queryClient.invalidateQueries({ queryKey: ["orders"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  }

  const createMut = useMutation({
    mutationFn: (
      items: {
        deal_id?: number;
        title: string;
        unit: string;
        qty: number;
        unit_price: number;
        image?: string;
      }[],
    ) =>
      createOrder({
        data: {
          member_id: member!.id,
          merchant_id: merchantId,
          items,
        },
      }),
    onSuccess: async (order: Order) => {
      setCreated(order);
      forgetPaid();
      clearMerchantCart(merchantId);
      toast.success("付款单已写入服务器");
      await refreshPay();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "无法建立付款单"),
  });

  const paidMut = useMutation({
    mutationFn: () => {
      const order = pendingLive.current;
      if (!order) throw new Error("找不到这笔付款");
      return markOrderPaid({
        data: { code: order.code, member_id: member!.id },
      }).then(() => order);
    },
    onSuccess: async (order) => {
      rememberPaid({ code: order.code, amount: Number(order.amount) });
      toast.success("已记录 TNG 付款");
      await refreshPay();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "确认失败"),
  });

  const cancelMut = useMutation({
    mutationFn: () => {
      const order = pendingLive.current;
      if (!order) throw new Error("找不到这笔待付款");
      return cancelOrder({
        data: { code: order.code, member_id: member!.id },
      });
    },
    onSuccess: async () => {
      setCreated(null);
      forgetPaid();
      toast.success("已取消此单，可重新付款");
      await refreshPay();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "无法取消"),
  });

  const amount = pending ? Number(pending.amount) : justPaid?.amount ?? total;
  const qrValue = useMemo(() => {
    if (!merchant || !pending?.code) return "";
    return tngPayText({
      merchant: merchant.name,
      phone: tngPhone,
      amount: Number(pending.amount),
      code: pending.code,
    });
  }, [merchant, pending, tngPhone]);

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`已复制${label}`);
    } catch {
      toast.error("无法复制，请长按选取");
    }
  }

  function submitCart() {
    createMut.mutate(
      cart.map((item) => ({
        deal_id: item.dealId,
        title: item.title,
        unit: item.unit,
        qty: item.qty,
        unit_price: item.unitPrice,
        image: "",
      })),
    );
  }

  function submitCustom() {
    const value = Number(customAmount);
    if (!Number.isFinite(value) || value < 0.01) {
      toast.error("请输入金额");
      return;
    }
    createMut.mutate([
      {
        title: "TNG 转账",
        unit: "笔",
        qty: 1,
        unit_price: Math.round(value * 100) / 100,
        image: "",
      },
    ]);
  }

  if (!ready) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">读取会员资料…</p>
      </AppShell>
    );
  }

  if (!merchant && !merchantQ.isLoading) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">找不到这家店。</p>
        <Link to="/" className="mt-3 inline-block text-sm text-primary">
          回首页
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageTitle kicker="TNG 付款" title={merchant?.name ?? "结账"} />

      {pending ? (
        <>
          <section className="rounded-2xl bg-card p-4 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted-foreground">应付会员价</p>
            <p className="font-display mt-1 text-4xl tabular-nums">{formatRM(amount)}</p>
            <p className="mt-3 text-sm">
              TNG 号码 <span className="font-mono tracking-wide">{tngPhone || merchant?.phone}</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">单号 {pending.code} · 已保存，下次打开还在</p>
          </section>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => copy(tngPhone || merchant?.phone || "", "号码")}
            >
              <Copy className="size-4" />
              复制号码
            </Button>
            <Button type="button" variant="secondary" onClick={() => copy(amount.toFixed(2), "金额")}>
              <Copy className="size-4" />
              复制金额
            </Button>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-2 w-full"
            onClick={() => copy(qrValue, "付款资料")}
          >
            复制全部资料
          </Button>

          <ol className="mt-5 space-y-2 text-sm text-muted-foreground">
            <li>1. 打开 Touch ’n Go eWallet</li>
            <li>2. 选「转账」，贴上店家 TNG 号码</li>
            <li>3. 贴上金额，确认转给 {merchant?.name}</li>
            <li>4. 付完回来点「我已付款」</li>
          </ol>

          <Button asChild className="mt-5 w-full">
            <a href={tngAppUrl()}>打开 TNG eWallet</a>
          </Button>
          <a
            href={TNG_DOWNLOAD}
            className="mt-2 block text-center text-xs text-muted-foreground"
            target="_blank"
            rel="noreferrer"
          >
            没有安装？下载 Touch ’n Go
          </a>

          {qrValue ? (
            <div className="mx-auto mt-6 w-44">
              <QrCode value={qrValue} title="TNG 付款资料" />
            </div>
          ) : null}

          <Button
            type="button"
            className="mt-6 w-full"
            disabled={paidMut.isPending}
            onClick={() => paidMut.mutate()}
          >
            {paidMut.isPending ? "记录中…" : "我已付款"}
          </Button>
          <Button
            type="button"
            className="mt-4 w-full"
            variant="ghost"
            disabled={cancelMut.isPending}
            onClick={() => cancelMut.mutate()}
          >
            取消此单，重新付款
          </Button>
        </>
      ) : justPaid ? (
        <section className="rounded-2xl bg-card p-5 text-center shadow-[var(--shadow-border)]">
          <Check className="mx-auto size-8 text-primary" />
          <p className="mt-3 font-medium">已记录付款</p>
          <p className="mt-1 text-sm text-muted-foreground">
            单号 {justPaid.code} · {formatRM(justPaid.amount)}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">请向店家出示会员卡或此单号。</p>
          <Button asChild className="mt-5 w-full" variant="secondary">
            <Link to="/me">查看我的付款记录</Link>
          </Button>
          <Button type="button" className="mt-2 w-full" variant="ghost" onClick={forgetPaid}>
            再付一笔
          </Button>
        </section>
      ) : (
        <>
          {cart.length ? (
            <>
              <ul className="space-y-2">
                {cart.map((item) => (
                  <li
                    key={item.dealId}
                    className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-3 text-sm shadow-[var(--shadow-border)]"
                  >
                    <span className="min-w-0 truncate">
                      {item.title} × {item.qty}
                    </span>
                    <span className="shrink-0 tabular-nums text-primary">
                      {formatRM(item.unitPrice * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-end justify-between">
                <p className="text-sm text-muted-foreground">会员价合计</p>
                <p className="font-display text-2xl tabular-nums">{formatRM(total)}</p>
              </div>
              <Button
                className="mt-5 w-full"
                disabled={createMut.isPending || !member}
                onClick={submitCart}
              >
                {createMut.isPending ? "生成付款单…" : "用 TNG 付款"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                没有购物车也可以直接转账给店家。复制号码后在 TNG 里付款。
              </p>
              <p className="mt-4 text-sm">
                TNG 号码{" "}
                <span className="font-mono tracking-wide">{tngPhone || merchant?.phone}</span>
              </p>
              <div className="mt-4 space-y-2">
                <Label htmlFor="custom-amount">转账金额（RM）</Label>
                <Input
                  id="custom-amount"
                  inputMode="decimal"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="例如 15.00"
                />
              </div>
              <Button
                className="mt-5 w-full"
                disabled={createMut.isPending || !member}
                onClick={submitCustom}
              >
                {createMut.isPending ? "生成付款单…" : "用 TNG 付款给店家"}
              </Button>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}
