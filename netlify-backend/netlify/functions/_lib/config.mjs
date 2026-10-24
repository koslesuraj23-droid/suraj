export const PRODUCT_PRICE_PAISE = 19900;
export const PRODUCT_CURRENCY = "INR";
export const PRODUCT_FILES = [
  { key: "excel-online-earning.pdf", filename: "excel-online-earning.pdf" },
  { key: "excel-only-ebook.pdf", filename: "excel-only-ebook.pdf" },
];

export function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function ttlMs() {
  const hours = Number(process.env.DOWNLOAD_TTL_HOURS || 48);
  return (Number.isFinite(hours) && hours > 0 ? hours : 48) * 60 * 60 * 1000;
}

export function maxDownloads() {
  const value = Number(process.env.MAX_DOWNLOADS || 3);
  return Number.isInteger(value) && value > 0 ? value : 3;
}

export function publicUrl() {
  return process.env.URL || "";
}
