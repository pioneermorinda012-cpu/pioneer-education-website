// ═══════════════════════════════════════════════════════════════════
// TERMS OF USE — pioneermorinda.com/terms
// ═══════════════════════════════════════════════════════════════════
//
// ⚠️  THIS IS THE DOCUMENT THAT PROTECTS THE CENTRE.
// The privacy policy tells students what happens to their data. This
// one tells them what they are buying, and it is the page you point at
// when there is a disagreement at the desk:
//
//   · refunds — the single most common argument over paid content
//   · the device limit — a student sharing a login needs to have been
//     told the rule BEFORE they hit it, or the block looks arbitrary
//   · what happens when a plan expires
//   · that access is personal and not transferable
//
// Written plainly rather than in legal English. Most students here read
// English as a second language, and a term nobody understood is a term
// that will not help you when it matters.
//
// ⚠️  THIS IS NOT LEGAL ADVICE. It is a reasonable, honest starting
// point drafted for a small coaching centre. If Pioneer Education grows
// or starts taking online payments, have a lawyer review it.
// ═══════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';

const CONTACT_EMAIL = 'pioneermorinda012@gmail.com';
const CONTACT_PHONE = '+91 73802 61308';
const LAST_UPDATED = '13 August 2026';
const DEVICE_LIMIT = 3;

export const metadata: Metadata = {
  title: 'Terms of Use — Lexio | Pioneer Education Center',
  description:
    'Terms for using the Lexio app: plans, access codes, refunds, device limits and account rules. Pioneer Education Center, Morinda, Punjab.',
};

