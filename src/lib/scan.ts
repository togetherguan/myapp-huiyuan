import { isMemberCode } from "@/lib/member";

export type ScanResult =
  | { type: "member"; id: string }
  | { type: "store"; code: string }
  | { type: "unknown"; raw: string };

export function parseScanPayload(raw: string): ScanResult {
  const text = raw.trim();
  if (!text) return { type: "unknown", raw: text };

  const memberMatch = text.toUpperCase().match(/(?:MYAPP:M:)?(MY-[A-Z0-9]{8})/);
  if (memberMatch?.[1] && isMemberCode(memberMatch[1])) {
    return { type: "member", id: memberMatch[1] };
  }

  try {
    const url = new URL(text);
    const parts = url.pathname.split("/").filter(Boolean);
    const sIndex = parts.indexOf("s");
    if (sIndex >= 0 && parts[sIndex + 1]) {
      return { type: "store", code: parts[sIndex + 1].toUpperCase() };
    }
    const storeIndex = parts.indexOf("store");
    if (storeIndex >= 0 && parts[storeIndex + 1]) {
      return { type: "store", code: parts[storeIndex + 1] };
    }
  } catch {
    /* not a url */
  }

  const pathMatch = text.match(/\/s\/([A-Za-z0-9-]+)/);
  if (pathMatch?.[1]) return { type: "store", code: pathMatch[1].toUpperCase() };

  if (/^ST[A-Z0-9]{4,10}$/i.test(text)) {
    return { type: "store", code: text.toUpperCase() };
  }

  return { type: "unknown", raw: text };
}

export function storeQrValue(code: string, origin?: string): string {
  const base =
    origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/s/${code}`;
}
