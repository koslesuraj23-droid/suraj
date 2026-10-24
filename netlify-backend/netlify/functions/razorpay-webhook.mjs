import { maxDownloads, PRODUCT_FILES, ttlMs } from "./_lib/config.mjs";
import { sendDeliveryEmail } from "./_lib/email.mjs";
import { extractPaidPayment, verifyWebhookSignature } from "./_lib/razorpay.mjs";
import { createGrant, eventKey, getJson, grantKey, orderKey, orders, putJson } from "./_lib/storage.mjs";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });
}

export default async (request) => {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  try {
    if (!verifyWebhookSignature(rawBody, signature)) return json({ error: "invalid_signature" }, 401);
  } catch (error) {
    console.error("signature configuration error", error.message);
    return json({ error: "webhook_not_configured" }, 500);
  }

  const eventId = request.headers.get("x-razorpay-event-id") || "missing-event-id";
  const store = orders();
  const existingEvent = await getJson(store, eventKey(eventId));
  if (existingEvent) return json({ ok: true, duplicate: true });

  let payload;
  try { payload = JSON.parse(rawBody); } catch { return json({ error: "invalid_json" }, 400); }
  await putJson(store, eventKey(eventId), { eventId, event: payload.event || "unknown", receivedAt: new Date().toISOString() }, { onlyIfNew: true });

  if (payload.event !== "payment_link.paid") {
    return json({ ok: true, ignored: payload.event || "unknown" });
  }

  let payment;
  try { payment = extractPaidPayment(payload); } catch (error) {
    console.error("payment validation error", error.message);
    return json({ error: "payment_validation_failed" }, 422);
  }
  if (!payment) return json({ error: "payment_not_eligible" }, 422);

  const key = orderKey(payment.paymentId);
  const existingOrder = await getJson(store, key);
  if (existingOrder) return json({ ok: true, duplicate: true, paymentId: payment.paymentId });

  const order = {
    ...payment,
    status: "paid",
    fulfillmentStatus: "processing",
    emailStatus: "pending",
    eventId,
    createdAt: new Date().toISOString(),
  };
  const created = await putJson(store, key, order, { onlyIfNew: true });
  if (!created.modified) return json({ ok: true, duplicate: true, paymentId: payment.paymentId });

  try {
    const grants = [];
    for (const file of PRODUCT_FILES) {
      grants.push(await createGrant({
        paymentId: payment.paymentId,
        email: payment.email,
        assetKey: file.key,
        filename: file.filename,
        ttl: ttlMs(),
        maxDownloads: maxDownloads(),
      }));
    }
    await putJson(store, key, { ...order, grants: grants.map((g) => g.token) });
    const email = await sendDeliveryEmail({ email: payment.email, paymentId: payment.paymentId, grants });
    await putJson(store, key, { ...order, fulfillmentStatus: "fulfilled", emailStatus: "sent", emailId: email?.id || null, grants: grants.map((g) => g.token), fulfilledAt: new Date().toISOString() });
    return json({ ok: true, fulfilled: true, paymentId: payment.paymentId });
  } catch (error) {
    console.error("fulfillment error", error.message);
    const failedOrder = await getJson(store, key);
    await putJson(store, key, { ...(failedOrder || order), fulfillmentStatus: "email_retry", emailStatus: "failed", lastError: error.message, lastAttemptAt: new Date().toISOString() });
    // A verified paid order is retained; the scheduled retry function will retry email.
    return json({ ok: true, paid: true, emailRetry: true, paymentId: payment.paymentId });
  }
};

export const config = { path: "/api/razorpay-webhook" };
