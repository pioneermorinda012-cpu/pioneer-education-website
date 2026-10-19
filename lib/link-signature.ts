/* SERVER ONLY. Verifies the razorpay_signature Razorpay appends to the
 * "redirect after payment" URL for a Payment Link.
 *
 * This is NOT the webhook secret (RAZORPAY_WEBHOOK_SECRET) — it is the
 * account's own API Key Secret (Dashboard -> Settings -> API Keys), kept
 * here as RAZORPAY_KEY_SECRET. If that variable is missing, or the
 * signature does not match, verification simply fails closed: nobody can
 * claim a password this way. The webhook (app/api/razorpay/webhook), which
 * is what actually creates the account and emails a login, is completely
 * unaffected either way — this is only a shortcut on top of it.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaymentLinkSignature(p: {
  paymentLinkId: string; referenceId: string; status: string; paymentId: string; signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !p.signature || !p.paymentLinkId || !p.paymentId) return false;
  const payload = `${p.paymentLinkId}|${p.referenceId}|${p.status}|${p.paymentId}`;
  const want = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(want), b = Buffer.from(p.signature.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}
