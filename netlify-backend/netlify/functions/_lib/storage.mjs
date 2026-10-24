import { getStore } from "@netlify/blobs";

export const assets = () => getStore("ebook-assets");
export const orders = () => getStore("ebook-orders");

export async function getJson(store, key) {
  return store.get(key, { type: "json" });
}

export async function putJson(store, key, value, options = {}) {
  return store.setJSON(key, value, options);
}

export function eventKey(eventId) { return `event/${eventId}`; }
export function orderKey(paymentId) { return `order/${paymentId}`; }
export function grantKey(token) { return `grant/${token}`; }

export async function createGrant({ paymentId, email, assetKey, filename, ttl, maxDownloads }) {
  const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const now = Date.now();
  const record = {
    token,
    paymentId,
    email,
    assetKey,
    filename,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl).toISOString(),
    downloads: 0,
    maxDownloads,
  };
  const result = await putJson(orders(), grantKey(token), record, { onlyIfNew: true });
  if (!result.modified) throw new Error("Could not create unique download grant");
  return record;
}
