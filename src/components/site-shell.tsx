"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SiteShellProps = {
  children: React.ReactNode;
};

const navLinks = [
  { label: "Work", href: "/" },
  { label: "Play", href: "/play" },
  { label: "Info", href: "/info" },
];

const footerLinks = [
  { label: "GitHub", href: "https://github.com/dvncvn" },
  { label: "LinkedIn", href: "https://linkedin.com/in/simonduncan" },
  { label: "Email", href: "mailto:hello@simonduncan.com" },
];

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname.startsWith("/work");
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-[72px] w-full max-w-[1400px] items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-sm font-medium uppercase text-foreground"
            >
              SIMON DVNCVN
            </Link>
            <span className="text-sm" aria-hidden="true">🌱</span>
          </div>
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={
                  isActive(link.href)
                    ? "text-accent"
                    : "text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-6">{children}</main>

      <footer className="mt-32">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>Made in Madison WI</span>
          <div className="flex flex-wrap gap-6">
            {footerLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target={link.href.startsWith("http") ? "_blank" : undefined}
                rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
