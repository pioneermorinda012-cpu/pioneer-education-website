import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import {
  createStudent, findStudentByEmail, findStudentByPayment, setStudentPin, supabaseReady,
} from "@/lib/students";
import { hashPin } from "@/lib/session";
import { esc, letter, mailReady, sendMail, siteUrl } from "@/lib/mail";
import { findPlanByKey, findPlanByLink, planKey, planTitle, TERM_MONTHS } from "@/app/data/courses";
import {
  AREAS, addPaidTime, areasForCourse, getAccessRow, saveAccessRow, type AccessRow, type Area,
} from "@/lib/access";
import { notifyOwnerWhatsApp } from "@/lib/whatsapp-notify";

export const runtime = "nodejs";

/* Razorpay calls this after a payment. It is the only thing that creates a
 * login for a paying student, because only Razorpay can sign the request:
 * the thank-you page a student lands on can be opened by anyone.
 *
 * Razorpay dashboard → Settings → Webhooks → Add:
 *   URL     https://pioneermorinda.com/api/razorpay/webhook
 *   Secret  any long random text; the same text goes in RAZORPAY_WEBHOOK_SECRET
 *   Events  payment_link.paid
 *
 * Every "Pay now" on the site makes its own payment link (app/api/pay/start)
 * carrying the plan in its notes: which course, how many months, what price.
 * From that this opens the course's module until the end date — or adds the
 * months on, when the student renews before it runs out.
 *
 * Razorpay retries until it gets a 200 and may send one payment twice. A new
 * student's login stores the payment id; a renewal stores it in the access
 * row (lib/access.ts). Either way a repeat changes nothing.
 *
 * A payment that cannot be matched to a plan — a link made by hand in the
 * Razorpay dashboard, say — creates nothing on its own: the owner is told and
 * makes the login in the teacher area. Opening everything forever for an
 * unknown payment would be the expensive mistake. */

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
const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

/** Name, email, phone, the link paid and its notes. */
function details(evt: { event?: string; payload?: Record<string, { entity?: Entity }> }) {
  const pay = (evt.payload?.payment?.entity ?? {}) as Entity;
  const link = (evt.payload?.payment_link?.entity ?? {}) as Entity;
  const cust = (link.customer ?? {}) as Entity;
  const asObj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Entity) : {});
  const notes = { ...asObj(pay.notes), ...asObj(link.notes) }; // the link's own notes win
  const fromNotes = (...keys: string[]) => keys.map((k) => str(notes[k])).find(Boolean) ?? "";
  const email = (str(cust.email) || fromNotes("email") || str(pay.email)).toLowerCase();
  const phone = fromNotes("phone") || str(cust.contact) || str(pay.contact);
  const name = str(cust.name) || fromNotes("name", "full_name") || email.split("@")[0] || "Student";
  return {
    paymentId: str(pay.id),
    payStatus: str(pay.status),
    linkStatus: str(link.status),
    amount: typeof pay.amount === "number" ? pay.amount / 100 : null,
    linkUrl: str(link.short_url),
    planKey: fromNotes("plan_key"),
    noteCourse: fromNotes("course"),
    noteMonths: Number(fromNotes("months")),
    notePlan: fromNotes("plan"),
    noteAmount: Number(fromNotes("amount")),
    email, phone, name,
  };
}

const IST = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const areaName = (a: Area) => AREAS.find((x) => x.key === a)?.label ?? a;

/** "IELTS Academic and IELTS General Training until 23 November 2026" */
function untilText(until: Partial<Record<Area, string>>): string {
  const byDate = new Map<string, Area[]>();
  for (const [a, d] of Object.entries(until) as [Area, string][]) {
    const k = IST(d);
    byDate.set(k, [...(byDate.get(k) ?? []), a]);
  }
  return [...byDate.entries()].map(([d, as]) => `${as.map(areaName).join(" and ")} until ${d}`).join("; ");
}

const EMPTY: AccessRow = { access: [], until: {}, payments: [] };

