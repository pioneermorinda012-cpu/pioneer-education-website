import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import {
  createStudent, findStudentByEmail, findStudentByPayment, supabaseReady,
} from "@/lib/students";
import { hashPin } from "@/lib/session";
import { esc, letter, mailReady, sendMail, siteUrl } from "@/lib/mail";
import { findPlanByLink, planTitle } from "@/app/data/courses";
import { areasForCourse, getAccess, setAccess } from "@/lib/access";
import { notifyOwnerWhatsApp } from "@/lib/whatsapp-notify";

export const runtime = "nodejs";

/* Razorpay calls this after a payment. It is the only thing that creates a
 * login for a paying student, because only Razorpay can sign the request:
 * the thank-you page a student lands on can be opened by anyone.
 *
 * Razorpay dashboard → Settings → Webhooks → Add:
 *   URL     https://pioneermorinda.com/api/razorpay/webhook
 *   Secret  any long random text; the same text goes in RAZORPAY_WEBHOOK_SECRET
 *   Events  payment_link.paid   (and payment.captured if you use Payment Pages)
 *
 * Razorpay retries until it gets a 200 and may send one payment twice, so the
 * payment id is stored on the student and a repeat is answered without
 * creating a second login. */

const LETTERS = "abcdefghjkmnpqrstuvwxyz23456789"; // no 0/o, 1/l/i to misread

function newPassword(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += LETTERS[randomInt(LETTERS.length)];
  return s;
}

