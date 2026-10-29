/**
 * Channel videos, read from YouTube's RSS feed.
 *
 * ⚠️  A FEED, NOT A HAND-TYPED LIST.
 *
 * The obvious approach is an array of video IDs in a file. It breaks
 * the first time a video is uploaded and nobody remembers to edit the
 * code — which, for a centre that posts lessons between classes, is
 * roughly the second video. Reading the feed means the page is correct
 * the moment a video goes live, with no deploy.
 *
 * ⚠️  NO API KEY, DELIBERATELY.
 * The YouTube Data API would give richer data and needs a key, a quota
 * and a billing account attached to it. The RSS feed is public, needs
 * nothing, and carries everything this page shows: id, title,
 * description, date. The one limit is that it returns only the latest
 * 15 videos — which is why `matching()` exists, so a topic page can
 * pick out what it wants rather than assuming everything is present.
 */

const CHANNEL_ID = "UCmhXkT6aPgjmEKAIFHBrgrg"; // @pioneereducationmorinda
const FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export type Video = {
  id: string;
  title: string;
  description: string;
  published: string;
  url: string;
  thumbnail: string;
};

/** Entities YouTube escapes in titles. Decoded here because the title
 *  is rendered as text, and "Don&amp;#39;t" on a page looks broken. */
function decode(s: string): string {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'").replace(/&amp;/g, "&")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? decode(m[1]) : "";
}

export async function getChannelVideos(): Promise<Video[]> {
  try {
    const res = await fetch(FEED, {
      // Cached for an hour. Long enough that a burst of visitors does
      // not hammer YouTube, short enough that a new video appears the
      // same morning it is posted.
      next: { revalidate: 3600 },
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PioneerEducation/1.0)" },
    });
    if (!res.ok) return [];

    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);

    return entries.map((e) => {
      const id = tag(e, "yt:videoId");
      return {
        id,
        title: tag(e, "title"),
        description: tag(e, "media:description").slice(0, 300),
        published: tag(e, "published"),
        url: `https://www.youtube.com/watch?v=${id}`,
        // i.ytimg.com rather than the feed's media:thumbnail: the feed
        // gives a low-resolution image, and hqdefault exists for every
        // video without another request.
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    }).filter((v) => v.id);
  } catch {
    // ⚠️  NEVER THROW FROM HERE.
    // This runs during server rendering. A thrown error would take the
    // whole page down because YouTube was briefly unreachable — far
    // worse than a page that simply shows no videos this hour.
    return [];
  }
}

/** Videos whose title mentions any of these words. Case-insensitive.
 *  Used to build a topic page out of a mixed channel. */
export function matching(videos: Video[], words: string[]): Video[] {
  const needles = words.map((w) => w.toLowerCase());
  return videos.filter((v) => {
    const t = v.title.toLowerCase();
    return needles.some((n) => t.includes(n));
  });
}
