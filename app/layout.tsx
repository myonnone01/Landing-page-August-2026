import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { EVENT } from "@/lib/event";

/** Display face — picked for its squarish figures, since numerals carry this page. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

/** Body face. Drawn for engineering documentation — instrument feel, not cold. */
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/** Same family, monospaced. Readouts and the schedule. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: `${EVENT.host} on ${EVENT.boat} — Tuesday, August 25`,
  description: `A private charter out of ${EVENT.venue} in ${EVENT.city}. Sails at 4:00 PM, back at the dock by 8:00 PM. All gear provided.`,
  // The URL goes out over email to invited customers. Keep it out of indexes.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
