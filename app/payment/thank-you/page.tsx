import { Suspense } from "react";
import SiteNav from "../../../components/SiteNav";
import ThankYouBody from "../../../components/payment/ThankYouBody";
import type { Metadata } from "next";

/* Where Razorpay sends the student after paying. Set this page as the
 * "redirect after payment" address on each payment link.
 *
 * The LOGIN ITSELF is still created only by the webhook (app/api/razorpay/
 * webhook) — anyone can open this URL by hand, only Razorpay can sign a
 * webhook. What this page adds is a shortcut: if Razorpay's redirect
 * carries its own signed parameters (razorpay_payment_id, razorpay_
 * signature and friends), ThankYouBody lets the student pick their own
 * password immediately instead of waiting for the emailed one. If those
 * parameters are missing — some payment methods do not reliably return to
 * the browser — it falls back to the original "check your email" message. */

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
          <Suspense fallback={
            <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "2.2rem", color: "var(--navy)", margin: "0 0 16px" }}>
              Thank you — welcome to Pioneer Education.
            </h1>
          }>
            <ThankYouBody waHref={WA} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
