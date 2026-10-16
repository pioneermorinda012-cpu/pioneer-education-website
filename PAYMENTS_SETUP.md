# Online payments and automatic student logins — setup

What it does: on a course page the fees stay hidden until the student taps
**See Pricing**. Each plan then shows **Pay now**, which opens your Razorpay
payment link. When Razorpay confirms the payment it calls the website, which
creates the student's login (student code + password) and emails it to them.
You get Razorpay's own payment alert (and, optionally, an email copy).
Students can reset a forgotten password themselves from the sign-in page.

## 1. Database (once)
Supabase → SQL editor → paste and run `supabase/2026-10-online-payments.sql`.

## 2. Email (Resend, free tier)
1. Sign up at resend.com → Domains → add `pioneermorinda.com` → add the DNS
   records it shows in Cloudflare → wait until it says *Verified*.
2. API Keys → create one.

## 3. Razorpay
1. For each plan, create a Payment Link (or reuse yours). Under
   *Redirect after payment*, use `https://pioneermorinda.com/payment/thank-you`.
   Make sure the link asks for the customer's **email**.
2. Settings → Webhooks → Add new webhook:
   - URL: `https://pioneermorinda.com/api/razorpay/webhook`
   - Secret: any long random text (save it for step 4)
   - Events: `payment_link.paid` (add `payment.captured` only if you use Payment Pages)

## 4. Vercel → Project → Settings → Environment Variables
| Name | Value |
|---|---|
| `RAZORPAY_WEBHOOK_SECRET` | the secret from step 3 |
| `RESEND_API_KEY` | from step 2 |
| `MAIL_FROM` | `Pioneer Education <noreply@pioneermorinda.com>` |
| `OWNER_EMAIL` | optional — your email, for a copy of each enrolment |
| `SITE_URL` | `https://pioneermorinda.com` |

Then Deployments → Redeploy.

## 5. Put the links and videos on a course
In `app/data/courses.ts`, on the course:

```ts
plans: withLinks(standardPlans(999, 2499, 4999),
  "https://rzp.io/rzp/SELFSTUDY", "https://rzp.io/rzp/GROUP", "https://rzp.io/rzp/ONETOONE"),
demoVideo: "https://youtu.be/XXXXXXXXXXX",
explainVideo: "https://youtu.be/YYYYYYYYYYY",
```

Order is self-study, group, 1-to-1; use `null` for a plan without a link.
YouTube links play on the page; any other link opens in a new tab.

## Notes
- A payment whose email already has a login keeps the old login (renewal or a
  second course) — the student gets a "payment received" email instead.
- Razorpay may send one payment twice; the payment id is stored, so it never
  makes two logins.
- Students who joined at the centre (no email) still sign in with code + PIN;
  reset theirs from the teacher page as before.
