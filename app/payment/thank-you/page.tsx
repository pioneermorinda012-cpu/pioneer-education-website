import Link from "next/link";
import SiteNav from "../../../components/SiteNav";
import type { Metadata } from "next";

/* Where Razorpay sends the student after paying. Set this page as the
 * "redirect after payment" address on each payment link. The login itself is
 * created by the webhook (app/api/razorpay/webhook), not by this page: anyone
 * can open a URL, only Razorpay can sign a webhook. */

export const metadata: Metadata = {
  title: "Payment received — Pioneer Education",
  robots: { index: false },
};

const WA = `https://wa.me/917380261308?text=${encodeURIComponent(
  "Hi Pioneer Education, I have just paid online. Please confirm my admission.",
)}`;

export default function ThankYou() {
  return (
    <>
      <SiteNav ctaHref={WA} />
      <section>
        <div className="wrap" style={{ maxWidth: 680 }}>
          <div className="section-eyebrow">Payment received</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "2.2rem", color: "var(--navy)", margin: "0 0 16px" }}>
            Thank you — welcome to Pioneer Education.
          </h1>
          <p style={{ fontSize: "1.05rem", lineHeight: 1.7, color: "var(--ink)" }}>
            Your payment has gone through. Within a few minutes we email you your <b>student login</b> — a
            student code and a password — at the email address you gave Razorpay. Use it to sign in to the
            practice tests.
          </p>
          <ul style={{ lineHeight: 1.9, color: "var(--ink)", paddingLeft: 20, margin: "18px 0" }}>
            <li>No email after 15 minutes? Check the Spam or Promotions folder.</li>
            <li>Keep your Razorpay receipt — it has your payment ID.</li>
            <li>Lost your password later? Use “Forgot password” on the sign-in page.</li>
          </ul>
          <div className="hero-ctas" style={{ marginTop: 24 }}>
            <Link href="/practice/sign-in" className="btn btn-coral">Go to student sign in</Link>
            <a href={WA} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Message us on WhatsApp</a>
          </div>
        </div>
      </section>
    </>
  );
}
