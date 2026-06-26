import "./globals.css";

export const metadata = {
  title: "Pioneer Education — IELTS, PTE, Spoken English & German | Morinda",
  description: "Top language coaching in Morinda, Punjab. IELTS, PTE, Spoken English, German A1–B1. Online & offline batches. Free demo class available.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}