import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pioneer Education â€” IELTS, PTE, Spoken English & German | Morinda, Punjab",
  description:
    "Pioneer Education Center, Prem Nagar, Morinda, Punjab â€” IELTS, PTE, Spoken English & German coaching since 2017, led by Narinder Singh. Rated 5.0 stars from 125+ students. Practice with our Lexio app and real test simulations.",
  metadataBase: new URL("https://pioneermorinda.com"),
  openGraph: {
    title: "Pioneer Education â€” IELTS, PTE, Spoken English & German",
    description:
      "IELTS, PTE, Spoken English & German coaching in Morinda, Punjab. 5.0â˜… rating, 125+ reviews. Free demo class available.",
    url: "https://pioneermorinda.com",
    siteName: "Pioneer Education Center",
    locale: "en_IN",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Pioneer Education Center",
  alternateName: "Pioneer Spoken English IELTS",
  description:
    "IELTS, PTE, Spoken English and German A1â€“B1 coaching in Prem Nagar, Morinda, Punjab. Established 2017.",
  url: "https://pioneermorinda.com",
  telephone: "+91-98559-91214",
  foundingDate: "2017",
  address: {
    "@type": "PostalAddress",
    streetAddress: "1st Floor, Kalsi Cafe, Opp. Khalsa Girls College, Prem Nagar",
    addressLocality: "Morinda",
    addressRegion: "Punjab",
    postalCode: "140101",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 30.7918389,
    longitude: 76.496942,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "5.0",
    reviewCount: "125",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:30",
      closes: "19:00",
    },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Courses",
    itemListElement: [
      { "@type": "Course", name: "IELTS Coaching", description: "Academic & General Training preparation for all four modules.", provider: { "@type": "Organization", name: "Pioneer Education Center" } },
      { "@type": "Course", name: "PTE Coaching", description: "Computer-delivered test strategy and timed practice.", provider: { "@type": "Organization", name: "Pioneer Education Center" } },
      { "@type": "Course", name: "Spoken English", description: "Confidence-first speaking practice, beginner to advanced.", provider: { "@type": "Organization", name: "Pioneer Education Center" } },
      { "@type": "Course", name: "German A1â€“B1", description: "Structured German for study and work visas.", provider: { "@type": "Organization", name: "Pioneer Education Center" } },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