const s = {
  page: { maxWidth: 760, margin: '0 auto', padding: '48px 20px 96px', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', color: '#39414D', lineHeight: 1.7 },
  h1: { fontSize: 34, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#12161C', margin: '0 0 8px' },
  meta: { fontSize: 14, color: '#8E939B', margin: '0 0 40px' },
  h2: { fontSize: 21, lineHeight: 1.3, letterSpacing: '-0.01em', color: '#12161C', margin: '40px 0 12px' },
  p: { fontSize: 16, margin: '0 0 16px' },
  ul: { fontSize: 16, margin: '0 0 16px', paddingLeft: 22 },
  li: { margin: '0 0 8px' },
  callout: { background: '#F7F8FA', border: '1px solid #E6E8EC', borderLeft: '3px solid #E8A33D', borderRadius: 10, padding: '16px 20px', margin: '0 0 24px' },
  strong: { color: '#12161C', fontWeight: 600 },
  footer: { marginTop: 56, paddingTop: 24, borderTop: '1px solid #E6E8EC', fontSize: 14, color: '#8E939B' },
} as const;

export default function TermsPage() {
  return (
    <main style={s.page}>
      <h1 style={s.h1}>Terms of Use</h1>
      <p style={s.meta}>Lexio · Pioneer Education Center, Prem Nagar, Morinda, Punjab · Last updated {LAST_UPDATED}</p>

      <div style={s.callout}>
        <p style={{ ...s.p, margin: 0 }}>
          <strong style={s.strong}>In short.</strong> Lexio is the learning app of Pioneer Education Center.
          Some lessons are free. Paid plans are unlocked with a code you receive from the centre after paying
          your fee. Your account is for you alone and works on up to {DEVICE_LIMIT} devices. Using the app
          means you accept the terms below.
        </p>
      </div>

      <h2 style={s.h2}>1. Who we are</h2>
      <p style={s.p}>
        Lexio is operated by Pioneer Education Center, Prem Nagar, Morinda, Punjab 140101, India.
        You can reach us at {CONTACT_EMAIL} or {CONTACT_PHONE}.
      </p>

      <h2 style={s.h2}>2. Your account</h2>
      <ul style={s.ul}>
        <li style={s.li}>You need an account to use Lexio. Give accurate details so we can help you if something goes wrong.</li>
        <li style={s.li}>Keep your password private. You are responsible for what happens on your account.</li>
        <li style={s.li}>
          <strong style={s.strong}>Your account is personal.</strong> Do not share your login with anyone else,
          including classmates. Paid access is sold to one student, not to a group.
        </li>
        <li style={s.li}>If you are under 18, please use Lexio with a parent or guardian&apos;s knowledge.</li>
      </ul>

      <h2 style={s.h2}>3. Device limit</h2>
      <p style={s.p}>
        Your account works on up to <strong style={s.strong}>{DEVICE_LIMIT} devices</strong>. This is enough for
        a phone and a tablet, and it stops one paid account being shared across a whole class.
      </p>
      <p style={s.p}>
        If you change your phone and reach the limit, ask at the centre and we will reset it for you at no
        charge. A device you have not used for 45 days frees its place automatically.
      </p>

      <h2 style={s.h2}>4. Free and paid access</h2>
      <ul style={s.ul}>
        <li style={s.li}>A number of lessons in each course are free, along with daily practice, vocabulary and quizzes.</li>
        <li style={s.li}><strong style={s.strong}>Pro</strong> unlocks every lesson in one course.</li>
        <li style={s.li}><strong style={s.strong}>Pro Ultra</strong> adds the centre&apos;s own course modules, class videos and exercises.</li>
        <li style={s.li}>
          A plan applies to <strong style={s.strong}>one course only</strong>. A plan bought for IELTS does not
          unlock German, and vice versa.
        </li>
      </ul>

      <h2 style={s.h2}>5. Payment and access codes</h2>
      <p style={s.p}>
        There is no payment inside the app. You pay your fee at Pioneer Education Center and receive an access
        code, which you enter in the app to unlock your plan.
      </p>
      <ul style={s.ul}>
        <li style={s.li}>Each code works once, for one account.</li>
        <li style={s.li}>Codes are not transferable and cannot be exchanged for cash.</li>
        <li style={s.li}>Treat a code like cash: if you lose it before redeeming it, tell us as soon as possible.</li>
        <li style={s.li}>
          Renewing the same plan adds to the time you already have. Upgrading to a higher plan, or switching to
          a different course, starts a new period from the day you redeem the code.
        </li>
      </ul>

      <h2 style={s.h2}>6. Refunds</h2>
      <p style={s.p}>
        If something is wrong, speak to us first — most problems are fixed the same day.
      </p>
      <ul style={s.ul}>
        <li style={s.li}>
          <strong style={s.strong}>Within 7 days</strong> of redeeming a code, if you have completed no more than
          two lessons of the paid content, we will refund your fee in full on request.
        </li>
        <li style={s.li}>
          After that, we do not refund unused time, because the fee covers a place on a course rather than a
          number of days.
        </li>
        <li style={s.li}>
          If the app is unusable for an extended period because of a fault on our side, we will extend your plan
          by at least the time lost.
        </li>
        <li style={s.li}>We do not refund accounts closed for sharing a login or other misuse.</li>
      </ul>

      <h2 style={s.h2}>7. When a plan ends</h2>
      <p style={s.p}>
        Paid lessons lock again when your plan expires. Nothing is deleted: your progress, streak and XP are
        kept, and renewing restores access exactly where you left off. Free lessons remain free.
      </p>

      <h2 style={s.h2}>8. Using Lexio properly</h2>
      <p style={s.p}>Please do not:</p>
      <ul style={s.ul}>
        <li style={s.li}>Share, sell or publish our lessons, videos or exercises. This material is the centre&apos;s work and is provided for your personal study.</li>
        <li style={s.li}>Record, copy or redistribute Pro Ultra modules.</li>
        <li style={s.li}>Attempt to unlock paid content without paying, or help anyone else do so.</li>
        <li style={s.li}>Use the app to send anything abusive, or to disrupt other students.</li>
      </ul>
      <p style={s.p}>
        We may suspend or close an account that breaks these rules. Where it is fair to do so, we will contact
        you first.
      </p>

      <h2 style={s.h2}>9. Speaking practice and automatic feedback</h2>
      <p style={s.p}>
        Speaking scores and quiz feedback in Lexio are practice guidance produced automatically. They are
        <strong style={s.strong}> not</strong> an IELTS, PTE or Goethe band score, and they do not predict your
        result in a real examination. Only the official examining body can give you that.
      </p>

      <h2 style={s.h2}>10. Availability</h2>
      <p style={s.p}>
        We aim to keep Lexio running, but we cannot promise it will never be unavailable. Lessons, content and
        features may change or be withdrawn as courses are updated.
      </p>

      <h2 style={s.h2}>11. Deleting your account</h2>
      <p style={s.p}>
        You can delete your account at any time from Profile in the app, or at{' '}
        <a href="/delete-account" style={{ color: '#A6690F' }}>pioneermorinda.com/delete-account</a>.
        Deletion is permanent and removes your progress. Any unused paid time is lost, so redeem or transfer
        before deleting.
      </p>

      <h2 style={s.h2}>12. Changes to these terms</h2>
      <p style={s.p}>
        We may update these terms. The date at the top shows when they last changed. Continuing to use Lexio
        after a change means you accept the updated terms.
      </p>

      <h2 style={s.h2}>13. Law</h2>
      <p style={s.p}>
        These terms are governed by the laws of India, and the courts of Punjab have jurisdiction over any
        dispute.
      </p>

      <h2 style={s.h2}>14. Contact</h2>
      <p style={s.p}>
        Pioneer Education Center, Prem Nagar, Morinda, Punjab 140101<br />
        {CONTACT_EMAIL} · {CONTACT_PHONE}
      </p>

      <p style={s.footer}>
        See also our <a href="/privacy" style={{ color: '#A6690F' }}>Privacy Policy</a>.
      </p>
    </main>
  );
}
