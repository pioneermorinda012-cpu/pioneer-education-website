import { youTubeId } from "@/lib/learn";

/* A "watch this first" strip that opens into the YouTube video in place.
 * Closed by default, so the writing page stays short; the player only loads
 * when the student opens it. Plain <details>, so it works without client JS. */
export default function VideoNote({ url, children, label = "▶ Watch the video" }: {
  url: string; children: React.ReactNode; label?: string;
}) {
  const id = youTubeId(url);
  if (!id) return null;
  return (
    <details className="ln-first ln-video">
      <summary>
        <span>{children}</span>
        <span className="btn btn-coral">{label}</span>
      </summary>
      <div className="ln-frame">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
          title="Video lesson"
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </details>
  );
}
