import type { Metadata } from "next";
import "./globals.css";
import { EVENT } from "@/lib/event";
import { dateLong } from "@/lib/format";

const DESCRIPTION = `Join ${EVENT.host} for an exclusive charter fishing trip on Long Island Sound. ${dateLong(EVENT.sailAt)} at ${EVENT.venue}, ${EVENT.city}, ${EVENT.state}. Sponsored by Komprise and Illumio.`;

export const metadata: Metadata = {
  title: `${EVENT.title} | Charter Fishing Event — August 25, 2026`,
  description: DESCRIPTION,
  // The URL goes out over email to invited customers. Keep it out of indexes.
  robots: { index: false, follow: false },
  openGraph: {
    title: `${EVENT.title} — Charter Fishing Event`,
    description: DESCRIPTION,
    type: "website",
    url: "/",
    siteName: EVENT.title,
    images: [
      {
        url: "/img/middlebank.jpg",
        width: 1200,
        height: 630,
        alt: `${EVENT.title} — Charter Fishing Event`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${EVENT.title} — Charter Fishing Event`,
    description: DESCRIPTION,
    images: ["/img/middlebank.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-white antialiased">{children}</body>
    </html>
  );
}
