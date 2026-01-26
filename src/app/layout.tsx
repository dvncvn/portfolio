import type { Metadata } from "next";
import { Geist, Geist_Mono, Jacquard_24 } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
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
  icons: {
    icon: "/assets/favi.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${jacquard24.variable}`}
    >
      <body className="antialiased">
        <SiteShell>{children}</SiteShell>
        <SpeedInsights />
      </body>
    </html>
  );
}
