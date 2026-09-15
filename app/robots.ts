import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The practice portal is for enrolled students only. The login already
      // blocks access; this keeps the URLs out of search results as well.
      disallow: ["/practice", "/practice/"],
    },
    sitemap: "https://www.pioneermorinda.com/sitemap.xml",
  };
}
