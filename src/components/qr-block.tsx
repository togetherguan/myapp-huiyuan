import { encode, renderSVG } from "uqr";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function QrCode({
  value,
  className,
  title,
  invert = false,
}: {
  value: string;
  className?: string;
  title?: string;
  invert?: boolean;
}) {
  const { size, data } = encode(value, { border: 2, ecc: "M" });
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("size-full", invert ? "fill-background" : "fill-foreground", className)}
      shapeRendering="crispEdges"
      role="img"
      aria-label={title ?? "二维码"}
    >
      {title ? <title>{title}</title> : null}
      {data.map((row, y) =>
        row.map((on, x) =>
          on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null,
        ),
      )}
    </svg>
  );
}

export function downloadQrSvg(value: string, filename: string) {
  const svg = renderSVG(value, {
    pixelSize: 10,
    whiteColor: "#f3f1ea",
    blackColor: "#0c0d0b",
    border: 2,
    ecc: "M",
  });
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".svg") ? filename : `${filename}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadQrPng(value: string, filename: string) {
  const svg = renderSVG(value, {
    pixelSize: 12,
    whiteColor: "#f3f1ea",
    blackColor: "#0c0d0b",
    border: 2,
    ecc: "M",
  });
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("无法生成图片"));
      img.src = svgUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    await new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve();
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename.endsWith(".png") ? filename : `${filename}.png`;
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function QrPanel({
  value,
  caption,
  filename,
  invert = false,
}: {
  value: string;
  caption: string;
  filename: string;
  invert?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "aspect-square w-full max-w-56 rounded-lg p-3",
          invert ? "bg-foreground text-background" : "bg-foreground/95 text-background",
        )}
      >
        <QrCode value={value} invert title={caption} />
      </div>
      <p className="font-mono text-xs tracking-widest text-muted-foreground">{caption}</p>
      <div className="flex w-full gap-2">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={() => downloadQrPng(value, filename)}
        >
          <Download />
          下载 PNG
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => downloadQrSvg(value, filename)}
        >
          下载 SVG
        </Button>
      </div>
    </div>
  );
}
