// ═══════════════════════════════════════════════════════════════════
// PRIVACY POLICY — pioneermorinda.com/privacy
// ═══════════════════════════════════════════════════════════════════
//
// Drop this into your Next.js site at:  app/privacy/page.tsx
//
// Google Play REJECTS any app that collects user data without a public
// privacy policy at a working URL. The Lexio app already links here, so
// this must be live before you submit.
//
// Styles are inline on purpose — that way the page renders correctly
// whether or not your site uses Tailwind, and you can paste it in
// without touching your existing CSS setup.
//
// ⚠️  BEFORE PUBLISHING: replace CONTACT_EMAIL below with the address you
// actually monitor. Deletion requests will arrive there.
// ═══════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';

const CONTACT_EMAIL = 'pioneermorinda012@gmail.com';
const LAST_UPDATED = '7 August 2026';

export const metadata: Metadata = {
  title: 'Privacy Policy — Lexio | Pioneer Education Center',
  description:
    'How the Lexio app collects, uses and protects student data. Pioneer Education Center, Prem Nagar, Morinda, Punjab.',
};

const s = {
  page: { maxWidth: 760, margin: '0 auto', padding: '48px 20px 96px', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', color: '#39414D', lineHeight: 1.7 },
  h1: { fontSize: 34, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#12161C', margin: '0 0 8px' },
  meta: { fontSize: 14, color: '#8E939B', margin: '0 0 40px' },
  h2: { fontSize: 21, lineHeight: 1.3, letterSpacing: '-0.01em', color: '#12161C', margin: '40px 0 12px' },
  p: { fontSize: 16, margin: '0 0 16px' },
  ul: { fontSize: 16, margin: '0 0 16px', paddingLeft: 22 },
  li: { margin: '0 0 8px' },
  callout: { background: '#F7F8FA', border: '1px solid #E6E8EC', borderLeft: '3px solid #4F46E5', borderRadius: 10, padding: '16px 20px', margin: '0 0 24px' },
  strong: { color: '#12161C', fontWeight: 600 },
  footer: { marginTop: 56, paddingTop: 24, borderTop: '1px solid #E6E8EC', fontSize: 14, color: '#8E939B' },
  a: { color: '#4F46E5' },
} as const;

export default function PrivacyPolicy() {
  return (
    <main style={s.page}>
      <h1 style={s.h1}>Privacy Policy</h1>
      <p style={s.meta}>Lexio app · Last updated {LAST_UPDATED}</p>

      <p style={s.p}>
        Lexio is an English and German learning app operated by{' '}
        <strong style={s.strong}>Pioneer Education Center</strong>, Prem Nagar,
        Morinda, Punjab, India.
      </p>
      <p style={s.p}>
        This page explains what information we collect, why we collect it, and
        what you can do about it.
      </p>

      <h2 style={s.h2}>Information we collect</h2>
      <p style={s.p}>When you create an account, we ask for:</p>
      <ul style={s.ul}>
        <li style={s.li}><strong style={s.strong}>Your name</strong> — so your teacher knows who you are</li>
        <li style={s.li}><strong style={s.strong}>Your email address</strong> — to sign you in and recover your password</li>
        <li style={s.li}><strong style={s.strong}>Your phone number</strong> — so your teacher can contact you about your course</li>
      </ul>
      <p style={s.p}>As you use the app, we store:</p>
      <ul style={s.ul}>
        <li style={s.li}>Your learning progress — lessons completed, quiz scores, XP and streak</li>
        <li style={s.li}>Your placement test result and chosen course</li>
        <li style={s.li}>Your speaking practice attempts — the text of what you said, and your practice scores</li>
      </ul>
      <p style={s.p}>
        We do <strong style={s.strong}>not</strong> collect your location,
        contacts, photos, or any other data from your device.
      </p>

      <h2 style={s.h2}>Microphone and speaking practice</h2>
      <div style={s.callout}>
        <p style={{ ...s.p, margin: 0 }}>
          <strong style={s.strong}>We do not record or store audio.</strong> Your
          speech is converted to text on your device using your phone&apos;s
          built-in speech recognition. Only the resulting text is saved, so you
          and your teacher can review your practice history.
        </p>
      </div>
      <p style={s.p}>
        The microphone is only active while you are on a speaking exercise and
        have pressed the record button.
      </p>
      <p style={s.p}>
        Speech recognition is provided by Google and is subject to{' '}
        <a style={s.a} href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google&apos;s privacy policy
        </a>.
      </p>

      <h2 style={s.h2}>How we use your information</h2>
      <ul style={s.ul}>
        <li style={s.li}>To give you access to your course and track your progress</li>
        <li style={s.li}>So your teacher at Pioneer Education Center can see how you are getting on</li>
        <li style={s.li}>To give you feedback on your speaking practice</li>
        <li style={s.li}>To send a daily practice reminder, if you turn that on</li>
      </ul>
      <p style={s.p}>
        We do <strong style={s.strong}>not</strong> sell your information, share
        it with advertisers, or use it for advertising of any kind.
      </p>

      <h2 style={s.h2}>Where your information is stored</h2>
      <p style={s.p}>
        Your information is stored using <strong style={s.strong}>Google Firebase</strong>.
        Data is transmitted over an encrypted connection and stored on
        Google&apos;s servers, which may be located outside India.
      </p>

      <h2 style={s.h2}>Who can see your information</h2>
      <ul style={s.ul}>
        <li style={s.li}><strong style={s.strong}>You</strong> — all of it</li>
        <li style={s.li}><strong style={s.strong}>Your teacher</strong> — your name, contact details, course and progress</li>
        <li style={s.li}><strong style={s.strong}>Nobody else.</strong> Other students cannot see your name, email, phone number or progress.</li>
      </ul>

      <h2 style={s.h2}>Deleting your account</h2>
      <p style={s.p}>You can delete your account at any time:</p>
      <ul style={s.ul}>
        <li style={s.li}><strong style={s.strong}>In the app:</strong> Profile → Delete my account</li>
        <li style={s.li}>
          <strong style={s.strong}>From this website:</strong>{' '}
          <a style={s.a} href="/delete-account">pioneermorinda.com/delete-account</a>
        </li>
      </ul>
      <p style={s.p}>
        Deleting your account permanently removes your progress, scores and
        speaking practice history. This cannot be undone.
      </p>

      <h2 style={s.h2}>Notifications</h2>
      <p style={s.p}>
        If you turn on daily reminders, the app schedules them on your phone. You
        can turn them off at any time in Profile, or in your phone&apos;s settings.
      </p>

      <h2 style={s.h2}>Children</h2>
      <p style={s.p}>
        Lexio is intended for students aged 13 and over. If you are under 18,
        please ask a parent or guardian before creating an account. If you
        believe a child under 13 has created an account, contact us and we will
        delete it.
      </p>

      <h2 style={s.h2}>Payments</h2>
      <p style={s.p}>
        Lexio does not take payment inside the app. Course fees are paid directly
        to Pioneer Education Center. We do not collect or store card details, UPI
        IDs, or any other payment information.
      </p>

      <h2 style={s.h2}>Changes to this policy</h2>
      <p style={s.p}>
        If we change this policy we will update the date at the top of this page.
        If the change is significant, we will tell you in the app.
      </p>

      <h2 style={s.h2}>Contact us</h2>
      <p style={s.p}>
        <strong style={s.strong}>Pioneer Education Center</strong><br />
        1st Floor, Kalsi Cafe, Opp. Khalsa Girls College<br />
        Prem Nagar, Morinda 140101, Punjab, India<br />
        Phone: <a style={s.a} href="tel:+917380261308">+91 73802 61308</a><br />
        Email: <a style={s.a} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <div style={s.footer}>
        © {new Date().getFullYear()} Pioneer Education Center ·{' '}
        <a style={s.a} href="/">Back to pioneermorinda.com</a>
      </div>
    </main>
  );
}
