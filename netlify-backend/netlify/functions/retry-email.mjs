import { sendDeliveryEmail } from "./_lib/email.mjs";
import { grantKey, getJson, orders, putJson } from "./_lib/storage.mjs";

export default async () => {
  const store = orders();
  const listed = await store.list({ prefix: "order/" });
  const results = [];
  for (const item of listed.blobs || []) {
    const key = item.key || item;
    const order = await getJson(store, key);
    if (!order || order.fulfillmentStatus !== "email_retry" || !Array.isArray(order.grants)) continue;
    const grants = [];
    for (const token of order.grants) {
      const grant = await getJson(store, grantKey(token));
      if (grant) grants.push(grant);
    }
    try {
      const email = await sendDeliveryEmail({ email: order.email, paymentId: order.paymentId, grants });
      await putJson(store, key, { ...order, fulfillmentStatus: "fulfilled", emailStatus: "sent", emailId: email?.id || null, retriedAt: new Date().toISOString() });
      results.push({ paymentId: order.paymentId, status: "sent" });
    } catch (error) {
      await putJson(store, key, { ...order, emailStatus: "failed", lastError: error.message, lastAttemptAt: new Date().toISOString() });
      results.push({ paymentId: order.paymentId, status: "failed" });
    }
  }
  console.log(JSON.stringify({ retryCount: results.length, results }));
};

export const config = { schedule: "*/15 * * * *" };
