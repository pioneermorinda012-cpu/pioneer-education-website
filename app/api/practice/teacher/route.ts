import { NextRequest, NextResponse } from "next/server";
import {
  listStudents, createStudent, setStudentActive, setStudentPin, supabaseReady,
} from "@/lib/students";
import { recentAttempts, attemptsForStudent } from "@/lib/attempts";
import { getCatalogue } from "@/lib/catalogue";
import { allAccess, cleanAreas, setAccess } from "@/lib/access";
import { paymentsMissing } from "@/lib/razorpay";
import { esc, letter, mailReady, sendMail, siteUrl } from "@/lib/mail";
import { audience, pushReady, sendEach } from "@/lib/push";
import crypto from "node:crypto";
import { hit, peek, visitor, wait } from "@/lib/ratelimit";
import { markWriting, recentWritings, writingById, writingsForStudent, writingsReady } from "@/lib/writings";
import {
  hashPin, signSession, readSession, TEACHER_COOKIE, type Session,
} from "@/lib/session";

export const runtime = "nodejs";

const TEACHER_HOURS = 4;

/* The teacher code opens every student's details, so guessing it is stopped:
 * 10 wrong codes from one device in an hour, or 30 from everywhere together,
 * and sign-in waits out the hour. The owner is emailed the first time either
 * limit is reached, and on every successful teacher sign-in, so a stranger
 * getting in would not go unnoticed. */
const TEACHER_DEVICE = { limit: 10, windowSec: 3600 };
const TEACHER_ALL = { limit: 30, windowSec: 3600 };
/** Shorter than this, the Teacher area shows a warning to change it. */
const TEACHER_CODE_MIN = 12;

function sameCode(a: string, b: string): boolean {
  // compared in constant time, so the answer time gives nothing away
  const x = crypto.createHash("sha256").update(a).digest(), y = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(x, y);
}

async function tellOwner(subject: string, html: string, text: string) {
  const owner = process.env.OWNER_EMAIL ?? "";
  if (!owner || !mailReady()) return;
  await sendMail(owner, subject, letter(subject, html), text).catch((e) => console.error("teacher alert mail", e));
}

function where(req: NextRequest): string {
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const place = [req.headers.get("x-vercel-ip-city"), req.headers.get("x-vercel-ip-country")].filter(Boolean)
    .map((x) => decodeURIComponent(String(x))).join(", ");
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 160);
  return `${ip}${place ? ` (${place})` : ""} — ${ua}`;
}

/* Courses a teacher's notification can go to — the same groups as the student
   list. A student with no modules set opens everything, so is in every group. */
const PUSH_GROUPS = [
  { key: "all", areas: [] as string[] },
  { key: "ielts", areas: ["academic", "gt"] },
  { key: "pte", areas: ["pte"] },
  { key: "english", areas: ["english"] },
  { key: "german", areas: ["german"] },
  { key: "french", areas: ["french"] },
];
function inGroup(areas: string[] | null, group: string): boolean {
  const g = PUSH_GROUPS.find((x) => x.key === group);
  if (!g || g.key === "all" || areas === null) return true;
  return areas.some((a) => g.areas.includes(a));
}

function conf() {
  return {
    secret: process.env.PRACTICE_SESSION_SECRET ?? "",
    teacherCode: process.env.TEACHER_CODE ?? "",
  };
}

async function signedIn(req: NextRequest): Promise<boolean> {
  const { secret } = conf();
  if (!secret) return false;
  const s = await readSession(req.cookies.get(TEACHER_COOKIE)?.value, secret);
  return Boolean(s && s.role === "teacher");
}

