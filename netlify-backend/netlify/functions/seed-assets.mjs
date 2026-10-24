import { PRODUCT_FILES, required } from "./_lib/config.mjs";
import { assets } from "./_lib/storage.mjs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

function authorized(request) {
  const header = request.headers.get("authorization") || "";
  return header === `Bearer ${required("ADMIN_SETUP_TOKEN")}`;
}

export default async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  try {
    if (!authorized(request)) return json({ error: "unauthorized" }, 401);
    const form = await request.formData();
    const store = assets();
    const uploaded = [];
    for (const file of PRODUCT_FILES) {
      const value = form.get(file.key);
      if (!(value instanceof File)) return json({ error: `missing_${file.key}` }, 400);
      if (value.type !== "application/pdf") return json({ error: `not_pdf_${file.key}` }, 400);
      await store.set(file.key, value, { metadata: { contentType: "application/pdf", filename: file.filename } });
      uploaded.push({ key: file.key, bytes: value.size });
    }
    return json({ ok: true, uploaded });
  } catch (error) {
    console.error("asset seed error", error.message);
    return json({ error: "asset_seed_failed" }, 500);
  }
};

export const config = { path: "/api/admin/seed" };
