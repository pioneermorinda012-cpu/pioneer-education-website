/* SERVER ONLY. Sends email through Resend (resend.com) over its HTTP API —
 * no npm package needed.
 *
 *   RESEND_API_KEY   from resend.com → API Keys
 *   MAIL_FROM        e.g. "Pioneer Education <noreply@pioneermorinda.com>";
 *                    the domain must be verified in Resend first
 *   OWNER_EMAIL      optional — gets a copy of every new online enrolment
 */

export function mailReady(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

export async function sendMail(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!mailReady()) throw new Error("Email is not configured (RESEND_API_KEY / MAIL_FROM)");
  const res = await fetch(`${process.env.RESEND_API_BASE || "https://api.resend.com"}/emails`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject, html, text }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

/** The address emails link back to, e.g. https://pioneermorinda.com */
export function siteUrl(): string {
  return (process.env.SITE_URL || "https://pioneermorinda.com").replace(/\/+$/, "");
}

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** One plain, readable layout for every email the site sends. */
export function letter(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f4f1ea;font-family:Segoe UI,Arial,sans-serif;color:#1c2430">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#111;color:#fff;border-radius:12px 12px 0 0;padding:16px 20px;font-weight:700">Pioneer Education · Morinda</div>
<div style="background:#fff;border-radius:0 0 12px 12px;padding:22px 20px;line-height:1.6">
<h1 style="font-size:20px;margin:0 0 14px">${title}</h1>${bodyHtml}
<p style="color:#5a6272;font-size:13px;margin-top:24px">Questions? WhatsApp us on +91 73802 61308.</p>
</div></div></body></html>`;
}
