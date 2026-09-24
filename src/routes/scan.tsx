import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, PageTitle } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseScanPayload } from "@/lib/scan";

export const Route = createFileRoute("/scan")({ component: ScanPage });

type VerifyState =
  | { kind: "idle" }
  | { kind: "member"; id: string }
  | { kind: "unknown"; raw: string };

export function ScanPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [verify, setVerify] = useState<VerifyState>({ kind: "idle" });
  const handled = useRef(false);

  function applyPayload(raw: string) {
    if (handled.current) return;
    const result = parseScanPayload(raw);
    if (result.type === "store") {
      handled.current = true;
      void navigate({ to: "/s/$code", params: { code: result.code } });
      return;
    }
    if (result.type === "member") {
      handled.current = true;
      setVerify({ kind: "member", id: result.id });
      return;
    }
    setVerify({ kind: "unknown", raw });
  }

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: number | null = null;
    let cancelled = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("此浏览器不支持摄像头，请手动输入编码。");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        const video = videoRef.current;
        if (!video || cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        const tick = async () => {
          if (cancelled || handled.current) return;
          const v = videoRef.current;
          if (v && v.readyState >= 2) {
            const Detector = (
              window as Window & {
                BarcodeDetector?: new (opts: { formats: string[] }) => {
                  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
                };
              }
            ).BarcodeDetector;
            if (Detector) {
              try {
                const detector = new Detector({ formats: ["qr_code"] });
                const codes = await detector.detect(v);
                const value = codes[0]?.rawValue;
                if (value) applyPayload(value);
              } catch {
                /* keep looping */
              }
            } else if (ctx) {
              canvas.width = v.videoWidth;
              canvas.height = v.videoHeight;
              if (canvas.width && canvas.height) {
                ctx.drawImage(v, 0, 0);
                const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const jsQR = (await import("jsqr")).default;
                const code = jsQR(image.data, image.width, image.height);
                if (code?.data) applyPayload(code.data);
              }
            }
          }
          timer = window.setTimeout(() => void tick(), 280);
        };
        void tick();
      } catch {
        setCameraError("无法开启摄像头。请允许权限，或改为输入编码。");
      }
    }

    void start();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <PageTitle kicker="核销 / 进店" title="扫描二维码" />
      <p className="mb-4 text-sm text-muted-foreground">
        顾客扫店家码看折扣；店家扫会员码确认会员。
      </p>

      <div className="relative overflow-hidden rounded-2xl bg-muted">
        <video
          ref={videoRef}
          className="h-56 w-full object-cover"
          playsInline
          muted
        />
        <div className="pointer-events-none absolute inset-6 rounded-lg border border-foreground/25" />
      </div>
      {cameraError ? (
        <p className="mt-3 text-sm text-muted-foreground">{cameraError}</p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">将二维码置于方框内</p>
      )}

      {verify.kind === "member" ? (
        <div className="mt-5 rounded-2xl bg-primary p-5 text-primary-foreground">
          <p className="text-xs tracking-[0.18em] uppercase opacity-70">核销成功</p>
          <p className="font-display mt-1 text-2xl">有效会员</p>
          <p className="mt-2 font-mono tracking-[0.16em] tabular-nums">{verify.id}</p>
          <Button
            className="mt-4 w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            onClick={() => {
              handled.current = false;
              setVerify({ kind: "idle" });
            }}
          >
            继续扫描
          </Button>
        </div>
      ) : null}

      {verify.kind === "unknown" ? (
        <p className="mt-4 text-sm text-muted-foreground">无法识别：{verify.raw}</p>
      ) : null}

      <form
        className="mt-6 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          handled.current = false;
          applyPayload(manual);
        }}
      >
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder="或输入会员号 / 店家编码"
        />
        <Button type="submit" variant="secondary" className="w-full">
          确认
        </Button>
      </form>
    </AppShell>
  );
}
