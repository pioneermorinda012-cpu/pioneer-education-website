import Link from "next/link";
import SiteNav from "../../components/SiteNav";
import { getChannelVideos } from "@/lib/youtube";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free English & German Video Lessons — Pioneer Education, Morinda",
  description:
    "Free video lessons on English tenses, grammar, IELTS and German from Pioneer Education Center, Prem Nagar, Morinda. Taught by Narinder Singh, with explanations in Punjabi and Hindi.",
};

// ⚠️  A PUBLIC PAGE, NOT BEHIND THE STUDENT LOGIN.
//
// The existing lesson videos sit behind /practice, which is right for
// paid course material. These are different: they are already public
// on YouTube, so hiding them behind a login protects nothing and costs
// the one thing they are good for — somebody in Morinda searching
// "present perfect tense in Punjabi", finding this page, and only then
// discovering the centre and the app.
//
// Revalidated hourly by lib/youtube.ts, so a video posted between
// classes is on the site the same morning without a deploy.
export const revalidate = 3600;

export default async function VideosPage() {
  const videos = await getChannelVideos();
  const wa =
    "https://wa.me/917380261308?text=" +
    encodeURIComponent("Hi Pioneer Education, I saw your video lessons and would like to know about your classes.");

  return (
    <>
      <SiteNav ctaHref={wa} />

      <section style={{ paddingBottom: 0 }}>
        <div className="wrap">
          <div className="eyebrow">Free to watch · Prem Nagar, Morinda</div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: "2.6rem", fontWeight: 600, color: "var(--navy)", lineHeight: 1.15, marginBottom: "18px" }}>
            Video lessons
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--grey)", maxWidth: "640px" }}>
            Grammar, tenses, IELTS and German — taught the same way they are taught in
            class at Pioneer Education Center, with explanations in Punjabi and Hindi
            where they help.
          </p>
        </div>
      </section>

      <section>
        <div className="wrap">
          {videos.length === 0 ? (
            // ⚠️  THE PAGE MUST STILL BE USEFUL WHEN THE FEED IS NOT.
            // If YouTube is slow or the feed shape changes, a visitor
            // should get a way through to the videos rather than an
            // empty page that looks broken.
            <div style={{ padding: "32px", background: "var(--cream, #FAF7F2)", borderRadius: "14px" }}>
              <p style={{ color: "var(--grey)", marginBottom: "14px" }}>
                Our lessons are on YouTube.
              </p>
              <a
                className="btn"
                href="https://www.youtube.com/@pioneereducationmorinda/videos"
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch on YouTube
              </a>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
                gap: "22px",
              }}
            >
              {videos.map((v) => (
                <a
                  key={v.id}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    textDecoration: "none",
                    border: "1px solid #E8E2D9",
                    borderRadius: "14px",
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    loading="lazy"
                    width={480}
                    height={360}
                    style={{ width: "100%", height: "auto", display: "block", aspectRatio: "16/9", objectFit: "cover" }}
                  />
                  <div style={{ padding: "14px 16px 18px" }}>
                    <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--navy)", lineHeight: 1.35, margin: 0 }}>
                      {v.title}
                    </h2>
                    {!!v.published && (
                      <div style={{ fontSize: "0.8rem", color: "var(--grey)", marginTop: "6px" }}>
                        {new Date(v.published).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}

          <div style={{ marginTop: "34px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a
              className="btn"
              href="https://www.youtube.com/@pioneereducationmorinda"
              target="_blank"
              rel="noopener noreferrer"
            >
              More on YouTube
            </a>
            <Link className="btn" href="/admission" style={{ background: "#fff", color: "var(--coral-dark)" }}>
              Join a course
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
