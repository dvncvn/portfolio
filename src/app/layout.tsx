import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Jacquard_24 } from "next/font/google";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const jacquard24 = Jacquard_24({
  variable: "--font-jacquard-24",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Simon Duncan | Portfolio",
  description: "Staff product designer portfolio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable} ${jacquard24.variable}`}>
      <body className="antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
