import { assets, grantKey, orders } from "./_lib/storage.mjs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

function tokenFromRequest(request, context) {
  const fromContext = context?.params?.splat || context?.params?.token;
  if (fromContext) return fromContext;
  const parts = new URL(request.url).pathname.split("/").filter(Boolean);
  return parts.at(-1);
}

export default async (request, context) => {
  if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  const token = tokenFromRequest(request, context);
  if (!token || token.length < 30) return json({ error: "invalid_download_token" }, 400);

  const store = orders();
  const key = grantKey(token);
  const current = await store.getWithMetadata(key, { type: "json" });
  if (!current?.data) return json({ error: "download_not_found" }, 404);
  const grant = current.data;
  if (Date.now() >= Date.parse(grant.expiresAt)) return json({ error: "download_expired" }, 410);
  if (grant.downloads >= grant.maxDownloads) return json({ error: "download_limit_reached" }, 429);

  const updated = { ...grant, downloads: grant.downloads + 1, lastDownloadedAt: new Date().toISOString() };
  const changed = await store.setJSON(key, updated, { onlyIfMatch: current.etag });
  if (!changed.modified) return json({ error: "download_conflict_retry" }, 409);

  const file = await assets().get(grant.assetKey, { type: "arrayBuffer" });
  if (!file) return json({ error: "asset_not_found" }, 404);
  return new Response(file, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${grant.filename}"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
};

export const config = { path: "/api/download/*" };
