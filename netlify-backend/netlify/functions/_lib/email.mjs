import { Resend } from "resend";
import { publicUrl, required } from "./config.mjs";

export async function sendDeliveryEmail({ email, paymentId, grants }) {
  const resend = new Resend(required("RESEND_API_KEY"));
  const base = publicUrl();
  const links = grants.map((grant) => `<li><a href="${base}/api/download/${encodeURIComponent(grant.token)}">${grant.filename}</a> — link expires ${grant.expiresAt}</li>`).join("");
  const html = `
    <h2>Your Excel eBook is ready</h2>
    <p>Payment reference: ${paymentId}</p>
    <p>Download your two files below. Each link expires according to the delivery policy.</p>
    <ul>${links}</ul>
    <p>For support, reply to ${required("SUPPORT_EMAIL")}.</p>
  `;
  const text = `Your Excel eBook is ready. Payment reference: ${paymentId}\n\n${grants.map((g) => `${g.filename}: ${base}/api/download/${encodeURIComponent(g.token)}`).join("\n")}\n\nSupport: ${required("SUPPORT_EMAIL")}`;
  const result = await resend.emails.send({
    from: required("EMAIL_FROM"),
    to: [email],
    replyTo: required("SUPPORT_EMAIL"),
    subject: "Your Excel Se Online Earning eBooks",
    html,
    text,
    idempotencyKey: `ebook-delivery/${paymentId}`,
  });
  if (result.error) throw new Error(result.error.message || "Resend email failed");
  return result.data;
}
