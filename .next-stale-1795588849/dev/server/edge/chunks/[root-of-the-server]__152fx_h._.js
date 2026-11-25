(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push(["chunks/[root-of-the-server]__152fx_h._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/lib/session.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "COOKIE",
    ()=>COOKIE,
    "SESSION_HOURS",
    ()=>SESSION_HOURS,
    "TEACHER_COOKIE",
    ()=>TEACHER_COOKIE,
    "hashPin",
    ()=>hashPin,
    "readSession",
    ()=>readSession,
    "signSession",
    ()=>signSession,
    "verifyPin",
    ()=>verifyPin
]);
/* Sessions and PIN hashing.
 *
 * Deliberately built on the Web Crypto API only — no npm packages. That keeps
 * the dependency list short and, more importantly, lets this same file run in
 * middleware (the Edge runtime) and in ordinary route handlers without two
 * different implementations drifting apart.
 */ const enc = new TextEncoder();
const dec = new TextDecoder();
/* ---------- base64url, without Buffer so it works in both runtimes ---------- */ function toB64url(bytes) {
    let s = "";
    for(let i = 0; i < bytes.length; i++)s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
/* Backed by a plain ArrayBuffer on purpose: TypeScript 5.7 distinguishes
 * Uint8Array<ArrayBuffer> from Uint8Array<ArrayBufferLike>, and only the
 * former satisfies BufferSource in the Web Crypto signatures. */ function fromB64url(s) {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
    const bin = atob(b64);
    const out = new Uint8Array(new ArrayBuffer(bin.length));
    for(let i = 0; i < bin.length; i++)out[i] = bin.charCodeAt(i);
    return out;
}
/* Compare without leaking how much of the string matched. */ function sameString(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for(let i = 0; i < a.length; i++)diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}
/* ---------- the signed cookie ---------- */ async function hmacKey(secret) {
    return crypto.subtle.importKey("raw", enc.encode(secret), {
        name: "HMAC",
        hash: "SHA-256"
    }, false, [
        "sign",
        "verify"
    ]);
}
async function signSession(payload, secret) {
    const body = toB64url(enc.encode(JSON.stringify(payload)));
    const sig = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body)));
    return body + "." + toB64url(sig);
}
async function readSession(token, secret) {
    if (!token) return null;
    const dot = token.lastIndexOf(".");
    if (dot < 1) return null;
    const body = token.slice(0, dot), sig = token.slice(dot + 1);
    let ok = false;
    try {
        ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64url(sig), enc.encode(body));
    } catch  {
        return null;
    }
    if (!ok) return null;
    try {
        const payload = JSON.parse(dec.decode(fromB64url(body)));
        if (!payload.exp || payload.exp < Date.now()) return null;
        return payload;
    } catch  {
        return null;
    }
}
/* ---------- PINs ---------- */ const ITERATIONS = 150_000;
async function derive(pin, salt, iterations) {
    const base = await crypto.subtle.importKey("raw", enc.encode(pin), "PBKDF2", false, [
        "deriveBits"
    ]);
    const bits = await crypto.subtle.deriveBits({
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256"
    }, base, 256);
    return new Uint8Array(bits);
}
async function hashPin(pin) {
    const salt = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(16)));
    const bits = await derive(pin, salt, ITERATIONS);
    return `pbkdf2$${ITERATIONS}$${toB64url(salt)}$${toB64url(bits)}`;
}
async function verifyPin(pin, stored) {
    const parts = String(stored || "").split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
    const iterations = Number(parts[1]);
    if (!Number.isFinite(iterations) || iterations < 1000) return false;
    try {
        const bits = await derive(pin, fromB64url(parts[2]), iterations);
        return sameString(toB64url(bits), parts[3]);
    } catch  {
        return false;
    }
}
const COOKIE = "pec_session";
const TEACHER_COOKIE = "pec_teacher";
const SESSION_HOURS = 8;
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/spec-extension/response.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/session.ts [middleware-edge] (ecmascript)");
;
;
async function middleware(req) {
    const { pathname } = req.nextUrl;
    if (pathname === "/practice/sign-in" || pathname.startsWith("/practice/teacher")) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    const secret = process.env.PRACTICE_SESSION_SECRET;
    if (secret) {
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["readSession"])(req.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["COOKIE"])?.value, secret);
        if (session) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
        // A signed-in teacher gets through too, so a student's marked paper can be
        // opened from the dashboard. The page itself still checks who is asking.
        const teacher = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["readSession"])(req.cookies.get(__TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$session$2e$ts__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["TEACHER_COOKIE"])?.value, secret);
        if (teacher && teacher.role === "teacher") return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    }
    // An API call should get an error it can act on, not a redirect to HTML.
    if (pathname.startsWith("/api/")) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Please sign in again."
        }, {
            status: 401
        });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/practice/sign-in";
    url.search = "";
    url.searchParams.set("next", pathname + (req.nextUrl.search || ""));
    // Tell the browser and the router not to keep this answer. It is only true
    // while the student is signed out, and a cached copy would send them back to
    // the sign-in page moments after they successfully signed in.
    const res = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$spec$2d$extension$2f$response$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(url);
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
}
const config = {
    matcher: [
        "/practice",
        "/practice/:path*",
        "/api/practice/submit"
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__152fx_h._.js.map