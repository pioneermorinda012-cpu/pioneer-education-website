# Online payments and automatic student logins — setup

What it does: on a course page the student taps **See Pricing**, picks
1 month or 3 months (and A1/A2/B1 for German), and taps **Pay now** on a plan.
They type their name, email and mobile number, and the website asks Razorpay
for a payment link for exactly that plan at exactly the price in
`app/data/courses.ts`. After they pay, Razorpay calls the website, which:

- makes the student's login (student code + password) and emails it, or —
  if that email already has a login — adds the time to it;
- opens only the course that was paid for (IELTS → Academic + GT,
  PTE → PTE, Spoken English → English, German → German);
- closes it again when the 1 or 3 months are over. Renewing before the end
  adds the months on after the current end date.

You get an email (and the optional WhatsApp ping) for every payment.
**No payment links need to be made in Razorpay** — and none are needed when
a price changes: edit the price in `app/data/courses.ts` and redeploy.

Until every setting below is in place, the course pages show
"Ask on WhatsApp" instead of "Pay now", so nobody can pay without getting a login.

## 1. Database (once)
Supabase → SQL editor → paste and run `supabase/2026-10-online-payments.sql`.
(It adds the email, phone and payment id columns. Safe to run again.)

## 2. Email (Resend, free tier)
1. Sign up at resend.com → Domains → add `pioneermorinda.com` → add the DNS
   records it shows → wait until it says *Verified*.
2. API Keys → create one.

## 3. Razorpay
1. Settings → API Keys → Generate Key (Live mode). Copy the **Key ID**
   (starts `rzp_live_`) and the **Key Secret** (shown only once).
2. Settings → Webhooks → Add new webhook (or edit the existing one):
   - URL: `https://pioneermorinda.com/api/razorpay/webhook`
   - Secret: any long random text (save it for step 4)
   - Events: `payment_link.paid`. If `payment.captured` is ticked too, that
     is fine — it is not used to make logins.
3. Deactivate any old Payment Pages / Payment Links you no longer sell (for
   example the old ₹999 Spoken English page). A payment made through one is
   not matched to a plan: the site makes no login and emails you to do it by hand.

## 4. Vercel → Project → Settings → Environment Variables
| Name | Value |
|---|---|
| `RAZORPAY_KEY_ID` | Key ID from step 3.1 |
| `RAZORPAY_KEY_SECRET` | Key Secret from step 3.1 |
| `RAZORPAY_WEBHOOK_SECRET` | the secret from step 3.2 |
| `RESEND_API_KEY` | from step 2 |
| `MAIL_FROM` | `Pioneer Education <noreply@pioneermorinda.com>` |
| `OWNER_EMAIL` | your email, for a copy of each payment |
| `SITE_URL` | `https://pioneermorinda.com` |

Then Deployments → Redeploy (settings only take effect after a redeploy).

## 5. Test once with a real ₹ payment
Buy the cheapest plan yourself with an email that has no login yet. Within a
minute you should get the login email; in the teacher area → Students the new
student shows e.g. "PTE (until 23 Nov 2026)". Refund it from Razorpay after.

## Prices and videos
Prices live in `app/data/courses.ts`:

```ts
plans: plans([1499, 3499, 6999], [3499, 8999, 17999]),
//            1 month                3 months
//            [self-study, group, 1-to-1]
```

`null` shows "Fee on request"; `"soon"` shows "Coming soon". Neither can be
bought online. German has one line per level. Videos:
`demoVideo: "https://youtu.be/…"`, `explainVideo: "https://youtu.be/…"`.

## Notes
- Razorpay may send one payment twice; each payment id is counted once.
- Logins made by the teacher have no end date unless they were bought online.
  In Students → Modules an end date shows next to the module; tap it to
  remove the limit.
- A student whose access has ended can still sign in: they see what ended and
  a Renew button. Their results and writing are kept.
- Students who joined at the centre (no email) still sign in with code + PIN.
