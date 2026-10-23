/* SERVER ONLY. Creates a Razorpay Payment Link for one plan, at the price
 * written in app/data/courses.ts — never at a price sent by the browser.
 *
 * Needs, in Vercel:
 *   RAZORPAY_KEY_ID       Razorpay → Settings → API Keys (starts rzp_live_)
 *   RAZORPAY_KEY_SECRET   shown once when the key is generated
 * and everything the webhook needs to turn a payment into a login, because
 * taking money without being able to send the login would be worse than not
 * taking it: RAZORPAY_WEBHOOK_SECRET, the Supabase settings,
 * PRACTICE_SESSION_SECRET and the email settings (lib/mail.ts). */

import { mailReady } from "@/lib/mail";

export function paymentsMissing(): string[] {
  const need: [string, boolean][] = [
    ["RAZORPAY_KEY_ID", Boolean(process.env.RAZORPAY_KEY_ID)],
    ["RAZORPAY_KEY_SECRET", Boolean(process.env.RAZORPAY_KEY_SECRET)],
    ["RAZORPAY_WEBHOOK_SECRET", Boolean(process.env.RAZORPAY_WEBHOOK_SECRET)],
    ["PRACTICE_SESSION_SECRET", Boolean(process.env.PRACTICE_SESSION_SECRET)],
    ["Supabase settings", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)],
    ["email settings (RESEND_API_KEY, MAIL_FROM)", mailReady()],
  ];
  return need.filter(([, ok]) => !ok).map(([name]) => name);
}

export const paymentsReady = () => paymentsMissing().length === 0;

const API = (process.env.RAZORPAY_API_BASE || "https://api.razorpay.com").replace(/\/+$/, "");

export type NewLink = {
  amountRupees: number;
  description: string;
  referenceId: string;
  customer: { name: string; email: string; contact: string };
  notes: Record<string, string>;
  callbackUrl: string;
  /** seconds from now until the link stops working */
  validFor: number;
};

export async function createPaymentLink(l: NewLink): Promise<{ id: string; short_url: string }> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const notes: Record<string, string> = {};
  for (const [k, v] of Object.entries(l.notes).slice(0, 15)) notes[k] = String(v).slice(0, 250);
  const res = await fetch(`${API}/v1/payment_links`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(l.amountRupees * 100), // paise
      currency: "INR",
      accept_partial: false,
      description: l.description.slice(0, 2000),
      reference_id: l.referenceId.slice(0, 40),
      customer: l.customer,
      notify: { sms: false, email: false },
      reminder_enable: false,
      notes,
      callback_url: l.callbackUrl,
      callback_method: "get",
      expire_by: Math.floor(Date.now() / 1000) + l.validFor,
    }),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Razorpay ${res.status}: ${text.slice(0, 300)}`);
  const j = JSON.parse(text) as { id?: string; short_url?: string };
  if (!j.id || !j.short_url) throw new Error("Razorpay sent no link");
  return { id: j.id, short_url: j.short_url };
}