function signatureOk(body: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const want = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(want), b = Buffer.from(header.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}

type Entity = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Name, email, phone and the link paid, from either kind of event. */
function details(evt: { event?: string; payload?: Record<string, { entity?: Entity }> }) {
  const pay = (evt.payload?.payment?.entity ?? {}) as Entity;
  const link = (evt.payload?.payment_link?.entity ?? {}) as Entity;
  const cust = (link.customer ?? {}) as Entity;
  const notes = { ...((link.notes ?? {}) as Entity), ...((pay.notes ?? {}) as Entity) };
  const fromNotes = (...keys: string[]) => keys.map((k) => str(notes[k])).find(Boolean) ?? "";
  const email = (str(pay.email) || str(cust.email) || fromNotes("email", "email_id", "Email")).toLowerCase();
  const phone = str(pay.contact) || str(cust.contact) || fromNotes("phone", "contact", "mobile", "Phone");
  const name = str(cust.name) || fromNotes("name", "full_name", "student_name", "Name") || email.split("@")[0] || "Student";
  return {
    paymentId: str(pay.id),
    status: str(pay.status),
    amount: typeof pay.amount === "number" ? pay.amount / 100 : null,
    linkUrl: str(link.short_url),
    email, phone, name,
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  // Email is required: the password exists only in the email, so creating a
  // login nobody can be told about would help no one. Until it is set up the
  // 503 makes Razorpay keep retrying (for about a day).
  if (!secret || !supabaseReady() || !process.env.PRACTICE_SESSION_SECRET || !mailReady()) {
    return NextResponse.json({ error: "Payments are not configured on the server." }, { status: 503 });
  }

  // The signature covers the exact bytes Razorpay sent, so read the raw text
  // and only parse it after checking.
  const body = await req.text();
  if (!signatureOk(body, req.headers.get("x-razorpay-signature"), secret)) {
    return NextResponse.json({ error: "Bad signature." }, { status: 401 });
  }

  let evt;
  try { evt = JSON.parse(body); } catch { return NextResponse.json({ error: "Bad body." }, { status: 400 }); }
  if (evt.event !== "payment_link.paid" && evt.event !== "payment.captured") {
    return NextResponse.json({ ok: true, ignored: evt.event });
  }

  const d = details(evt);
  if (!d.paymentId) return NextResponse.json({ ok: true, ignored: "no payment id" });
  if (!d.email) {
    // Nothing to send a login to. Answer 200 so Razorpay stops retrying; the
    // owner sees the payment in Razorpay and makes the login by hand.
    console.error("razorpay webhook: payment without email", d.paymentId);
    return NextResponse.json({ ok: true, warning: "no email on payment" });
  }

  const match = d.linkUrl ? findPlanByLink(d.linkUrl) : null;
  const batch = match ? `${match.course.name} · ${planTitle(match.plan)} (online)` : "Paid online";

  try {
    if (await findStudentByPayment(d.paymentId)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    /* Someone who already has a login (a renewal, or a second course) keeps
       it: a second account would split their results in two. */
    const existing = await findStudentByEmail(d.email);
    // what this payment opens: IELTS → Academic and GT, PTE → PTE, Spoken English → English
    const opens = match ? areasForCourse(match.course.slug) : [];
    if (existing) {
      /* A second course adds its modules. A login with no settings already
         opens everything, so it is left alone. */
      if (opens.length) {
        try {
          const had = await getAccess(existing.id);
          if (had) await setAccess(existing.id, [...had, ...opens]);
        } catch (e) { console.error("access", e); }
      }
      {
        await sendMail(
          d.email,
          "Payment received — your Pioneer login is unchanged",
          letter("Payment received — thank you", `
<p>Dear ${esc(existing.full_name)},</p>
<p>We have received your payment${d.amount ? ` of <b>₹${d.amount.toLocaleString("en-IN")}</b>` : ""}${match ? ` for <b>${esc(match.course.name)} — ${esc(planTitle(match.plan))}</b>` : ""}.</p>
<p>You already have a student login, so it stays the same: student code <b>${esc(existing.code)}</b> (you can also sign in with this email address).</p>
<p>Forgotten the password? <a href="${siteUrl()}/practice/forgot">Reset it here</a>.</p>`),
          `We have received your payment. Your student login is unchanged: code ${existing.code}. Forgot the password? ${siteUrl()}/practice/forgot`,
        ).catch((e) => console.error("mail", e));
      }
      return NextResponse.json({ ok: true, existing: existing.code });
    }

    const password = newPassword();
    const pin_hash = await hashPin(password);
    let created = null;
    for (let tries = 0; tries < 8 && !created; tries++) {
      const code = `PEC-${String(randomInt(1000, 10000))}`;
      try {
        created = await createStudent({
          code, pin_hash, full_name: d.name, batch,
          email: d.email, phone: d.phone || undefined, payment_id: d.paymentId,
        });
      } catch (e) {
        const msg = String(e);
        // the payment id is unique too: a second delivery racing this one
        if (/payment_id|email_active/.test(msg)) return NextResponse.json({ ok: true, duplicate: true });
        if (!/409|23505|duplicate/i.test(msg)) throw e; // anything but "code taken"
      }
    }
    if (!created) throw new Error("Could not find a free student code");
    if (opens.length) {
      // the login opens only the course that was paid for
      try { await setAccess(created.id, opens); } catch (e) { console.error("access", e); }
    }

    const signIn = `${siteUrl()}/practice/sign-in`;
    {
      await sendMail(
        d.email,
        "Your Pioneer Education student login",
        letter("Welcome to Pioneer Education", `
<p>Dear ${esc(d.name)},</p>
<p>Thank you — your payment${d.amount ? ` of <b>₹${d.amount.toLocaleString("en-IN")}</b>` : ""} is confirmed${match ? ` for <b>${esc(match.course.name)} — ${esc(planTitle(match.plan))}</b>` : ""}.</p>
<p>Your login for the practice tests:</p>
<table style="border-collapse:collapse;margin:8px 0 14px">
<tr><td style="padding:6px 14px 6px 0;color:#5a6272">Student code</td><td style="padding:6px 0;font-size:18px"><b>${esc(created.code)}</b></td></tr>
<tr><td style="padding:6px 14px 6px 0;color:#5a6272">Password</td><td style="padding:6px 0;font-size:18px;font-family:Consolas,monospace"><b>${esc(password)}</b></td></tr>
</table>
<p>You can also sign in with this email address instead of the code.</p>
<p><a href="${signIn}" style="display:inline-block;background:#DB6A0C;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Sign in</a></p>
<p style="font-size:14px">Forget the password later? Use <a href="${siteUrl()}/practice/forgot">Forgot password</a> on the sign-in page and we email you a link to set a new one.</p>`),
        `Welcome to Pioneer Education. Student code: ${created.code}. Password: ${password}. Sign in: ${signIn}. Forgot it later? ${siteUrl()}/practice/forgot`,
      ).catch((e) => console.error("mail to student", e));

      const owner = process.env.OWNER_EMAIL;
      if (owner) {
        await sendMail(
          owner,
          `New online enrolment: ${d.name}${match ? ` — ${match.course.name}` : ""}`,
          letter("New online enrolment", `
<p><b>${esc(d.name)}</b> paid${d.amount ? ` ₹${d.amount.toLocaleString("en-IN")}` : ""}${match ? ` for ${esc(match.course.name)} — ${esc(planTitle(match.plan))}` : ""}.</p>
<p>Email: ${esc(d.email)}<br>Phone: ${esc(d.phone || "—")}<br>Student code: <b>${esc(created.code)}</b><br>Razorpay payment: ${esc(d.paymentId)}</p>`),
          `${d.name} paid. Email ${d.email}, phone ${d.phone || "-"}, code ${created.code}, payment ${d.paymentId}`,
        ).catch((e) => console.error("mail to owner", e));
      }

      // A second, independent channel — free WhatsApp ping to the owner's
      // own number via CallMeBot. Does nothing if it is not configured, and
      // can never fail the enrolment (see lib/whatsapp-notify.ts).
      await notifyOwnerWhatsApp(
        `New enrolment: ${d.name}${match ? ` — ${match.course.name}` : ""}. ` +
        `Code ${created.code}.${d.phone ? ` Phone ${d.phone}.` : ""} Payment ${d.paymentId}.`,
      );
    }
    return NextResponse.json({ ok: true, code: created.code });
  } catch (e) {
    // a 500 makes Razorpay try again later, which is what we want if the
    // database was briefly unreachable
    console.error("razorpay webhook", e);
    return NextResponse.json({ error: "Could not create the login." }, { status: 500 });
  }
}
