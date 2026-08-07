// ═══════════════════════════════════════════════════════════════════
// ACCOUNT DELETION — pioneermorinda.com/delete-account
// ═══════════════════════════════════════════════════════════════════
//
// Drop this into your Next.js site at:  app/delete-account/page.tsx
//
// ⚠️  THIS PAGE IS REQUIRED BY GOOGLE PLAY, AND IT IS THE ONE MOST
// PEOPLE MISS.
//
// Play requires that any app allowing account creation also allows
// deletion BOTH in the app AND from a public web page. The web page
// exists for someone who has already uninstalled the app — they can no
// longer reach the in-app button, but they still have data with you.
//
// An app with in-app deletion but no web page still gets rejected.
//
// ⚠️  BEFORE PUBLISHING: replace CONTACT_EMAIL with an address you
// actually monitor. Deletion requests will arrive there, and Play
// expects them to be honoured.
// ═══════════════════════════════════════════════════════════════════

import type { Metadata } from 'next';

const CONTACT_EMAIL = 'pioneermorinda012@gmail.com';
const WHATSAPP = '917380261308';

export const metadata: Metadata = {
  title: 'Delete your Lexio account | Pioneer Education Center',
  description:
    'How to delete your Lexio account and all associated data — in the app, or by contacting Pioneer Education Center.',
};

const s = {
  page: { maxWidth: 720, margin: '0 auto', padding: '48px 20px 96px', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', color: '#39414D', lineHeight: 1.7 },
  h1: { fontSize: 34, lineHeight: 1.2, letterSpacing: '-0.02em', color: '#12161C', margin: '0 0 8px' },
  lead: { fontSize: 17, color: '#57534E', margin: '0 0 40px' },
  h2: { fontSize: 20, lineHeight: 1.3, color: '#12161C', margin: '40px 0 12px' },
  p: { fontSize: 16, margin: '0 0 16px' },
  ol: { fontSize: 16, margin: '0 0 16px', paddingLeft: 22 },
  li: { margin: '0 0 10px' },
  card: { background: '#FFFFFF', border: '1px solid #E6E8EC', borderRadius: 12, padding: '24px 24px 8px', margin: '0 0 20px' },
  warn: { background: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '3px solid #B91C1C', borderRadius: 10, padding: '16px 20px', margin: '0 0 28px' },
  btn: { display: 'inline-block', background: '#4F46E5', color: '#fff', textDecoration: 'none', padding: '13px 24px', borderRadius: 10, fontWeight: 600, fontSize: 15, marginRight: 12, marginBottom: 12 },
  btnAlt: { display: 'inline-block', background: '#fff', color: '#12161C', textDecoration: 'none', padding: '12px 23px', borderRadius: 10, fontWeight: 600, fontSize: 15, border: '1px solid #CDD2D9', marginBottom: 12 },
  strong: { color: '#12161C', fontWeight: 600 },
  footer: { marginTop: 56, paddingTop: 24, borderTop: '1px solid #E6E8EC', fontSize: 14, color: '#8E939B' },
  a: { color: '#4F46E5' },
  step: { fontSize: 13, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#8E939B', fontWeight: 700, margin: '0 0 8px' },
} as const;

export default function DeleteAccount() {
  const mailto =
    `mailto:${CONTACT_EMAIL}` +
    `?subject=${encodeURIComponent('Delete my Lexio account')}` +
    `&body=${encodeURIComponent(
      'Please delete my Lexio account and all my data.\n\n' +
      'My registered email address: \n' +
      'My name: \n\n' +
      'I understand this cannot be undone.'
    )}`;

  return (
    <main style={s.page}>
      <h1 style={s.h1}>Delete your Lexio account</h1>
      <p style={s.lead}>
        You can delete your account and all your data at any time. Here are two
        ways to do it.
      </p>

      <div style={s.warn}>
        <p style={{ ...s.p, margin: 0 }}>
          <strong style={s.strong}>This cannot be undone.</strong> Deleting your
          account permanently removes your progress, quiz scores, XP, streak and
          speaking practice history. If you come back later you will start again
          from the placement test.
        </p>
      </div>

      <div style={s.card}>
        <p style={s.step}>Option 1 — fastest</p>
        <h2 style={{ ...s.h2, margin: '0 0 12px' }}>Delete it in the app</h2>
        <ol style={s.ol}>
          <li style={s.li}>Open the Lexio app</li>
          <li style={s.li}>Go to the <strong style={s.strong}>Profile</strong> tab</li>
          <li style={s.li}>Scroll to the bottom and tap <strong style={s.strong}>Delete my account</strong></li>
          <li style={s.li}>Confirm twice</li>
        </ol>
        <p style={s.p}>Your account is removed immediately.</p>
      </div>

      <div style={s.card}>
        <p style={s.step}>Option 2 — if you already uninstalled</p>
        <h2 style={{ ...s.h2, margin: '0 0 12px' }}>Ask us to delete it</h2>
        <p style={s.p}>
          Send us the email address you registered with. We will delete your
          account and all associated data within{' '}
          <strong style={s.strong}>30 days</strong> and confirm by email.
        </p>
        <p style={{ margin: '20px 0 0' }}>
          <a style={s.btn} href={mailto}>Email us</a>
          <a
            style={s.btnAlt}
            href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent('Hi, please delete my Lexio account.')}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp us
          </a>
        </p>
      </div>

      <h2 style={s.h2}>What gets deleted</h2>
      <ul style={s.ol}>
        <li style={s.li}>Your name, email address and phone number</li>
        <li style={s.li}>Your placement test result and enrolled course</li>
        <li style={s.li}>All lesson progress, quiz scores, XP and streak</li>
        <li style={s.li}>Your speaking practice history</li>
        <li style={s.li}>Your login credentials</li>
      </ul>

      <h2 style={s.h2}>What we may keep</h2>
      <p style={s.p}>
        If you have paid course fees at the centre, we keep the payment record
        for accounting purposes as required by law. That record contains your
        name and the amount paid — nothing about your app usage.
      </p>

      <h2 style={s.h2}>Questions</h2>
      <p style={s.p}>
        <strong style={s.strong}>Pioneer Education Center</strong><br />
        1st Floor, Kalsi Cafe, Opp. Khalsa Girls College<br />
        Prem Nagar, Morinda 140101, Punjab, India<br />
        Phone: <a style={s.a} href="tel:+917380261308">+91 73802 61308</a><br />
        Email: <a style={s.a} href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <div style={s.footer}>
        © {new Date().getFullYear()} Pioneer Education Center ·{' '}
        <a style={s.a} href="/privacy">Privacy policy</a> ·{' '}
        <a style={s.a} href="/">Back to pioneermorinda.com</a>
      </div>
    </main>
  );
}
