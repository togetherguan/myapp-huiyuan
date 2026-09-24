import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImagePlus, Plus, Wallet } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppShell, PageTitle } from "@/components/app-shell";
import { QrPanel } from "@/components/qr-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  confirmOrder,
  createDeal,
  createMerchant,
  deleteDeal,
  deleteMerchant,
  getMerchant,
  getStats,
  listAdminOrders,
  listMerchants,
  updateMerchant,
  verifyAdmin,
  type DealKind,
  type Merchant,
} from "@/lib/api";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { compressImage } from "@/lib/image";
import { formatRM, formatWhen } from "@/lib/format";
import { storeQrValue } from "@/lib/scan";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminPage });

const ADMIN_SESSION = "myapp-admin-pw";

const emptyForm = {
  name: "",
  phone: "",
  category: "food" as CategoryId,
  address: "",
  city: "吉隆坡",
  discount_label: "会员 8 折",
  discount_pct: "20",
  description: "",
  tng_phone: "",
};

function AdminPage() {
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [gateError, setGateError] = useState("");
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [addOpen, setAddOpen] = useState(false);
  const [studio, setStudio] = useState<Merchant | null>(null);
  const [tab, setTab] = useState<"stores" | "orders">("stores");

  useEffect(() => {
    const saved = localStorage.getItem(ADMIN_SESSION);
    if (!saved) {
      setChecking(false);
      return;
    }
    void verifyAdmin({ data: { password: saved } })
      .then(() => {
        setPassword(saved);
        setUnlocked(true);
      })
      .catch(() => {
        localStorage.removeItem(ADMIN_SESSION);
      })
      .finally(() => setChecking(false));
  }, []);

  const stats = useQuery({
    queryKey: ["stats"],
    queryFn: () => getStats(),
    enabled: unlocked,
  });
  const merchants = useQuery({
    queryKey: ["merchants"],
    queryFn: () => listMerchants({ data: {} }),
    enabled: unlocked,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["merchants"] });
    await queryClient.invalidateQueries({ queryKey: ["deals"] });
    await queryClient.invalidateQueries({ queryKey: ["stats"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    await queryClient.invalidateQueries({ queryKey: ["merchant"] });
  };

  const unlockMut = useMutation({
    mutationFn: (value: string) => verifyAdmin({ data: { password: value } }),
    onSuccess: (_ok, value) => {
      localStorage.setItem(ADMIN_SESSION, value);
      setPassword(value);
      setUnlocked(true);
      setGateError("");
    },
    onError: () => setGateError("密码错误"),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createMerchant({
        data: {
          password,
          name: form.name,
          phone: form.phone,
          category: form.category,
          address: form.address || "待补充地址",
          city: form.city || "吉隆坡",
          discount_label: form.discount_label || "会员优惠",
          discount_pct: Number(form.discount_pct) || 10,
          description: form.description,
          tng_phone: form.tng_phone || form.phone,
          wholesale: form.category === "electronics" || form.category === "daily",
        },
      }),
    onSuccess: async (merchant) => {
      setForm(emptyForm);
      setAddOpen(false);
      setStudio(merchant);
      toast.success("已写入服务器。下次登录后台，这家店还在。");
      await invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "保存失败"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMerchant({ data: { id, password } }),
    onSuccess: async () => {
      toast.success("已删除商家");
      await invalidate();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "删除失败"),
  });

  if (checking) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">正在验证后台权限…</p>
      </AppShell>
    );
  }

  if (!unlocked) {
    return (
      <AppShell>
        <PageTitle kicker="商家后台" title="请输入密码" />
        <p className="mb-5 text-sm text-muted-foreground">仅店主可进入，录入商家、产品与服务。</p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            unlockMut.mutate(password);
          }}
        >
          <Field label="后台密码" htmlFor="admin-password">
            <Input
              id="admin-password"
              type="password"
              inputMode="numeric"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setGateError("");
              }}
              placeholder="输入密码"
            />
          </Field>
          {gateError ? <p className="text-sm text-destructive">{gateError}</p> : null}
          <Button type="submit" className="w-full" disabled={unlockMut.isPending || !password}>
            {unlockMut.isPending ? "验证中…" : "进入后台"}
          </Button>
        </form>
      </AppShell>
    );
  }

  return (
    <AppShell wide>
      <PageTitle
        kicker="商家后台"
        title="店家管理"
        action={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem(ADMIN_SESSION);
              setUnlocked(false);
              setPassword("");
            }}
          >
            退出
          </Button>
        }
      />

      <p className="mb-4 rounded-xl bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        店家、产品、服务与 TNG 收款都写入服务器。退出后再登录，资料还在。
      </p>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted-foreground">合作商家</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{stats.data?.merchants ?? "—"}</p>
        </div>
        <div className="rounded-xl bg-card px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="text-xs text-muted-foreground">产品 / 服务</p>
          <p className="mt-1 font-display text-2xl tabular-nums">{stats.data?.deals ?? "—"}</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(
          [
            ["stores", "商家"],
            ["orders", "TNG 收款"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-10 rounded-lg text-sm font-medium",
              tab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "orders" ? (
        <AdminOrders password={password} />
      ) : (
        <>
      <Button type="button" className="mb-5 w-full" onClick={() => setAddOpen(true)}>
        <Plus />
        添加商家
      </Button>

      <h2 className="mb-3 text-sm font-medium">商家列表</h2>
      <div className="space-y-2">
        {merchants.data?.map((m) => (
          <article key={m.id} className="rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{m.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {m.phone} · {m.code}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  TNG {m.tng_phone || m.phone}
                </p>
              </div>
              <Badge variant="muted">
                {CATEGORIES.find((c) => c.id === m.category)?.label ?? m.category}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-primary">{m.discount_label}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => setStudio(m)}>
                产品与服务
              </Button>
              <Button type="button" size="sm" variant="secondary" asChild>
                <Link to="/store/$id" params={{ id: String(m.id) }}>
                  查看店铺
                </Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (window.confirm(`删除「${m.name}」？`)) deleteMut.mutate(m.id);
                }}
              >
                删除
              </Button>
            </div>
          </article>
        ))}
        {!merchants.data?.length && !merchants.isLoading ? (
          <p className="text-sm text-muted-foreground">还没有商家。点上方「添加商家」开始。</p>
        ) : null}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>添加商家</DialogTitle>
            <DialogDescription>保存后会自动生成店家二维码，并可继续添加产品与服务。</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              createMut.mutate();
            }}
          >
            <Field label="店名" htmlFor="name">
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="旺沙茶室"
              />
            </Field>
            <Field label="电话" htmlFor="phone">
              <Input
                id="phone"
                required
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="012-334 8891"
              />
            </Field>
            <Field label="TNG 收款号码" htmlFor="tng_phone">
              <Input
                id="tng_phone"
                inputMode="tel"
                value={form.tng_phone}
                onChange={(e) => setForm({ ...form, tng_phone: e.target.value })}
                placeholder="同店家电话，或填 TNG 注册号码"
              />
            </Field>
            <Field label="分类" htmlFor="category">
              <select
                id="category"
                className="flex h-11 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as CategoryId })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="地址" htmlFor="address">
              <Input
                id="address"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="旺沙玛朱 1 路"
              />
            </Field>
            <Field label="城市" htmlFor="city">
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="折扣说明" htmlFor="discount_label">
                <Input
                  id="discount_label"
                  required
                  value={form.discount_label}
                  onChange={(e) => setForm({ ...form, discount_label: e.target.value })}
                />
              </Field>
              <Field label="折扣 %" htmlFor="discount_pct">
                <Input
                  id="discount_pct"
                  inputMode="numeric"
                  value={form.discount_pct}
                  onChange={(e) => setForm({ ...form, discount_pct: e.target.value })}
                />
              </Field>
            </div>
            <Field label="简介" htmlFor="description">
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="出示会员码即按会员价结账"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={createMut.isPending}>
              {createMut.isPending ? "保存中…" : "保存商家并生成二维码"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <MerchantStudio
        merchant={studio}
        password={password}
        onClose={() => setStudio(null)}
        onChanged={invalidate}
      />
        </>
      )}
    </AppShell>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function MerchantStudio({
  merchant,
  password,
  onClose,
  onChanged,
}: {
  merchant: Merchant | null;
  password: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
}) {
  const defaultKind: DealKind = merchant?.category === "service" ? "service" : "product";
  const [kind, setKind] = useState<DealKind>(defaultKind);
  const [title, setTitle] = useState("");
  const [original, setOriginal] = useState("");
  const [member, setMember] = useState("");
  const [unit, setUnit] = useState(defaultKind === "service" ? "次" : "件");
  const [image, setImage] = useState("");
  const [compressing, setCompressing] = useState(false);
  const [tngPhone, setTngPhone] = useState(merchant?.tng_phone || merchant?.phone || "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next: DealKind = merchant?.category === "service" ? "service" : "product";
    setKind(next);
    setUnit(next === "service" ? "次" : "件");
    setTitle("");
    setOriginal("");
    setMember("");
    setImage("");
    setTngPhone(merchant?.tng_phone || merchant?.phone || "");
  }, [merchant?.id, merchant?.category, merchant?.tng_phone, merchant?.phone]);

  const detail = useQuery({
    queryKey: ["merchant", merchant?.id],
    queryFn: () => getMerchant({ data: { id: merchant!.id } }),
    enabled: Boolean(merchant),
  });

  const saveTng = useMutation({
    mutationFn: () =>
      updateMerchant({
        data: {
          password,
          id: merchant!.id,
          name: merchant!.name,
          phone: merchant!.phone,
          category: merchant!.category,
          address: merchant!.address,
          city: merchant!.city,
          discount_label: merchant!.discount_label,
          discount_pct: merchant!.discount_pct,
          description: merchant!.description,
          wholesale: merchant!.wholesale,
          tng_phone: tngPhone || merchant!.phone,
        },
      }),
    onSuccess: async () => {
      toast.success("TNG 收款号码已保存");
      await onChanged();
      await detail.refetch();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "保存失败"),
  });

  const addDeal = useMutation({
    mutationFn: () =>
      createDeal({
        data: {
          password,
          merchant_id: merchant!.id,
          title,
          original_price: Number(original),
          member_price: Number(member),
          unit: unit || (kind === "service" ? "次" : "件"),
          kind,
          image,
        },
      }),
    onSuccess: async () => {
      setTitle("");
      setOriginal("");
      setMember("");
      setImage("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success(kind === "service" ? "服务已写入服务器" : "产品已写入服务器");
      await onChanged();
      await detail.refetch();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "添加失败"),
  });

  const removeDeal = useMutation({
    mutationFn: (id: number) => deleteDeal({ data: { id, password } }),
    onSuccess: async () => {
      await onChanged();
      await detail.refetch();
    },
  });

  const products = detail.data?.deals.filter((d) => d.kind !== "service") ?? [];
  const services = detail.data?.deals.filter((d) => d.kind === "service") ?? [];
  const currentList = kind === "service" ? services : products;

  return (
    <Dialog open={Boolean(merchant)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{merchant?.name}</DialogTitle>
          <DialogDescription>
            {merchant?.phone} · 先看二维码，再添加产品或服务
          </DialogDescription>
        </DialogHeader>
        {merchant ? (
          <QrPanel
            value={storeQrValue(merchant.code)}
            caption={merchant.code}
            filename={`myapp-${merchant.code}`}
          />
        ) : null}

        <div className="mt-4 space-y-2">
          <Field label="TNG 收款号码" htmlFor="studio-tng">
            <Input
              id="studio-tng"
              inputMode="tel"
              value={tngPhone}
              onChange={(e) => setTngPhone(e.target.value)}
              placeholder="会员将转账到这个号码"
            />
          </Field>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={!merchant || saveTng.isPending}
            onClick={() => saveTng.mutate()}
          >
            {saveTng.isPending ? "保存中…" : "保存收款号码"}
          </Button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(
            [
              ["product", "添加产品"],
              ["service", "添加服务"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setKind(id);
                setUnit(id === "service" ? "次" : "件");
                setTitle("");
                setOriginal("");
                setMember("");
                setImage("");
                if (fileRef.current) fileRef.current.value = "";
              }}
              className={cn(
                "h-10 rounded-lg text-sm font-medium",
                kind === id ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <form
          className="mt-4 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            addDeal.mutate();
          }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === "service" ? "服务名称，如剪发吹整" : "产品名称，如咖椰吐司"}
            required
          />
          <div className="space-y-1.5">
            <Label htmlFor="deal-image">{kind === "service" ? "服务图片" : "产品图片"}</Label>
            <label
              htmlFor="deal-image"
              className="relative flex min-h-28 cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-dashed border-border bg-muted px-3 py-3"
            >
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="size-20 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex size-20 shrink-0 items-center justify-center rounded-lg bg-card text-muted-foreground">
                  <ImagePlus className="size-6" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {compressing ? "压缩中…" : image ? "已选图片，点此更换" : "上传图片"}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  从相册选择或拍照，自动压缩后保存
                </span>
              </span>
              <input
                ref={fileRef}
                id="deal-image"
                type="file"
                accept="image/*"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setCompressing(true);
                  void compressImage(file)
                    .then((dataUrl) => setImage(dataUrl))
                    .catch((err) =>
                      toast.error(err instanceof Error ? err.message : "图片无法读取"),
                    )
                    .finally(() => setCompressing(false));
                }}
              />
            </label>
            {image ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setImage("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                移除图片
              </Button>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              placeholder="原价"
              inputMode="decimal"
              required
            />
            <Input
              value={member}
              onChange={(e) => setMember(e.target.value)}
              placeholder="会员价"
              inputMode="decimal"
              required
            />
            <Input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={kind === "service" ? "次" : "件"}
            />
          </div>
          <Button type="submit" className="w-full" disabled={addDeal.isPending || compressing}>
            {addDeal.isPending ? "添加中…" : kind === "service" ? "添加服务" : "添加产品"}
          </Button>
        </form>

        <h3 className="mt-6 text-sm font-medium">
          {kind === "service" ? "已上架服务" : "已上架产品"}
        </h3>
        <div className="mt-2 space-y-2">
          {currentList.length ? (
            currentList.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  {d.image ? (
                    <img src={d.image} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                  ) : null}
                  <span className="truncate">
                    {d.title} · RM {d.member_price} / {d.unit}
                  </span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDeal.mutate(d.id)}
                >
                  删除
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {kind === "service" ? "还没有服务，填写上方后添加。" : "还没有产品，填写上方后添加。"}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function orderStatusLabel(status: string) {
  if (status === "confirmed") return "店家已收";
  if (status === "paid") return "会员已付";
  return "待付款";
}

function AdminOrders({ password }: { password: string }) {
  const queryClient = useQueryClient();
  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => listAdminOrders({ data: { password } }),
    refetchInterval: 10_000,
  });
  const confirmMut = useMutation({
    mutationFn: (code: string) => confirmOrder({ data: { code, password } }),
    onSuccess: async () => {
      toast.success("已确认收到款项");
      await queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "确认失败"),
  });

  if (orders.isLoading) {
    return <p className="text-sm text-muted-foreground">读取收款记录…</p>;
  }

  if (!orders.data?.length) {
    return (
      <p className="text-sm text-muted-foreground">
        还没有 TNG 付款单。会员在店家页点「用 TNG 付款」后会出现在这里。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {orders.data.map((order) => (
        <article key={order.id} className="rounded-2xl bg-card p-3 shadow-[var(--shadow-border)]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{order.merchant_name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {order.code} · {formatWhen(order.created_at)}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Wallet className="size-3.5" />
                {order.tng_phone}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm tabular-nums text-primary">{formatRM(order.amount)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{orderStatusLabel(order.status)}</p>
            </div>
          </div>
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {order.items.map((item) => `${item.title}×${item.qty}`).join("、")}
          </p>
          {order.status !== "confirmed" ? (
            <Button
              type="button"
              size="sm"
              className="mt-3 w-full"
              disabled={confirmMut.isPending}
              onClick={() => confirmMut.mutate(order.code)}
            >
              已收到 TNG 款项
            </Button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