async function tellOwner(subject: string, html: string, text: string) {
  const owner = process.env.OWNER_EMAIL;
  if (owner) await sendMail(owner, subject, letter(subject, html), text).catch((e) => console.error("mail to owner", e));
  await notifyOwnerWhatsApp(text);
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

  /* Everything sold on the site is a payment link, and payment_link.paid
     carries the plan. payment.captured fires for the same payment too, so it
     is never acted on — only, for a payment that is not one of ours (an old
     Payment Page), passed to the owner to handle by hand. */
  if (evt.event === "payment.captured") {
    const d = details(evt);
    const pay = (evt.payload?.payment?.entity ?? {}) as Entity;
    const ours = Boolean(d.planKey) || /^#/.test(str(pay.description)) || Boolean(str(pay.invoice_id));
    if (!ours && d.paymentId) {
      await tellOwner(
        `Payment to check: ${d.name}`,
        `<p>A payment arrived that did not come from a course page on the site (perhaps an old Payment Page), so no login was made.</p>
<p>${esc(d.name)} · ${esc(d.email || "no email")} · ${esc(d.phone || "no phone")}<br>Amount: ₹${d.amount ?? "?"} · Razorpay payment ${esc(d.paymentId)}</p>
<p>If it is a course fee, add the student in the teacher area and tick their module.</p>`,
        `Payment to check (not from the site): ${d.name}, ${d.email || "-"}, ₹${d.amount ?? "?"}, ${d.paymentId}. Make the login by hand.`,
      );
    }
    return NextResponse.json({ ok: true, ignored: "payment.captured" });
  }
  if (evt.event !== "payment_link.paid") {
    return NextResponse.json({ ok: true, ignored: evt.event });
  }

  const d = details(evt);
  if (!d.paymentId) return NextResponse.json({ ok: true, ignored: "no payment id" });
  if (d.payStatus !== "captured" && d.linkStatus !== "paid") {
    return NextResponse.json({ ok: true, ignored: `status ${d.payStatus || d.linkStatus}` });
  }

  /* ---- which plan: the key the site put on the link; or, for a link pasted
     into the price list by hand, the link itself ---- */
  let slug = "", months = 0, planName = "", courseName = "", expected = 0;
  const byKey = d.planKey ? findPlanByKey(d.planKey) : null;
  if (d.planKey) {
    // the notes were written by our own server when the link was made
    slug = d.noteCourse || byKey?.course.slug || d.planKey.split(":")[0];
    months = d.noteMonths || (byKey ? TERM_MONTHS[byKey.plan.term] : 0);
    planName = d.notePlan || (byKey ? planTitle(byKey.plan) : "");
    courseName = byKey?.course.name ?? slug;
    expected = d.noteAmount;
  } else if (d.linkUrl) {
    const m = findPlanByLink(d.linkUrl);
    if (m) {
      slug = m.course.slug; months = TERM_MONTHS[m.plan.term];
      planName = planTitle(m.plan); courseName = m.course.name;
      expected = m.plan.price ?? 0;
      d.planKey = planKey(m.course.slug, m.plan);
    }
  }
  const opens = slug ? areasForCourse(slug) : [];
  const amountOk = !expected || (d.amount !== null && Math.abs(d.amount - expected) < 0.5);

  if (!opens.length || !(months >= 1 && months <= 24) || !amountOk || !d.email) {
    const why = !d.email ? "no email address on the payment"
      : !amountOk ? `amount ₹${d.amount} does not match the plan price ₹${expected}`
        : "it does not match a plan on the site";
    console.error("razorpay webhook: unmatched payment", d.paymentId, why);
    await tellOwner(
      `Payment to check: ${d.name}`,
      `<p>A payment arrived but no login was made, because ${esc(why)}.</p>
<p>${esc(d.name)} · ${esc(d.email || "no email")} · ${esc(d.phone || "no phone")}<br>Amount: ₹${d.amount ?? "?"} · Razorpay payment ${esc(d.paymentId)}${d.planKey ? `<br>Plan: ${esc(d.planKey)}` : ""}</p>
<p>Add the student in the teacher area and tick their module.</p>`,
      `Payment to check (${why}): ${d.name}, ${d.email || "-"}, ₹${d.amount ?? "?"}, ${d.paymentId}. Make the login by hand.`,
    );
    if (d.email) {
      await sendMail(
        d.email, "Payment received — Pioneer Education",
        letter("Payment received — thank you", `<p>Dear ${esc(d.name)},</p>
<p>We have received your payment${d.amount ? ` of <b>₹${d.amount.toLocaleString("en-IN")}</b>` : ""}. The centre will send your login shortly.</p>`),
        "We have received your payment. The centre will send your login shortly.",
      ).catch((e) => console.error("mail", e));
    }
    return NextResponse.json({ ok: true, unmatched: why });
  }

  const what = `${courseName} — ${planName}`;
  const batch = `${courseName} · ${planName} (online)`;
  const paidLine = `${d.amount ? ` of <b>₹${d.amount.toLocaleString("en-IN")}</b>` : ""} for <b>${esc(what)}</b>`;

  try {
    /* ---- seen this payment before: the login was made on an earlier try ---- */
    const again = await findStudentByPayment(d.paymentId);
    if (again) {
      const row = await getAccessRow(again.id);
      if (row && row.payments.includes(d.paymentId)) return NextResponse.json({ ok: true, duplicate: true });
      // The login was made but its modules were not saved (the database failed
      // half-way). Save them now, and send a fresh password, since the first
      // email was never sent.
      const { row: next } = addPaidTime(row ?? EMPTY, opens, months, d.paymentId);
      await saveAccessRow(again.id, next);
      const password = newPassword();
      await setStudentPin(again.id, await hashPin(password));
      await sendWelcome(d.email, d.name, again.code, password, paidLine, untilText(next.until));
      return NextResponse.json({ ok: true, repaired: again.code });
    }

    /* ---- someone who already has a login: renewal or a second course ---- */
    const existing = await findStudentByEmail(d.email);
    if (existing) {
      const row = await getAccessRow(existing.id);
      let note: string;
      if (!row) {
        // No module settings means the login already opens everything with no
        // end date; adding a row now would take most of that away.
        note = "Your login already opens every module, with no end date, so nothing needed changing.";
      } else {
        const r = addPaidTime(row, opens, months, d.paymentId);
        if (r.already) return NextResponse.json({ ok: true, duplicate: true });
        await saveAccessRow(existing.id, r.row);
        note = Object.keys(r.until).length
          ? `Your access is now open: ${esc(untilText(r.until))}.`
          : "Your login already opens this course with no end date, so nothing needed changing.";
      }
      await sendMail(
        d.email,
        "Payment received — your Pioneer login is unchanged",
        letter("Payment received — thank you", `
<p>Dear ${esc(existing.full_name)},</p>
<p>We have received your payment${paidLine}.</p>
<p>${note}</p>
<p>You already have a student login, so it stays the same: student code <b>${esc(existing.code)}</b> (you can also sign in with this email address). If you are signed in already, sign out and in again to see the change.</p>
<p>Forgotten the password? <a href="${siteUrl()}/practice/forgot">Reset it here</a>.</p>`),
        `We have received your payment for ${what}. ${note.replace(/<[^>]+>/g, "")} Your login is unchanged: code ${existing.code}. Forgot the password? ${siteUrl()}/practice/forgot`,
      ).catch((e) => console.error("mail", e));
      await tellOwner(
        `Online payment (existing student): ${existing.full_name} — ${courseName}`,
        `<p><b>${esc(existing.full_name)}</b> (${esc(existing.code)}) paid${paidLine}.</p><p>${note}</p><p>Razorpay payment: ${esc(d.paymentId)}</p>`,
        `Payment: ${existing.full_name} (${existing.code}) — ${what}${d.amount ? `, ₹${d.amount}` : ""}. Payment ${d.paymentId}.`,
      );
      return NextResponse.json({ ok: true, existing: existing.code });
    }

    /* ---- a new student ---- */
    const password = newPassword();
    const pin_hash = await hashPin(password);
    let created = null;
    for (let tries = 0; tries < 8 && !created; tries++) {
      const code = `PEC-${String(randomInt(1000, 10000))}`;
      try {
        created = await createStudent({
          code, pin_hash, full_name: d.name, batch,
          track: opens.includes("gt") && !opens.includes("academic") ? "gt" : "academic",
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

    // The login opens only what was paid for, until its end date. If this
    // fails, the 500 brings Razorpay back, and the "seen before" branch above
    // finishes the job.
    const { row } = addPaidTime(EMPTY, opens, months, d.paymentId);
    await saveAccessRow(created.id, row);

    await sendWelcome(d.email, d.name, created.code, password, paidLine, untilText(row.until));
    await tellOwner(
      `New online enrolment: ${d.name} — ${courseName}`,
      `<p><b>${esc(d.name)}</b> paid${paidLine}.</p>
<p>Email: ${esc(d.email)}<br>Phone: ${esc(d.phone || "—")}<br>Student code: <b>${esc(created.code)}</b><br>Open: ${esc(untilText(row.until))}<br>Razorpay payment: ${esc(d.paymentId)}</p>`,
      `New enrolment: ${d.name} — ${what}${d.amount ? `, ₹${d.amount}` : ""}. Code ${created.code}.${d.phone ? ` Phone ${d.phone}.` : ""} Payment ${d.paymentId}.`,
    );
    return NextResponse.json({ ok: true, code: created.code });
  } catch (e) {
    // a 500 makes Razorpay try again later, which is what we want if the
    // database was briefly unreachable
    console.error("razorpay webhook", e);
    return NextResponse.json({ error: "Could not create the login." }, { status: 500 });
  }
}

async function sendWelcome(email: string, name: string, code: string, password: string, paidLine: string, until: string) {
  const signIn = `${siteUrl()}/practice/sign-in`;
  await sendMail(
    email,
    "Your Pioneer Education student login",
    letter("Welcome to Pioneer Education", `
<p>Dear ${esc(name)},</p>
<p>Thank you — your payment${paidLine} is confirmed.</p>
<p>Your login for the practice material:</p>
<table style="border-collapse:collapse;margin:8px 0 14px">
<tr><td style="padding:6px 14px 6px 0;color:#5a6272">Student code</td><td style="padding:6px 0;font-size:18px"><b>${esc(code)}</b></td></tr>
<tr><td style="padding:6px 14px 6px 0;color:#5a6272">Password</td><td style="padding:6px 0;font-size:18px;font-family:Consolas,monospace"><b>${esc(password)}</b></td></tr>
</table>
<p>Your access: <b>${esc(until)}</b>.</p>
<p>You can also sign in with this email address instead of the code.</p>
<p><a href="${signIn}" style="display:inline-block;background:#DB6A0C;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Sign in</a></p>
<p style="font-size:14px">Forget the password later? Use <a href="${siteUrl()}/practice/forgot">Forgot password</a> on the sign-in page and we email you a link to set a new one.</p>`),
    `Welcome to Pioneer Education. Student code: ${code}. Password: ${password}. Access: ${until}. Sign in: ${signIn}. Forgot it later? ${siteUrl()}/practice/forgot`,
  ).catch((e) => console.error("mail to student", e));
}
