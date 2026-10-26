import type { MetadataRoute } from "next";

/* Lets students add the site to their home screen like an app. On iPhone this
 * is required before practice reminders can be turned on (Apple's rule). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pioneer Education — Practice",
    short_name: "Pioneer",
    description: "IELTS, PTE, English and German practice for Pioneer Education students.",
    start_url: "/practice",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#DB6A0C",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
