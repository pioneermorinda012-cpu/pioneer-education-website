import { NextRequest, NextResponse } from "next/server";
import {
  listStudents, createStudent, setStudentActive, setStudentPin, supabaseReady,
} from "@/lib/students";
import {
  hashPin, signSession, readSession, TEACHER_COOKIE, type Session,
} from "@/lib/session";

export const runtime = "nodejs";

const TEACHER_HOURS = 4;

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
  try {
    return NextResponse.json({ configured: true, authed: true, students: await listStudents() });
  } catch (e) {
    return NextResponse.json(
      { configured: true, authed: true, students: [], error: String((e as Error).message) },
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
    if (given !== teacherCode) {
      return NextResponse.json({ error: "That code is not right." }, { status: 401 });
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
      const student = await createStudent({
        code, full_name: name, pin_hash: await hashPin(pin),
        batch: String(body.batch ?? ""),
        track: body.track === "gt" ? "gt" : "academic",
      });
      return NextResponse.json({ ok: true, student });
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
