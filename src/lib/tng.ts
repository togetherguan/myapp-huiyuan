export function tngDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function tngPayText(opts: {
  merchant: string;
  phone: string;
  amount: number;
  code: string;
}): string {
  return [
    "MyApp TNG 付款",
    opts.merchant,
    `号码 ${opts.phone}`,
    `金额 RM ${opts.amount.toFixed(2)}`,
    `单号 ${opts.code}`,
  ].join("\n");
}

export function tngAppUrl(): string {
  if (typeof navigator === "undefined") {
    return "https://www.touchngo.com.my/consumer/payments/ewallet-transfer";
  }
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return "tngdwallet://";
  }
  if (/Android/i.test(navigator.userAgent)) {
    return "intent://transfer/#Intent;scheme=tngdwallet;package=my.com.tngdigital.ewallet;S.browser_fallback_url=https://play.google.com/store/apps/details?id=my.com.tngdigital.ewallet;end";
  }
  return "https://www.touchngo.com.my/consumer/payments/ewallet-transfer";
}

export const TNG_DOWNLOAD = "https://www.touchngo.com.my/";
