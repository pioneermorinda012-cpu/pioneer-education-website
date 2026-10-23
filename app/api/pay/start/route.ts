import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getCourse, planKey, planTitle, buyable, TERM_MONTHS } from "@/app/data/courses";
import { createPaymentLink, paymentsMissing } from "@/lib/razorpay";
import { siteUrl } from "@/lib/mail";

export const runtime = "nodejs";

/* "Pay now" on a course page lands here with the plan and the buyer's
 * details. The price comes from app/data/courses.ts, so editing the price
 * list is all it takes to change what Razorpay charges; the browser only
 * says which plan. The answer is a fresh Razorpay link for this one buyer. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// A few links per visitor per ten minutes is plenty for a real buyer.
const hits = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > 8;
}

export async function POST(req: NextRequest) {
  const missing = paymentsMissing();
  if (missing.length) {
    console.error("pay/start: not configured, missing", missing);
    return NextResponse.json(
      { error: "Online payment is not switched on yet. Please message us on WhatsApp to enrol." },
      { status: 503 },
    );
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (tooMany(ip)) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes and try again." }, { status: 429 });
  }

  let b: Record<string, unknown> = {};
  try { b = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }

  const course = getCourse(String(b.course ?? ""));
  const plan = course?.plans.find((p) =>
    p.tier === b.tier && p.term === b.term && (p.level ?? "") === String(b.level ?? ""));
  if (!course || !plan || !buyable(plan)) {
    return NextResponse.json({ error: "That plan cannot be bought online. Please message us on WhatsApp." }, { status: 400 });
  }

  const name = String(b.name ?? "").replace(/\s+/g, " ").trim();
  const email = String(b.email ?? "").trim().toLowerCase();
  const digits = String(b.phone ?? "").replace(/\D/g, "");
  const phone = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  if (name.length < 2 || name.length > 80) {
    return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
  }
  if (!EMAIL.test(email) || email.length > 120) {
    return NextResponse.json({ error: "Enter a valid email address — your login is sent there." }, { status: 400 });
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a 10-digit Indian mobile number." }, { status: 400 });
  }

  const key = planKey(course.slug, plan);
  const title = `${course.name} — ${planTitle(plan)}`;
  try {
    const link = await createPaymentLink({
      amountRupees: plan.price!,
      description: title,
      referenceId: `pec_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`,
      customer: { name, email, contact: `+91${phone}` },
      // read back by app/api/razorpay/webhook to open the right module for the right time
      notes: {
        plan_key: key,
        course: course.slug,
        plan: planTitle(plan),
        months: String(TERM_MONTHS[plan.term]),
        amount: String(plan.price),
        name, email, phone,
      },
      callbackUrl: `${siteUrl()}/payment/thank-you`,
      validFor: 2 * 60 * 60, // two hours to pay
    });
    return NextResponse.json({ url: link.short_url });
  } catch (e) {
    console.error("pay/start", e);
    return NextResponse.json(
      { error: "Could not open the payment page just now. Please try again, or message us on WhatsApp." },
      { status: 502 },
    );
  }
}