/** Is there a teacher session right now, and is the server configured at all? */
export async function GET(req: NextRequest) {
  const { secret, teacherCode } = conf();
  if (!secret || !teacherCode || !supabaseReady()) {
    return NextResponse.json({
      configured: false,
      missing: [
        !secret && "PRACTICE_SESSION_SECRET",
        !teacherCode && "TEACHER_CODE",
        !supabaseReady() && "Supabase settings",
      ].filter(Boolean),
    });
  }
  if (!(await signedIn(req))) return NextResponse.json({ configured: true, authed: false });
  const weakCode = teacherCode.length < TEACHER_CODE_MIN;

  /* ?push=1: are practice reminders set up, and how many students have them on? */
  if (req.nextUrl.searchParams.get("push")) {
    const missing = ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "CRON_SECRET"].filter((k) => !process.env[k]);
    if (!pushReady()) return NextResponse.json({ configured: true, authed: true, ready: false, missing });
    try {
      const { subs, people } = await audience();
      const on = new Set(subs.map((s) => s.student_id));
      const byGroup: Record<string, number> = {};
      for (const g of PUSH_GROUPS) byGroup[g.key] = [...on].filter((id) => inGroup(people.get(id)?.areas ?? null, g.key)).length;
      return NextResponse.json({ configured: true, authed: true, ready: true, missing, devices: subs.length, students: on.size, byGroup });
    } catch (e) {
      return NextResponse.json({ configured: true, authed: true, ready: true, missing, error: String((e as Error).message).slice(0, 200) });
    }
  }

  /* ?check=1: is online payment fully set up? Names only, never the values. */
  if (req.nextUrl.searchParams.get("check")) {
    return NextResponse.json({
      configured: true, authed: true,
      missing: paymentsMissing(),
      mail: mailReady(),
      mailFrom: process.env.MAIL_FROM ?? "",
      owner: process.env.OWNER_EMAIL ?? "",
      site: siteUrl(),
      keyMode: (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_live_") ? "live"
        : (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_") ? "test" : "",
    });
  }

  /* Writing to check: ?writings=1 is the list, ?writing=<id> one paper in full. */
  const one = req.nextUrl.searchParams.get("writing");
  if (one || req.nextUrl.searchParams.get("writings")) {
    if (!writingsReady()) return NextResponse.json({ configured: true, authed: true, writings: [], error: "Database not set up." });
    try {
      if (one) {
        const writing = await writingById(one);
        return NextResponse.json({ configured: true, authed: true, writing });
      }
      return NextResponse.json({ configured: true, authed: true, writings: await recentWritings() });
    } catch (e) {
      const msg = String((e as Error).message);
      return NextResponse.json({
        configured: true, authed: true, writings: [], writing: null,
        error: /writings/.test(msg) && /exist|relation|schema/i.test(msg)
          ? "The writings table is missing — run supabase/2026-10-writing-marking.sql in Supabase."
          : msg.slice(0, 200),
      });
    }
  }

  // ?student=<id> returns one student's full history; otherwise the overview.
  const who = req.nextUrl.searchParams.get("student");
  try {
    if (who) {
      const [students, attempts, catalogue, writings] = await Promise.all([
        listStudents(), attemptsForStudent(who), getCatalogue(),
        writingsReady() ? writingsForStudent(who).catch(() => []) : Promise.resolve([]),
      ]);
      const student = students.find((s) => s.id === who) ?? null;
      const names: Record<string, string> = {};
      for (const c of catalogue) names[c.id] = c.name;
      return NextResponse.json({ configured: true, authed: true, student, attempts, names, writings });
    }
    const [students, attempts, catalogue, access, writingRows] = await Promise.all([
      listStudents(), recentAttempts(), getCatalogue(), allAccess().catch(() => ({})),
      writingsReady() ? recentWritings(500).catch(() => []) : Promise.resolve([]),
    ]);
    const names: Record<string, string> = {};
    for (const c of catalogue) names[c.id] = c.name;
    // just the bands, for the Writing column of the students list — not the text
    const wbands = writingRows.map((w) => ({
      student_id: w.student_id, kind: w.kind, status: w.status, submitted_at: w.submitted_at,
      teacher_band: w.teacher_band, auto_band: w.auto_band,
    }));
    // modules per student, and the end date of any bought online
    const accessMap: Record<string, string[]> = {}, untilMap: Record<string, Record<string, string>> = {};
    for (const [id, row] of Object.entries(access)) {
      accessMap[id] = row.access;
      if (Object.keys(row.until).length) untilMap[id] = row.until as Record<string, string>;
    }
    return NextResponse.json({
      configured: true, authed: true, students, attempts, names, wbands,
      access: accessMap, until: untilMap, weakCode,
    });
  } catch (e) {
    return NextResponse.json(
      { configured: true, authed: true, students: [], attempts: [], names: {},
        error: String((e as Error).message) },
      { status: 200 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { secret, teacherCode } = conf();
  if (!secret || !teacherCode) {
    return NextResponse.json({ error: "The teacher area is not configured yet." }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request." }, { status: 400 }); }
  const action = String(body.action ?? "");

  /* ---- sign in ---- */
  if (action === "login") {
    const given = String(body.teacherCode ?? "");
    const deviceKey = "teacher-ip:" + visitor(req);
    const [dev, all] = await Promise.all([
      peek(deviceKey, TEACHER_DEVICE.windowSec, TEACHER_DEVICE.limit),
      peek("teacher-all", TEACHER_ALL.windowSec, TEACHER_ALL.limit),
    ]);
    if (!dev.allowed || !all.allowed) {
      const after = Math.max(dev.retryAfterSec, all.retryAfterSec);
      return NextResponse.json({ error: `Too many wrong codes. Teacher sign-in is paused for ${wait(after)}.` },
        { status: 429, headers: { "Retry-After": String(after) } });
    }
    if (!sameCode(given, teacherCode)) {
      const [d, a] = await Promise.all([
        hit(deviceKey, TEACHER_DEVICE.windowSec, TEACHER_DEVICE.limit),
        hit("teacher-all", TEACHER_ALL.windowSec, TEACHER_ALL.limit),
      ]);
      if (d.first || a.first) {
        const who = where(req);
        await tellOwner("Warning: many wrong teacher codes on pioneermorinda.com",
          `<p>Someone has typed the wrong Teacher-area code ${d.first ? `${d.count} times from one device` : `${a.count} times in the last hour`}. Teacher sign-in is now paused for an hour.</p>
<p>Last attempt from: <b>${esc(who)}</b></p>
<p>If this was not you or your staff, change <b>TEACHER_CODE</b> in Vercel (Settings → Environment Variables) to a new code of at least ${TEACHER_CODE_MIN} characters, then redeploy.</p>`,
          `Many wrong teacher codes on pioneermorinda.com. Last from ${who}. If not you, change TEACHER_CODE in Vercel.`);
      }
      return NextResponse.json({ error: "That code is not right." }, { status: 401 });
    }
    {
      const who = where(req);
      const when = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
      await tellOwner("Teacher area sign-in on pioneermorinda.com",
        `<p>Someone signed in to the Teacher area at <b>${esc(when)}</b>.</p><p>From: <b>${esc(who)}</b></p>
<p>If this was you or your staff, there is nothing to do. If not, change <b>TEACHER_CODE</b> in Vercel straight away and redeploy.</p>`,
        `Teacher area sign-in at ${when} from ${who}. If not you, change TEACHER_CODE in Vercel.`);
    }
    const session: Session = {
      sid: "teacher", code: "TEACHER", name: "Teacher", role: "teacher",
      exp: Date.now() + TEACHER_HOURS * 60 * 60 * 1000,
    };
    const res = NextResponse.json({ ok: true });
    res.cookies.set(TEACHER_COOKIE, await signSession(session, secret), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TEACHER_HOURS * 60 * 60,
    });
    return res;
  }

  /* everything below needs a teacher session */
  if (!(await signedIn(req))) {
    return NextResponse.json({ error: "Sign in to the teacher area first." }, { status: 401 });
  }

  try {
    if (action === "create") {
      const code = String(body.code ?? "").trim().toUpperCase();
      const name = String(body.full_name ?? "").trim();
      const pin = String(body.pin ?? "").trim();
      if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
        return NextResponse.json({ error: "Code: letters, numbers and dashes, 3–20 characters." }, { status: 400 });
      }
      if (!name) return NextResponse.json({ error: "Enter the student's name." }, { status: 400 });
      if (!/^\d{4,8}$/.test(pin)) {
        return NextResponse.json({ error: "PIN must be 4 to 8 digits." }, { status: 400 });
      }
      const access = cleanAreas(body.access);
      if (!access.length) {
        return NextResponse.json({ error: "Tick at least one module this login opens." }, { status: 400 });
      }
      const student = await createStudent({
        code, full_name: name, pin_hash: await hashPin(pin),
        batch: String(body.batch ?? ""),
        track: access.includes("gt") && !access.includes("academic") ? "gt" : "academic",
      });
      let warning: string | undefined;
      try { await setAccess(student.id, access); }
      catch (e) { warning = "Student added, but the modules could not be saved: " + String((e as Error).message).slice(0, 120); }
      return NextResponse.json({ ok: true, student, warning });
    }

    if (action === "access") {
      const access = cleanAreas(body.access);
      if (!access.length) {
        return NextResponse.json({ error: "Tick at least one module." }, { status: 400 });
      }
      // `clear`: modules whose online end date the teacher removed
      await setAccess(String(body.id ?? ""), access, cleanAreas(body.clear));
      return NextResponse.json({ ok: true, access });
    }

    if (action === "push") {
      // the teacher's own notification, to everyone or to one course
      if (!pushReady()) return NextResponse.json({ error: "Practice reminders are not set up yet (VAPID keys missing in Vercel)." }, { status: 503 });
      const title = String(body.title ?? "").trim().slice(0, 80);
      const text = String(body.body ?? "").trim().slice(0, 240);
      const group = PUSH_GROUPS.some((g) => g.key === body.group) ? String(body.group) : "all";
      let url = String(body.url ?? "").trim();
      if (!title || !text) return NextResponse.json({ error: "Write a title and a message." }, { status: 400 });
      // only pages on this site — a notification must never send a student elsewhere
      if (url && !/^\/(?!\/)[\w\-./?=&%#]*$/.test(url)) {
        return NextResponse.json({ error: "The link must be a page on this site, starting with /, e.g. /practice/english" }, { status: 400 });
      }
      const { subs, people } = await audience();
      const result = await sendEach(subs, (id) => {
        const p = people.get(id);
        if (!p || !inGroup(p.areas, group)) return null;
        return { title, body: text, url: url || p.home, tag: "pioneer-teacher-" + Date.now() };
      });
      return NextResponse.json({ ok: true, ...result });
    }

    if (action === "testMail") {
      // the exact answer from Resend, so a domain that is not verified shows as such
      const to = String(body.to ?? process.env.OWNER_EMAIL ?? "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return NextResponse.json({ error: "Enter an email address to send the test to." }, { status: 400 });
      }
      try {
        await sendMail(to, "Test email from pioneermorinda.com",
          letter("Test email", "<p>If you can read this, the website can send email — student logins will arrive.</p>"),
          "If you can read this, the website can send email.");
        return NextResponse.json({ ok: true, to });
      } catch (e) {
        return NextResponse.json({ ok: false, error: String((e as Error).message).slice(0, 300) });
      }
    }

    if (action === "markWriting") {
      const c = (body.criteria ?? null) as Record<string, unknown> | null;
      await markWriting(String(body.id ?? ""), {
        marks: body.marks,
        teacher_band: body.teacher_band,
        criteria: c ? { ta: c.ta as number, cc: c.cc as number, lr: c.lr as number, gra: c.gra as number } : null,
        teacher_note: String(body.teacher_note ?? ""),
        done: Boolean(body.done),
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "active") {
      await setStudentActive(String(body.id ?? ""), Boolean(body.active));
      return NextResponse.json({ ok: true });
    }

    if (action === "resetPin") {
      const pin = String(body.pin ?? "").trim();
      if (!/^\d{4,8}$/.test(pin)) {
        return NextResponse.json({ error: "PIN must be 4 to 8 digits." }, { status: 400 });
      }
      await setStudentPin(String(body.id ?? ""), await hashPin(pin));
      return NextResponse.json({ ok: true });
    }
  } catch (e) {
    const msg = String((e as Error).message);
    if (msg.includes("duplicate") || msg.includes("23505")) {
      return NextResponse.json({ error: "That student code is already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: msg.slice(0, 200) }, { status: 500 });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
