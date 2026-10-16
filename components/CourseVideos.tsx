/* The demo lesson and the course explainer, side by side under the course
 * title. A YouTube link is embedded so the student watches it on the page; any
 * other link (Google Drive, Instagram) opens in a new tab, because those sites
 * do not allow their players inside another site. */

type Props = { demo?: string; explain?: string };

/** The id from any normal YouTube link: watch?v=, youtu.be/, shorts/, embed/. */
function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/))([\w-]{11})/i);
  return m ? m[1] : null;
}

function Video({ url, title }: { url: string; title: string }) {
  const id = youTubeId(url);
  return (
    <div className="cv-item">
      <h3 className="cv-title">{title}</h3>
      {id ? (
        <div className="cv-frame">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}`}
            title={title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : (
        <a className="btn btn-outline" href={url} target="_blank" rel="noopener noreferrer">
          ▶ Watch: {title}
        </a>
      )}
    </div>
  );
}

export default function CourseVideos({ demo, explain }: Props) {
  if (!demo && !explain) return null;
  return (
    <section style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cv-grid">
          {demo && <Video url={demo} title="Watch a demo class" />}
          {explain && <Video url={explain} title="About this course" />}
        </div>
      </div>
    </section>
  );
}
