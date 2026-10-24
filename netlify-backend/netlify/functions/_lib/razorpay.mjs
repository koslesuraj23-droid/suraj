import { createHmac, timingSafeEqual } from "node:crypto";
import { PRODUCT_CURRENCY, PRODUCT_PRICE_PAISE, required } from "./config.mjs";

export function verifyWebhookSignature(rawBody, receivedSignature) {
  if (!receivedSignature) return false;
  const expected = createHmac("sha256", required("RAZORPAY_WEBHOOK_SECRET"))
    .update(rawBody, "utf8")
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(receivedSignature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function extractPaidPayment(payload) {
  const link = payload?.payload?.payment_link?.entity;
  const payment = payload?.payload?.payment?.entity;
  const order = payload?.payload?.order?.entity;
  if (!link || !payment) return null;

  const paymentLinkId = link.id;
  const amount = Number(payment.amount ?? link.amount ?? order?.amount);
  const currency = payment.currency ?? link.currency ?? order?.currency;
  const paymentStatus = payment.status;
  const linkStatus = link.status;
  const email = link.customer?.email || payment.email || "";
  const paymentId = payment.id;
  const orderId = payment.order_id || order?.id || link.order_id || "";

  if (!paymentLinkId || !paymentId) return null;
  if (paymentLinkId !== required("RAZORPAY_PAYMENT_LINK_ID")) return null;
  if (amount !== PRODUCT_PRICE_PAISE || currency !== PRODUCT_CURRENCY) return null;
  if (paymentStatus !== "captured" || linkStatus !== "paid") return null;
  if (!email || !email.includes("@")) return null;

  return {
    paymentLinkId,
    paymentId,
    orderId,
    email,
    amount,
    currency,
    receipt: order?.receipt || link.reference_id || "",
  };
}
