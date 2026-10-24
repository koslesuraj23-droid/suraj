import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

process.env.RAZORPAY_WEBHOOK_SECRET = "test-webhook-secret";
process.env.RAZORPAY_PAYMENT_LINK_ID = "plink_test_excel";

const { verifyWebhookSignature, extractPaidPayment } = await import("../netlify/functions/_lib/razorpay.mjs");

const payload = {
  event: "payment_link.paid",
  payload: {
    payment_link: { entity: { id: "plink_test_excel", amount: 19900, currency: "INR", status: "paid", customer: { email: "buyer@example.com" }, reference_id: "EXCEL-EBOOK-TEST" } },
    payment: { entity: { id: "pay_test_1", amount: 19900, currency: "INR", status: "captured", email: "buyer@example.com", order_id: "order_test_1" } },
    order: { entity: { id: "order_test_1", amount: 19900, currency: "INR", status: "paid", receipt: "EXCEL-EBOOK-TEST" } },
  },
};

const raw = JSON.stringify(payload);
const validSignature = createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest("hex");

test("accepts valid raw-body signature", () => {
  assert.equal(verifyWebhookSignature(raw, validSignature), true);
});

test("rejects a changed body with the original signature", () => {
  assert.equal(verifyWebhookSignature(`${raw} `, validSignature), false);
});

test("accepts the exact Test Mode product payment", () => {
  assert.deepEqual(extractPaidPayment(payload), {
    paymentLinkId: "plink_test_excel",
    paymentId: "pay_test_1",
    orderId: "order_test_1",
    email: "buyer@example.com",
    amount: 19900,
    currency: "INR",
    receipt: "EXCEL-EBOOK-TEST",
  });
});

test("rejects a wrong amount", () => {
  const wrong = structuredClone(payload);
  wrong.payload.payment.entity.amount = 10000;
  assert.equal(extractPaidPayment(wrong), null);
});

test("rejects an uncaptured payment", () => {
  const pending = structuredClone(payload);
  pending.payload.payment.entity.status = "authorized";
  assert.equal(extractPaidPayment(pending), null);
});
