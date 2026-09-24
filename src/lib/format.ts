export function formatRM(value: number | string): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : value;
  if (!Number.isFinite(n)) return "RM —";
  if (n === 0) return "免费";
  return `RM ${n.toFixed(2)}`;
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} ${hh}:${mm}`;
}

export function formatJoined(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y} 年 ${m} 月加入`;
}

export function formatPhoneTel(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export function savingsPercent(original: number | string, member: number | string): number {
  const a = typeof original === "string" ? Number.parseFloat(original) : original;
  const b = typeof member === "string" ? Number.parseFloat(member) : member;
  if (!Number.isFinite(a) || a <= 0) return 0;
  return Math.round(((a - b) / a) * 100);
}
